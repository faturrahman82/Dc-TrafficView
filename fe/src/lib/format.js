// Format angka & waktu gaya Indonesia, zona WIB
const TZ = 'Asia/Jakarta'
const nf = (d) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d })
const N0 = nf(0), N1 = nf(1), N2 = nf(2)

export const DASH = '—'
export const num = (v, d = 0) => (v == null ? DASH : (d === 0 ? N0 : d === 1 ? N1 : N2).format(v))
export const pct = (v, d = 1) => (v == null ? DASH : `${num(v, d)}%`)

// byte/detik → B/s, KB/s, MB/s (basis 1024)
export function rate(bps, { compact = false } = {}) {
  if (bps == null) return DASH
  const kb = bps / 1024
  if (kb >= 1024 * (compact ? 1 : 10)) return `${num(kb / 1024, kb / 1024 >= 100 ? 0 : 2)} MB/s`
  if (bps >= 1024 || compact) return `${num(kb, kb < 10 ? 1 : 0)} KB/s`
  return `${num(bps)} B/s`
}
export function rateAxis(bps) {
  if (bps >= 1024 * 1024) return `${num(bps / 1024 / 1024, bps % (1024 * 1024) === 0 ? 0 : 1)} MB/s`
  if (bps >= 1024) return `${num(bps / 1024)} KB/s`
  return `${num(bps)} B/s`
}
export function bytes(b, d = 2) {
  if (b == null) return DASH
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  while (b >= 1024 && i < u.length - 1) { b /= 1024; i++ }
  return `${num(b, i === 0 ? 0 : d)} ${u[i]}`
}

const tFmt = new Intl.DateTimeFormat('id-ID', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
const hmFmt = new Intl.DateTimeFormat('id-ID', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false })
const dFmt = new Intl.DateTimeFormat('id-ID', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' })
const dmFmt = new Intl.DateTimeFormat('id-ID', { timeZone: TZ, day: 'numeric', month: 'short' })

const fix = (s) => s.replace(/\./g, ':')
export const time = (ms) => (ms == null ? DASH : fix(tFmt.format(ms)))
export const hm = (ms) => fix(hmFmt.format(ms))
export const date = (ms) => dFmt.format(ms).replace('Agu', 'Agu')
export const dayMonth = (ms) => dmFmt.format(ms)
export const dateTime = (ms) => (ms == null ? DASH : `${date(ms)}, ${time(ms)} WIB`)

const ldFmt = new Intl.DateTimeFormat('id-ID', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' })
export const longDate = (ms) => ldFmt.format(ms)

// <input type="date"> dalam WIB: 'YYYY-MM-DD'
export function todayInput(offsetDays = 0) {
  return new Date(Date.now() + 7 * 3600e3 + offsetDays * 86400e3).toISOString().slice(0, 10)
}
export function dayStart(s) {
  if (!s) return null
  const ms = Date.parse(s + 'T00:00:00+07:00')
  return Number.isNaN(ms) ? null : ms
}

// untuk <input type="datetime-local"> dalam WIB
export function toLocalInput(ms) {
  const d = new Date(ms + 7 * 3600e3)
  return d.toISOString().slice(0, 16)
}
export function fromLocalInput(s) {
  if (!s) return null
  const ms = Date.parse(s + ':00Z')
  return Number.isNaN(ms) ? null : ms - 7 * 3600e3
}
