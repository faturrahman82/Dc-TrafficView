// Generator data dummy yang deterministik: nilai pada detik t selalu sama,
// sehingga Ringkasan, Grafik, Beban Server, dan Riwayat menampilkan data yang konsisten.
// Nanti modul ini diganti dengan data dari API/database.

export const SERVER = {
  name: 'vps-dctv-01',
  type: 'VPS Linux',
  os: 'Ubuntu 22.04 LTS',
  kernel: '5.15.0-107-generic',
  fs: '/',
  fsType: 'ext4',
  iface: 'eth0',
  agent: 'Python + psutil',
  interval: 1,
  cores: 8,
  ramTotal: 2 * 1024 ** 3,
  diskTotal: 60 * 1024 ** 3,
  monitoredSince: Date.UTC(2025, 5, 3, 1, 0, 0), // 3 Jun 2025 08:00 WIB
}

export const METRICS = {
  cpu: { label: 'CPU', unit: '%', kind: 'pct' },
  ram: { label: 'RAM', unit: '%', kind: 'pct' },
  disk: { label: 'Disk', unit: '%', kind: 'pct' },
  rx: { label: 'Traffic Masuk', unit: 'KB/s', kind: 'rate' },
  tx: { label: 'Traffic Keluar', unit: 'KB/s', kind: 'rate' },
}

function hash(n) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}
function noise(t, period, seed) {
  const k = t / period
  const i = Math.floor(k)
  const f = k - i
  const s = f * f * (3 - 2 * f)
  const a = hash(i * 1.37 + seed * 101)
  const b = hash((i + 1) * 1.37 + seed * 101)
  return a + (b - a) * s
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// apakah detik ini tidak punya sampel (jeda pengumpulan alami)
export function isGap(t) {
  const m = Math.floor(t / 60)
  if (hash(m * 0.731 + 9) < 0.004) return true // satu menit penuh hilang
  return hash(t * 0.917 + 3) < 0.002
}

export function inOutage(t, outages) {
  if (!outages) return false
  for (const o of outages) if (t >= o.from && t <= (o.to ?? Infinity)) return true
  return false
}

export function valuesAt(t) {
  const hourWib = ((t / 3600 + 7) % 24 + 24) % 24
  const day = Math.sin(((hourWib - 8) / 24) * 2 * Math.PI) // puncak siang
  const cpu = clamp(28 + 8 * day + 14 * noise(t, 420, 1) + 5 * noise(t, 60, 2) + 1.2 * hash(t + 0.5), 2, 99)
  const ram = clamp(54 + 5 * day + 6 * noise(t, 1500, 3) + 2 * noise(t, 90, 4), 5, 99)
  const disk = clamp(29.6 + 0.6 * noise(t, 86400 * 2, 5) + 0.05 * noise(t, 600, 6), 1, 99)
  const rxK = 760 + 260 * day + 420 * noise(t, 300, 7) + 120 * noise(t, 60, 8) + 14 * hash(t + 0.1)
  const txK = 470 + 160 * day + 260 * noise(t, 360, 9) + 80 * noise(t, 70, 10) + 10 * hash(t + 0.2)
  return { cpu, ram, disk, rx: Math.max(0, rxK) * 1024, tx: Math.max(0, txK) * 1024 }
}

export function sampleAt(t, outages) {
  if (isGap(t) || inOutage(t, outages)) return null
  return valuesAt(t)
}

// Agregasi rata-rata per bucket [from, to) dalam detik.
// Mengembalikan { t(ms), cpu, ram, disk, rx, tx, valid, total }
export function aggregate(fromSec, toSec, stepSec, outages, { stride } = {}) {
  const out = []
  const st = stride ?? Math.max(1, Math.floor(stepSec / 60))
  for (let b = fromSec; b < toSec; b += stepSec) {
    const end = Math.min(b + stepSec, toSec)
    const acc = { cpu: 0, ram: 0, disk: 0, rx: 0, tx: 0 }
    let valid = 0, total = 0
    for (let t = b; t < end; t += st) {
      total++
      const s = sampleAt(t, outages)
      if (!s) continue
      valid++
      for (const k in acc) acc[k] += s[k]
    }
    const row = { t: b * 1000, valid, total }
    for (const k in acc) row[k] = valid ? acc[k] / valid : null
    out.push(row)
  }
  return out
}

// rentang kosong (untuk pita "Tidak ada data")
export function gapRanges(rows, key = 'rx', stepMs = 1000) {
  const res = []
  let start = null
  rows.forEach((r, i) => {
    if (r[key] == null) { if (start == null) start = r.t }
    else if (start != null) { res.push({ x1: start, x2: rows[i - 1].t + stepMs }); start = null }
  })
  if (start != null) res.push({ x1: start, x2: rows[rows.length - 1].t + stepMs })
  return res
}
