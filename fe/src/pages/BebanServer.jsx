import { useState } from 'react'
import { Info } from 'lucide-react'
import { useMonitor } from '../context/MonitorContext'
import { Card, Legend, Measured, PageHead, Skel, Tabs } from '../components/ui'
import { LoadChart, COLORS } from '../components/charts'
import { bytes, dateTime, num, pct } from '../lib/format'
import { RANGES, useRange } from '../lib/useRange'
import { SERVER } from '../lib/series'

function LoadCard({ k, label, value, sub, t }) {
  const { status, thresholds, level } = useMonitor()
  const lv = level(k, value)
  const th = thresholds[k]
  const waiting = status === 'menunggu'
  return (
    <div className="card card-pad load-card">
      <div className="load-top">
        <div>
          {waiting ? <Skel w={110} h={34} /> : <div className={`load-value lvl-${lv}`}>{pct(value)}</div>}
          <div className="muted small">{label}</div>
        </div>
        <ul className="th-legend">
          <li><i style={{ background: '#D97706' }} />Peringatan {th.warn}%</li>
          <li><i style={{ background: '#DC2626' }} />Kritis {th.crit}%</li>
          <li className="sub">{waiting ? '—' : sub}</li>
        </ul>
      </div>
      <div className="meter">
        <span className={`lvl-bg-${lv}`} style={{ width: `${waiting ? 0 : value}%` }} />
        <i style={{ left: `${th.warn}%` }} /><i style={{ left: `${th.crit}%` }} className="crit" />
      </div>
      {waiting ? <p className="measured">— <span>Belum ada data</span></p> : <Measured t={t} />}
    </div>
  )
}

export default function BebanServer() {
  const { latest, status, thresholds, source } = useMonitor()
  const [range, setRange] = useState('1h')
  const { rows, stepMs, res } = useRange(range)
  const waiting = status === 'menunggu'
  const L = latest || {}
  const used = ((L.disk ?? 0) / 100) * SERVER.diskTotal
  const free = SERVER.diskTotal - used
  const fmtLabel = range === '7d' || range === '24h' ? (t) => dateTime(t) : undefined
  const label = RANGES.find((r) => r.value === range).label

  return (
    <>
      <PageHead
        title="Beban Server"
        sub={`Penggunaan resource server ${source.name} secara real-time.`}
        right={<Tabs value={range} onChange={setRange} options={RANGES} />}
      />
      <div className="grid-3">
        <LoadCard k="cpu" label="CPU" value={L.cpu} sub={`${SERVER.cores} inti logis`} t={L.t} />
        <LoadCard k="ram" label="RAM" value={L.ram} sub={`${bytes((L.ram / 100) * SERVER.ramTotal, 1)} dari 2 GB`} t={L.t} />
        <LoadCard k="disk" label={`Disk ${source.fs}`} value={L.disk} sub={`${num(used / 1024 ** 3)} GB terpakai dari 60 GB`} t={L.t} />
      </div>
      <div className="grid-main">
        <Card title="Penggunaan CPU & RAM" sub={`Persentase · ${label} terakhir · Resolusi: ${res}`} right={<Legend items={[{ label: 'CPU', color: COLORS.IN }, { label: 'RAM', color: COLORS.OUT }, { label: 'Tidak ada data', color: '#D1D5DB' }]} />}>
          {waiting ? <Skel h={340} r={10} /> : <LoadChart rows={rows} height={340} stepMs={stepMs} thresholds={thresholds} labelFmt={fmtLabel} />}
        </Card>
        <Card title={`Kapasitas Disk ${source.fs}`} sub={waiting ? 'Belum ada data' : `Diukur ${dateTime(L.t)} · Sumber: psutil`}>
          {waiting ? <Skel h={180} r={10} /> : (
            <>
              <div className="disk-big">{num(used / 1024 ** 3)} GB <span>terpakai</span></div>
              <div className="meter meter-lg"><span className="lvl-bg-normal" style={{ width: `${L.disk}%` }} /></div>
              <div className="disk-3">
                <div><strong>{num(used / 1024 ** 3)} GB</strong><span>Terpakai</span></div>
                <div><strong>{num(free / 1024 ** 3)} GB</strong><span>Tersedia</span></div>
                <div><strong>60 GB</strong><span>Total</span></div>
              </div>
            </>
          )}
          <div className="info-note"><Info size={16} />Ambang hanya mengubah warna tampilan, tidak mengubah nilai pengukuran.</div>
        </Card>
      </div>
    </>
  )
}
