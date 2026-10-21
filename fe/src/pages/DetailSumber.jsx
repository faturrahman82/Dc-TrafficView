import { useMemo } from 'react'
import { useMonitor } from '../context/MonitorContext'
import { Badge, Card, PageHead } from '../components/ui'
import { aggregate, SERVER } from '../lib/series'
import { dateTime, hm, num, time } from '../lib/format'

const TYPE_CLS = { pulih: 'txt-green', gagal: 'txt-red', warn: 'txt-amber', info: '' }

export default function DetailSumber() {
  const { status, outages, events, source } = useMonitor()
  const endSec = Math.floor(Date.now() / 1000 / 60) * 60
  const bars = useMemo(() => {
    const step = 1800
    const start = endSec - 48 * step
    return aggregate(start, endSec, step, outages, { stride: 20 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.floor(endSec / 300), JSON.stringify(outages)])
  const total = bars.reduce((a, b) => a + b.total, 0)
  const valid = bars.reduce((a, b) => a + b.valid, 0)
  const uptime = total ? (valid / total) * 100 : 0
  const disturb = events.filter((e) => e.type === 'gagal' || e.type === 'warn').length + 1
  const lastDown = events.find((e) => e.type === 'gagal' || e.type === 'warn')
  const lastUp = events.find((e) => e.type === 'pulih')

  const barCls = (b, i) => {
    if (i === bars.length - 1) {
      if (status === 'terputus') return 'hb-red'
      if (status === 'kedaluwarsa') return 'hb-amber'
      if (status === 'menunggu') return 'hb-grey'
    }
    return b.valid / b.total < 0.9 ? 'hb-grey' : 'hb-green'
  }

  return (
    <>
      <PageHead title="Detail Sumber" sub="Identitas, kesehatan pengumpulan, dan kejadian sistem." />
      <div className="grid-2">
        <Card title="Informasi Sumber" right={status === 'terbaru' ? <Badge tone="green">Dipantau</Badge> : status === 'menunggu' ? <Badge tone="grey" icon={false}>Menunggu data</Badge> : status === 'kedaluwarsa' ? <Badge tone="amber" icon={false}>Tidak diperbarui</Badge> : <Badge tone="red" icon={false}>Terputus</Badge>}>
          <dl className="info-list">
            <div><dt>Nama sumber</dt><dd>{source.name}</dd></div>
            <div><dt>Jenis</dt><dd>{SERVER.type}</dd></div>
            <div><dt>Sistem operasi</dt><dd>{SERVER.os}</dd></div>
            <div><dt>Kernel</dt><dd>{SERVER.kernel}</dd></div>
            <div><dt>Filesystem utama</dt><dd>{source.fs} ({SERVER.fsType})</dd></div>
            <div><dt>Interface jaringan</dt><dd>{source.iface}</dd></div>
            <div><dt>Mulai dipantau</dt><dd>{dateTime(SERVER.monitoredSince).replace(':00 WIB', ' WIB')}</dd></div>
          </dl>
        </Card>
        <Card title="Kesehatan Pengumpulan" sub="24 jam terakhir">
          <div className="health-stats">
            <div><strong>{num(uptime, 1)}%</strong><span>Waktu aktif pengumpulan</span></div>
            <div><strong>{disturb}</strong><span>Gangguan singkat</span></div>
          </div>
          <div className="hbars">
            {bars.map((b, i) => <span key={b.t} className={barCls(b, i)} title={`${dateTime(b.t)} · ${Math.round((b.valid / b.total) * 100)}% data masuk`} />)}
          </div>
          <div className="hbar-axis"><span>Kemarin, {hm(bars[0]?.t ?? Date.now())}</span><span>Sekarang, {hm(Date.now())}</span></div>
          <div className="hmarks">
            {lastDown && <span><i className="dot-red" />{lastDown.type === 'warn' ? 'Kedaluwarsa' : 'Terputus'} {time(lastDown.t)}</span>}
            {lastUp && <span><i className="dot-green" />Pulih {time(lastUp.t)}</span>}
          </div>
          <div className="legend">
            <span><i style={{ background: '#4CB872' }} />Data masuk</span>
            <span><i style={{ background: '#D1D5DB' }} />Tidak ada data</span>
            <span><i style={{ background: '#D97706' }} />Kedaluwarsa</span>
            <span><i style={{ background: '#DC2626' }} />Terputus</span>
          </div>
        </Card>
      </div>
      <Card className="mt" title="Catatan Kejadian Sistem" sub="Waktu ditampilkan dalam WIB">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Waktu</th><th>Jenis</th><th>Keterangan</th></tr></thead>
            <tbody>
              {events.slice(0, 15).map((e) => (
                <tr key={e.id}>
                  <td>{dateTime(e.t)}</td>
                  <td className={`strong ${TYPE_CLS[e.type]}`}>{e.title}</td>
                  <td>{e.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
