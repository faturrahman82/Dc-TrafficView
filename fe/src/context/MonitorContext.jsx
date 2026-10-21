import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { SERVER, sampleAt } from '../lib/series'

/*
  Pusat status monitoring (dummy). SEMUA halaman membaca dari sini:
  - status: 'menunggu' | 'terbaru' | 'kedaluwarsa' | 'terputus'
  - buffer: sampel per detik 30 menit terakhir (null = tidak ada data)
  Mode simulasi (sim) meniru kondisi backend/agen. Nanti diganti Socket.IO.
*/
const BUF = 1800
const STALE_SEC = 5
const LAG = 1 // jeda agen → tampilan (detik)

const MonitorCtx = createContext(null)
const nowSec = () => Math.floor(Date.now() / 1000)

function initialEvents() {
  const day = 86400e3
  const base = Date.now()
  const at = (d, h, m, s) => {
    const x = new Date(base - d * day + 7 * 3600e3)
    return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate(), h - 7, m, s)
  }
  return [
    { id: 1, t: at(1, 13, 48, 12), type: 'pulih', title: 'Pengumpulan pulih', desc: 'Koneksi agen kembali normal setelah 8 detik.' },
    { id: 2, t: at(1, 13, 48, 4), type: 'gagal', title: 'Pengumpulan gagal', desc: 'Agen tidak merespons permintaan pengukuran.' },
    { id: 3, t: at(1, 9, 16, 22), type: 'info', title: 'Sampel ditolak – counter direset', desc: 'Counter interface eth0 lebih kecil dari sampel sebelumnya.' },
    { id: 4, t: at(2, 16, 5, 40), type: 'info', title: 'Konfigurasi diubah', desc: 'Interval pengumpulan diubah menjadi 1 detik.' },
  ]
}

export function MonitorProvider({ children }) {
  const [sim, setSim] = useState('menunggu')
  const [tick, setTick] = useState(0)
  const [toast, setToast] = useState(null)
  const [events, setEvents] = useState(initialEvents)
  const [thresholds, setThresholds] = useState({
    cpu: { warn: 80, crit: 90 },
    ram: { warn: 80, crit: 90 },
    disk: { warn: 80, crit: 90 },
  })
  const [source, setSource] = useState({ name: SERVER.name, iface: SERVER.iface, fs: SERVER.fs })

  const buf = useRef([]) // [{t(ms), cpu,...} | {t, gap:true}]
  const lastT = useRef(null) // detik sampel terakhir yang diproses
  const lastAt = useRef(null) // ms sampel valid terakhir
  const connected = useRef(true)
  const outages = useRef([]) // [{from,to}] detik
  const rejected = useRef(0)
  const prevStatus = useRef('menunggu')
  const downSince = useRef(null)

  // mulai: menunggu data 2,5 detik lalu data masuk
  useEffect(() => {
    const id = setTimeout(() => setSim((s) => (s === 'menunggu' ? 'normal' : s)), 2500)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    function step() {
      const target = nowSec() - LAG
      if (sim === 'menunggu') {
        buf.current = []; lastT.current = null; lastAt.current = null
      } else {
        connected.current = sim !== 'terputus'
        if (lastT.current == null) {
          // data awal (REST): isi 30 menit terakhir
          lastT.current = target - BUF
        }
        const out = outages.current
        if (sim !== 'normal') {
          const cur = out[out.length - 1]
          if (!cur || cur.to != null) out.push({ from: lastT.current + 1, to: null })
        } else {
          const cur = out[out.length - 1]
          if (cur && cur.to == null) cur.to = lastT.current
        }
        for (let t = lastT.current + 1; t <= target; t++) {
          const s = sim === 'normal' ? sampleAt(t, out.filter((o) => o.to != null)) : null
          buf.current.push(s ? { t: t * 1000, ...s } : { t: t * 1000, gap: true })
          if (s) lastAt.current = t * 1000
        }
        lastT.current = target
        if (buf.current.length > BUF) buf.current = buf.current.slice(-BUF)
      }
      setTick((x) => x + 1)
    }
    step()
    const id = setInterval(step, 1000)
    return () => clearInterval(id)
  }, [sim])

  const now = Date.now()
  let status
  if (lastAt.current == null) status = 'menunggu'
  else if (!connected.current) status = 'terputus'
  else if ((now - lastAt.current) / 1000 > STALE_SEC) status = 'kedaluwarsa'
  else status = 'terbaru'
  const age = lastAt.current == null ? null : Math.max(0, Math.round((now - lastAt.current) / 1000))

  // catat perubahan status → kejadian sistem + toast pulih
  useEffect(() => {
    const prev = prevStatus.current
    if (prev === status) return
    prevStatus.current = status
    const add = (e) => setEvents((ev) => [{ id: Date.now() + Math.random(), t: Date.now(), ...e }, ...ev].slice(0, 50))
    if (status === 'terputus') {
      downSince.current ??= Date.now()
      add({ type: 'gagal', title: 'Pengumpulan gagal', desc: 'Koneksi real-time ke server terputus.' })
    } else if (status === 'kedaluwarsa') {
      downSince.current ??= lastAt.current ?? Date.now()
      add({ type: 'warn', title: 'Data kedaluwarsa', desc: `Tidak ada pengukuran baru lebih dari ${STALE_SEC} detik.` })
    } else if (status === 'terbaru') {
      if (prev === 'terputus' || prev === 'kedaluwarsa') {
        const dur = downSince.current ? Math.max(1, Math.round((Date.now() - downSince.current) / 1000)) : 0
        add({ type: 'pulih', title: 'Pengumpulan pulih', desc: `Koneksi agen kembali normal setelah ${dur} detik.` })
        setToast({ id: Date.now(), title: 'Pengumpulan pulih', desc: 'Data kembali terbaru. Celah selama gangguan ditandai "Tidak ada data".' })
      } else if (prev === 'menunggu') {
        add({ type: 'info', title: 'Data pertama diterima', desc: 'Pengumpulan dari agen berjalan.' })
      }
      downSince.current = null
    }
  }, [status])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(id)
  }, [toast])

  const value = useMemo(() => {
    const samples = buf.current
    const valid = samples.filter((s) => !s.gap)
    const latest = valid.length ? valid[valid.length - 1] : null
    const win = (sec) => samples.slice(-sec)
    const avg = (key, sec) => {
      const v = win(sec).filter((s) => !s.gap)
      return v.length ? v.reduce((a, s) => a + s[key], 0) / v.length : null
    }
    const last30 = samples.length
    const complete = valid.length
    return {
      status, sim, setSim, age, lastAt: lastAt.current, now,
      samples, latest, win, avg,
      quality: {
        age,
        lag: latest ? 1.2 + ((latest.t / 1000) % 5) / 10 : null,
        complete, expected: BUF, filled: last30,
        rejected: rejected.current,
      },
      outages: outages.current.map((o) => ({ from: o.from, to: o.to ?? lastT.current })),
      events, addEvent: (e) => setEvents((ev) => [{ id: Date.now(), t: Date.now(), ...e }, ...ev]),
      thresholds, setThresholds, source, setSource,
      toast, setToast,
      level: (key, v) => {
        const th = thresholds[key]
        if (!th || v == null) return 'normal'
        return v >= th.crit ? 'crit' : v >= th.warn ? 'warn' : 'normal'
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, status, events, thresholds, source, toast, sim])

  return <MonitorCtx.Provider value={value}>{children}</MonitorCtx.Provider>
}
export const useMonitor = () => useContext(MonitorCtx)
