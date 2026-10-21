import { useMemo, useState } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useMonitor } from '../context/MonitorContext'
import { Card, Notice, PageHead, Skel } from '../components/ui'
import { MetricChart } from '../components/charts'
import { time, dateTime, longDate, num, todayInput, dayStart } from '../lib/format'
import { aggregate, METRICS } from '../lib/series'

const STEPS = [1, 5, 10, 30, 60, 300, 600, 900, 1800, 3600]
const PAGE = 15
const stepLabel = (s) => (s < 60 ? `${s} detik` : s < 3600 ? `${s / 60} menit` : `${s / 3600} jam`)

function valueOf(row, metric) {
  const v = row[metric]
  if (v == null) return null
  return metric === 'rx' || metric === 'tx' ? v / 1024 : v
}

export default function Riwayat() {
  const { status, outages, lastAt } = useMonitor()
  const today = todayInput(0)
  const minDay = todayInput(-6) // 7 hari terakhir (termasuk hari ini)
  const [form, setForm] = useState(() => ({ from: today, to: today, metric: 'rx' }))
  const [query, setQuery] = useState(form)
  const [page, setPage] = useState(0)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function submit(e) {
    e.preventDefault()
    setQuery(form); setPage(0)
  }

  const result = useMemo(() => {
    const fromMs = dayStart(query.from)
    const endDay = dayStart(query.to)
    if (fromMs == null || endDay == null) return { error: 'Pilih tanggal mulai dan tanggal selesai.' }
    if (fromMs > endDay) return { error: 'Tanggal mulai tidak boleh setelah tanggal selesai.' }
    const now = Date.now()
    if (fromMs > now) return { error: 'Tanggal mulai tidak boleh melewati hari ini.' }
    if (fromMs < dayStart(minDay)) return { error: 'Data riwayat hanya tersedia untuk 7 hari terakhir.' }
    const toMsRaw = endDay + 86400e3
    // data belum ada setelah pengukuran terakhir
    const limit = lastAt ? lastAt + 1000 : now
    const toMs = Math.min(toMsRaw, limit)
    if (toMs <= fromMs) return { error: 'Belum ada data pada rentang ini.' }
    const raw = fromMs >= now - 86400e3
    const fromSec = Math.floor(fromMs / 1000), toSec = Math.floor(toMs / 1000)
    const span = toSec - fromSec
    let step = STEPS.find((s) => span / s <= 720) ?? 3600
    if (!raw) step = Math.max(step, 60)
    const rows = aggregate(fromSec, toSec, step, outages, { stride: step > 600 ? 60 : step >= 60 ? Math.max(1, step / 60) : 1 })
    const minuteStart = Math.floor(fromSec / 60) * 60
    const minutes = Math.ceil((toSec - minuteStart) / 60)
    return { fromMs, toMs, raw, step, rows, minuteStart, minutes, clipped: toMs < toMsRaw }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, JSON.stringify(outages), status === 'menunggu'])

  const metric = query.metric
  const M = METRICS[metric]
  const unit = M.kind === 'rate' ? 'KB/s' : '%'
  const pages = result.minutes ? Math.ceil(result.minutes / PAGE) : 0
  const tableRows = useMemo(() => {
    if (!result.minutes) return []
    const out = []
    for (let i = 0; i < PAGE; i++) {
      const idx = result.minutes - 1 - (page * PAGE + i) // terbaru dulu
      if (idx < 0) break
      const s = result.minuteStart + idx * 60
      const r = aggregate(s, s + 60, 60, outages, { stride: 1 })[0]
      out.push(r)
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, page])

  const waiting = status === 'menunggu'
  const valid = result.rows ? result.rows.filter((r) => r[metric] != null) : []
  const avg = valid.length ? valid.reduce((a, r) => a + valueOf(r, metric), 0) / valid.length : null
  const max = valid.length ? Math.max(...valid.map((r) => valueOf(r, metric))) : null

  return (
    <>
      <PageHead title="Riwayat" sub="Jelajahi data yang telah tersimpan berdasarkan tanggal pengukuran." />
      <Card>
        <form className="filter" onSubmit={submit}>
          <label className="field"><span>Tanggal mulai</span><input type="date" value={form.from} min={minDay} max={form.to || today} onChange={set('from')} /><small>Awal data riwayat</small></label>
          <label className="field"><span>Tanggal selesai</span><input type="date" value={form.to} min={form.from || minDay} max={today} onChange={set('to')} /><small>Maksimal hari ini</small></label>
          <label className="field"><span>Metrik</span>
            <select value={form.metric} onChange={set('metric')}>
              {Object.entries(METRICS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <small>&nbsp;</small>
          </label>
          <button className="btn btn-primary" type="submit"><Search size={17} /> Tampilkan riwayat</button>
        </form>
        <p className="muted small filter-note">Data mentah per detik disimpan 24 jam; ringkasan per menit disimpan 7 hari. Waktu dalam WIB.</p>
      </Card>

      {waiting ? (
        <Card className="mt" title="Menunggu data…" sub="Riwayat ditampilkan setelah data pertama diterima dari server.">
          <Skel h={320} r={10} />
        </Card>
      ) : result.error ? (
        <div style={{ marginTop: 20 }}><Notice tone="amber" title={result.error}>Ubah rentang tanggal lalu tekan “Tampilkan riwayat”.</Notice></div>
      ) : (
        <>
          <Card
            className="mt"
            title={M.label}
            sub={`${longDate(result.fromMs)} — ${longDate(result.toMs - 1)}`}
            right={<div className="res-box">
              <span className="res">{result.raw ? 'Sumber: data mentah' : 'Sumber: ringkasan per menit'} · Grafik rata-rata {stepLabel(result.step)}</span>
              <span className="muted small">Data tersimpan · WIB</span>
            </div>}
          >
            {waiting ? <Skel h={320} r={10} /> : <MetricChart rows={result.rows} metric={metric} height={320} stepMs={result.step * 1000} labelFmt={(t) => dateTime(t)} />}
            <div className="stats4 stats3">
              <div><span>Rata-rata</span><strong>{avg == null ? '—' : `${num(avg, 1)} ${unit}`}</strong></div>
              <div><span>Tertinggi</span><strong>{max == null ? '—' : `${num(max, 1)} ${unit}`}</strong></div>
              <div><span>Titik grafik</span><strong>{num(result.rows.length)}</strong></div>
            </div>
          </Card>

          <Card className="mt" title="Data Pengukuran" sub={`${num(result.minutes)} baris per menit · Sumber: psutil`} pad>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Waktu</th><th>Nilai</th><th>Satuan</th><th>Jumlah sampel valid</th></tr></thead>
                <tbody>
                  {tableRows.map((r) => {
                    const v = valueOf(r, metric)
                    return (
                      <tr key={r.t} className={v == null ? 'row-gap' : ''}>
                        <td>{query.from === query.to ? time(r.t) + ' WIB' : dateTime(r.t)}</td>
                        <td>{v == null ? 'Tidak ada data' : num(v, 1)}</td>
                        <td>{v == null ? '—' : unit}</td>
                        <td className={r.valid < r.total ? (r.valid === 0 ? 'txt-red' : 'txt-amber') : ''}>{r.valid}/{r.total}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <span className="muted small">Halaman {page + 1} dari {pages}</span>
              <button className="icon-btn bordered" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={16} /></button>
              <button className="icon-btn bordered" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}><ChevronRight size={16} /></button>
            </div>
          </Card>
        </>
      )}
    </>
  )
}
