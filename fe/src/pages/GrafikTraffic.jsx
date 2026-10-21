import { useState } from 'react'
import { Network } from 'lucide-react'
import { useMonitor } from '../context/MonitorContext'
import { Card, Legend, PageHead, Skel, Tabs } from '../components/ui'
import { TrafficChart, COLORS } from '../components/charts'
import { bytes, dateTime, rate, time } from '../lib/format'
import { RANGES, useRange } from '../lib/useRange'

export default function GrafikTraffic() {
  const { status, source } = useMonitor()
  const [range, setRange] = useState('5m')
  const { rows, stepMs, res } = useRange(range)
  const waiting = status === 'menunggu'

  const valid = rows.filter((r) => r.rx != null)
  const avgIn = valid.length ? valid.reduce((a, r) => a + r.rx, 0) / valid.length : null
  const peak = valid.reduce((p, r) => (p && p.rx >= r.rx ? p : r), null)
  const secs = (r) => (r.valid / r.total) * (stepMs / 1000)
  const totIn = valid.reduce((a, r) => a + r.rx * secs(r), 0)
  const totOut = valid.reduce((a, r) => a + r.tx * secs(r), 0)
  const label = RANGES.find((r) => r.value === range).label
  const fmtLabel = range === '7d' || range === '24h' ? (t) => dateTime(t) : undefined

  return (
    <>
      <PageHead
        title="Grafik Traffic"
        sub={`Analisis traffic masuk dan keluar dari interface ${source.iface}.`}
        right={<div className="chip"><Network size={16} /> Interface <b>{source.iface}</b></div>}
      />
      <Card
        title="Traffic Masuk vs Traffic Keluar"
        sub="Satuan menyesuaikan besar nilai (B/s, KB/s, MB/s)"
        right={<Tabs value={range} onChange={setRange} options={RANGES} />}
      >
        <div className="chart-meta">
          <Legend items={[{ label: 'Traffic Masuk', color: COLORS.IN }, { label: 'Traffic Keluar', color: COLORS.OUT }, { label: 'Tidak ada data', color: '#D1D5DB' }]} />
          <span className="res">Resolusi: {res}</span>
        </div>
        {waiting ? <Skel h={400} r={10} /> : <TrafficChart rows={rows} height={420} stepMs={stepMs} labelFmt={fmtLabel} />}
        <div className="stats4">
          <div><span>Rata-rata masuk</span><strong>{waiting ? '—' : rate(avgIn, { compact: true })}</strong><small>Rentang {label}</small></div>
          <div><span>Puncak masuk</span><strong>{waiting || !peak ? '—' : rate(peak.rx, { compact: true })}</strong><small>{peak ? `${range === '7d' || range === '24h' ? dateTime(peak.t) : time(peak.t) + ' WIB'}` : 'Belum ada data'}</small></div>
          <div><span>Total diterima</span><strong>{waiting ? '—' : bytes(totIn)}</strong><small>Dalam rentang terpilih</small></div>
          <div><span>Total dikirim</span><strong>{waiting ? '—' : bytes(totOut)}</strong><small>Dalam rentang terpilih</small></div>
        </div>
      </Card>
    </>
  )
}
