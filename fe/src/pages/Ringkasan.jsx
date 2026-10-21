import { Link } from 'react-router-dom'
import { Cpu, MemoryStick, Database, ArrowDown, ArrowUp, History } from 'lucide-react'
import { useMonitor } from '../context/MonitorContext'
import { Badge, Card, Legend, Measured, PageHead, Skel, Spark } from '../components/ui'
import { TrafficChart, COLORS } from '../components/charts'
import { bytes, num, pct, rate, time } from '../lib/format'
import { SERVER } from '../lib/series'

export function MetricCard({ icon: Icon, label, value, sub, k, level = 'normal', spark, t, color }) {
  const { status } = useMonitor()
  const waiting = status === 'menunggu'
  return (
    <div className="card card-pad metric">
      <div className="metric-icon"><Icon size={20} /></div>
      <div className="metric-label">{label}</div>
      {waiting ? (
        <>
          <Skel w="70%" h={30} style={{ margin: '8px 0 10px' }} />
          <Skel w="55%" h={12} />
          <Skel h={40} style={{ marginTop: 18 }} />
          <p className="measured">— <span>Belum ada data</span></p>
        </>
      ) : (
        <>
          <div className={`metric-value lvl-${level}`}>{value}</div>
          <div className="metric-sub">{sub}</div>
          <Spark data={spark} k={k} color={color} />
          <Measured t={t} />
        </>
      )}
    </div>
  )
}

export default function Ringkasan() {
  const m = useMonitor()
  const { latest, status, quality, level, win, avg, source } = m
  const waiting = status === 'menunggu'
  const spark = win(60)
  const L = latest || {}
  const traffic = win(900).map((s) => ({ t: s.t, rx: s.gap ? null : s.rx, tx: s.gap ? null : s.tx }))
  const completePct = quality.expected ? (quality.complete / quality.expected) * 100 : 0
  const running = status === 'terbaru'

  return (
    <>
      <PageHead
        title="Ringkasan"
        sub="Kondisi terkini server dan kualitas pengumpulan data."
        right={<Link to="/riwayat" className="btn btn-outline"><History size={18} /> Lihat riwayat</Link>}
      />
      <div className="grid-5">
        <MetricCard icon={Cpu} label="CPU" k="cpu" value={pct(L.cpu)} sub={`Rata-rata 5 mnt: ${pct(avg('cpu', 300))}`} level={level('cpu', L.cpu)} spark={spark} t={L.t} color={COLORS.IN} />
        <MetricCard icon={MemoryStick} label="RAM" k="ram" value={pct(L.ram)} sub={`${bytes((L.ram / 100) * SERVER.ramTotal, 1)} dari ${bytes(SERVER.ramTotal, 0)}`} level={level('ram', L.ram)} spark={spark} t={L.t} color={COLORS.OUT} />
        <MetricCard icon={Database} label={`Disk ${source.fs}`} k="disk" value={pct(L.disk)} sub={`${num((L.disk / 100) * 60)} GB dari 60 GB`} level={level('disk', L.disk)} spark={spark} t={L.t} color={COLORS.OUT} />
        <MetricCard icon={ArrowDown} label="Traffic Masuk" k="rx" value={rate(L.rx, { compact: true })} sub={`Interface ${source.iface}`} spark={spark} t={L.t} color={COLORS.IN} />
        <MetricCard icon={ArrowUp} label="Traffic Keluar" k="tx" value={rate(L.tx, { compact: true })} sub={`Interface ${source.iface}`} spark={spark} t={L.t} color={COLORS.OUT} />
      </div>

      <div className="grid-main">
        <Card
          title="Traffic Jaringan — 15 menit terakhir"
          sub={`Byte per detik · Interface ${source.iface}`}
          right={<Legend items={[{ label: 'Traffic Masuk', color: COLORS.IN }, { label: 'Traffic Keluar', color: COLORS.OUT }]} />}
        >
          {waiting ? <Skel h={360} r={10} /> : <TrafficChart rows={traffic} height={380} />}
        </Card>

        <div className="stack">
          <Card
            title="Kualitas Data"
            right={waiting ? <Badge tone="grey" icon={false}>Menunggu</Badge>
              : running ? <Badge tone="green">Pengumpulan berjalan</Badge>
              : status === 'kedaluwarsa' ? <Badge tone="amber" icon={false}>Tidak diperbarui</Badge>
              : <Badge tone="red" icon={false}>Terputus</Badge>}
          >
            <div className={`age-box age-${status}`}>
              <span>Umur data</span>
              {waiting ? <Skel w="50%" h={28} /> : <strong>{quality.age} detik</strong>}
              <small>{waiting ? 'Belum ada pengukuran' : `Diukur ${time(latest?.t)} WIB`}</small>
            </div>
            <dl className="kv">
              <div><dt>Jeda tampilan<small>Target ≤ 3 detik</small></dt><dd>{waiting ? '—' : `Rata-rata ${num(quality.lag, 1)} detik`}</dd></div>
              <div className="kv-col">
                <div className="kv-row"><dt>Kelengkapan 30 menit</dt><dd>{waiting ? '—' : <>{num(quality.complete)} / {num(quality.expected)} <em className={completePct >= 95 ? 'ok' : 'bad'}>{num(completePct, 1)}%</em></>}</dd></div>
                <div className="bar"><span style={{ width: `${waiting ? 0 : completePct}%`, background: completePct >= 95 ? '#16A34A' : '#D97706' }} /></div>
              </div>
              <div><dt>Sampel ditolak</dt><dd>{waiting ? '—' : `${quality.rejected} sampel`}</dd></div>
            </dl>
          </Card>

          <Card title="Identitas Sumber" right={<span className={`live live-${status}`}><i />{status === 'terbaru' ? 'Aktif' : status === 'menunggu' ? 'Menunggu' : status === 'kedaluwarsa' ? 'Tidak diperbarui' : 'Terputus'}</span>}>
            <dl className="kv kv-lines">
              <div><dt>Nama</dt><dd>{source.name}</dd></div>
              <div><dt>Jenis</dt><dd>{SERVER.type}</dd></div>
              <div><dt>Sistem operasi</dt><dd>Ubuntu 22.04</dd></div>
              <div><dt>Filesystem</dt><dd>{source.fs}</dd></div>
              <div><dt>Interface</dt><dd>{source.iface}</dd></div>
              <div><dt>Agen</dt><dd>{SERVER.agent}</dd></div>
              <div><dt>Interval</dt><dd>{SERVER.interval} detik</dd></div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  )
}
