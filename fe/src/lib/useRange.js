import { useMemo } from 'react'
import { useMonitor } from '../context/MonitorContext'
import { aggregate } from './series'

export const RANGES = [
  { value: '5m', label: '5 menit' },
  { value: '1h', label: '1 jam' },
  { value: '24h', label: '24 jam' },
  { value: '7d', label: '7 hari' },
]
const CFG = {
  '5m': { sec: 300, step: 1, res: 'per detik' },
  '1h': { sec: 3600, step: 10, res: 'rata-rata 10 detik' },
  '24h': { sec: 86400, step: 60, res: 'rata-rata per menit' },
  '7d': { sec: 7 * 86400, step: 3600, res: 'ringkasan per menit, ditampilkan per jam' },
}

// Data grafik untuk rentang tertentu, dari status pusat yang sama
export function useRange(range) {
  const { win, outages, samples, status } = useMonitor()
  const cfg = CFG[range]
  const endSec = samples.length ? samples[samples.length - 1].t / 1000 + 1 : Math.floor(Date.now() / 1000)
  const bucket = Math.floor(endSec / Math.max(cfg.step, 10))
  const key = range === '5m' ? samples.length + ':' + endSec : bucket + ':' + JSON.stringify(outages)
  const rows = useMemo(() => {
    if (status === 'menunggu') return []
    if (range === '5m') {
      return win(300).map((s) => (s.gap ? { t: s.t, cpu: null, ram: null, disk: null, rx: null, tx: null, valid: 0, total: 1 } : { ...s, valid: 1, total: 1 }))
    }
    const end = Math.floor(endSec / cfg.step) * cfg.step
    return aggregate(end - cfg.sec, end, cfg.step, outages)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, key, status])
  return { rows, stepMs: cfg.step * 1000, res: cfg.res }
}
