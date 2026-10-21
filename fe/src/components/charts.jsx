import { Area, AreaChart, CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartTip } from './ui'
import { hm, pct, rate, rateAxis, time, dayMonth } from '../lib/format'
import { gapRanges } from '../lib/series'

const AX = { fontSize: 12, fill: '#8A93A0' }
const IN = '#1C7293', OUT = '#203864'

function tickFmt(span) {
  if (span > 2 * 86400e3) return (t) => dayMonth(t)
  if (span > 20 * 3600e3) return (t) => `${dayMonth(t)} ${hm(t)}`
  if (span <= 10 * 60e3) return (t) => time(t)
  return (t) => hm(t)
}
// catatan: Recharts hanya mengenali ReferenceArea sebagai anak langsung, jadi ini fungsi (bukan komponen)
function gapBands(gaps, minWidth) {
  let lastLabel = -Infinity
  return gaps.map((g, i) => {
    // label hanya untuk celah yang cukup lebar dan tidak berdempetan
    const showLabel = g.x2 - g.x1 >= minWidth * 4 && g.x1 - lastLabel > minWidth * 25
    if (showLabel) lastLabel = g.x1
    const x2 = Math.max(g.x2, g.x1 + minWidth)
    return (
      <ReferenceArea key={i} x1={g.x1} x2={x2} fill="#E5E7EB" fillOpacity={0.55} strokeOpacity={0} ifOverflow="extendDomain"
        label={showLabel ? { value: 'Tidak ada data', position: 'insideTop', fontSize: 11, fill: '#6B7280' } : undefined} />
    )
  })
}

// tick sumbu Y yang rapi untuk byte/detik
function rateTicks(rows, keys) {
  let max = 0
  for (const r of rows) for (const k of keys) if (r[k] != null && r[k] > max) max = r[k]
  const steps = [100, 250, 500, 1024, 2048, 5120, 10240, 25600, 51200, 102400].map((k) => k * 1024)
  const step = steps.find((s) => max / s <= 5) ?? steps[steps.length - 1]
  const top = Math.max(step, Math.ceil((max * 1.08) / step) * step)
  const ticks = []
  for (let v = 0; v <= top + 1; v += step) ticks.push(v)
  return { ticks, domain: [0, top] }
}

export function TrafficChart({ rows, height = 360, stepMs = 1000, labelFmt }) {
  const span = rows.length ? rows[rows.length - 1].t - rows[0].t : 1
  const gaps = gapRanges(rows, 'rx', stepMs)
  const yt = rateTicks(rows, ['rx', 'tx'])
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows} margin={{ top: 16, right: 8, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="gin" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={IN} stopOpacity={0.22} /><stop offset="1" stopColor={IN} stopOpacity={0.01} /></linearGradient>
          <linearGradient id="gout" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={OUT} stopOpacity={0.1} /><stop offset="1" stopColor={OUT} stopOpacity={0} /></linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#EEF1F5" />
        <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={tickFmt(span)} tick={AX} axisLine={false} tickLine={false} minTickGap={span > 20 * 3600e3 ? 60 : 40} />
        <YAxis ticks={yt.ticks} domain={yt.domain} tickFormatter={rateAxis} tick={AX} axisLine={false} tickLine={false} width={74} />
        <Tooltip content={<ChartTip fmt={(v) => rate(v, { compact: true })} labelFmt={labelFmt} />} />
        {gapBands(gaps, span / 150)}
        <Area name="Masuk" type="monotone" dataKey="rx" stroke={IN} strokeWidth={2.2} fill="url(#gin)" isAnimationActive={false} connectNulls={false} dot={false} />
        <Area name="Keluar" type="monotone" dataKey="tx" stroke={OUT} strokeWidth={2.2} fill="url(#gout)" isAnimationActive={false} connectNulls={false} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function LoadChart({ rows, height = 320, stepMs = 1000, thresholds, labelFmt }) {
  const span = rows.length ? rows[rows.length - 1].t - rows[0].t : 1
  const gaps = gapRanges(rows, 'cpu', stepMs)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={rows} margin={{ top: 16, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#EEF1F5" />
        <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={tickFmt(span)} tick={AX} axisLine={false} tickLine={false} minTickGap={span > 20 * 3600e3 ? 60 : 40} />
        <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} tick={AX} axisLine={false} tickLine={false} width={44} />
        <Tooltip content={<ChartTip fmt={(v) => pct(v)} labelFmt={labelFmt} />} />
        {gapBands(gaps, span / 150)}
        {thresholds && <ReferenceLine y={thresholds.cpu.warn} stroke="#D97706" strokeDasharray="4 4" label={{ value: `Peringatan ${thresholds.cpu.warn}%`, position: 'insideTopRight', fontSize: 11, fill: '#D97706' }} />}
        {thresholds && <ReferenceLine y={thresholds.cpu.crit} stroke="#DC2626" strokeDasharray="4 4" label={{ value: `Kritis ${thresholds.cpu.crit}%`, position: 'insideTopRight', fontSize: 11, fill: '#DC2626' }} />}
        <Line name="CPU" type="monotone" dataKey="cpu" stroke={IN} strokeWidth={2.2} dot={false} isAnimationActive={false} connectNulls={false} />
        <Line name="RAM" type="monotone" dataKey="ram" stroke={OUT} strokeWidth={2.2} dot={false} isAnimationActive={false} connectNulls={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// grafik satu metrik (Riwayat): sumbu Y mengikuti satuan metrik
export function MetricChart({ rows, metric, height = 320, stepMs, labelFmt }) {
  const isPct = metric !== 'rx' && metric !== 'tx'
  const span = rows.length ? rows[rows.length - 1].t - rows[0].t : 1
  const gaps = gapRanges(rows, metric, stepMs)
  const yt = isPct ? { ticks: [0, 25, 50, 75, 100], domain: [0, 100] } : rateTicks(rows, [metric])
  const fmt = isPct ? (v) => pct(v) : (v) => rate(v, { compact: true })
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows} margin={{ top: 16, right: 8, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="gm" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={IN} stopOpacity={0.22} /><stop offset="1" stopColor={IN} stopOpacity={0.01} /></linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#EEF1F5" />
        <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={tickFmt(span)} tick={AX} axisLine={false} tickLine={false} minTickGap={span > 20 * 3600e3 ? 60 : 40} />
        <YAxis ticks={yt.ticks} domain={yt.domain} tickFormatter={isPct ? (v) => `${v}%` : rateAxis} tick={AX} axisLine={false} tickLine={false} width={isPct ? 44 : 74} />
        <Tooltip content={<ChartTip fmt={fmt} labelFmt={labelFmt} />} />
        {gapBands(gaps, span / 150)}
        <Area name={{ cpu: 'CPU', ram: 'RAM', disk: 'Disk /', rx: 'Masuk', tx: 'Keluar' }[metric]} type="monotone" dataKey={metric} stroke={IN} strokeWidth={2.2} fill="url(#gm)" isAnimationActive={false} connectNulls={false} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export const COLORS = { IN, OUT }
export { time }
