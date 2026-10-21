import { Check, Info, AlertTriangle, WifiOff, Loader2 } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'
import { useMonitor } from '../context/MonitorContext'
import { time } from '../lib/format'

export const STATUS = {
  menunggu: { label: 'Menunggu data…', cls: 'grey' },
  terbaru: { label: 'Terbaru', cls: 'green' },
  kedaluwarsa: { label: 'Kedaluwarsa', cls: 'amber' },
  terputus: { label: 'Terputus — mencoba menyambung kembali…', cls: 'red' },
}

export function StatusPill({ status, small }) {
  const s = STATUS[status]
  return (
    <span className={`pill pill-${s.cls} ${small ? 'pill-sm' : ''}`}>
      {status === 'menunggu' ? <Loader2 size={14} className="spin" /> : <span className="dot" />}
      {s.label}
    </span>
  )
}

export function Card({ title, sub, right, children, className = '', pad = true }) {
  return (
    <section className={`card ${pad ? 'card-pad' : ''} ${className}`}>
      {(title || right) && (
        <header className="card-head">
          <div>
            {title && <h3>{title}</h3>}
            {sub && <p className="muted small">{sub}</p>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  )
}

export function PageHead({ title, sub, right }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        <p className="muted">{sub}</p>
      </div>
      {right}
    </div>
  )
}

export const Skel = ({ w = '100%', h = 14, r = 6, style }) => (
  <span className="skel" style={{ width: w, height: h, borderRadius: r, ...style }} />
)

export function Measured({ t }) {
  const { status } = useMonitor()
  return (
    <p className={`measured ${status === 'kedaluwarsa' || status === 'terputus' ? 'measured-old' : ''}`}>
      Diukur {time(t)} WIB <span>Sumber: psutil</span>
    </p>
  )
}

export function Badge({ tone = 'green', children, icon = true }) {
  return (
    <span className={`badge badge-${tone}`}>
      {icon && tone === 'green' && <Check size={13} strokeWidth={2.6} />}
      {children}
    </span>
  )
}

export function Notice({ tone = 'info', title, children }) {
  const Icon = tone === 'info' ? Info : tone === 'red' ? WifiOff : AlertTriangle
  return (
    <div className={`notice notice-${tone}`}>
      <Icon size={18} />
      <div>
        {title && <strong>{title}</strong>}
        {children && <div>{children}</div>}
      </div>
    </div>
  )
}

export function Tabs({ value, onChange, options }) {
  return (
    <div className="tabs">
      {options.map((o) => (
        <button key={o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Spark({ data, k, color = '#1C7293' }) {
  const rows = data.map((s) => ({ t: s.t, v: s.gap ? null : s[k] }))
  return (
    <div className="spark">
      <ResponsiveContainer width="100%" height={44}>
        <AreaChart data={rows} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
          <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
          <defs>
            <linearGradient id={`sp-${k}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity={0.18} />
              <stop offset="1" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#sp-${k})`} isAnimationActive={false} connectNulls={false} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function Legend({ items }) {
  return (
    <div className="legend">
      {items.map((i) => (
        <span key={i.label}><i style={{ background: i.color }} />{i.label}</span>
      ))}
    </div>
  )
}

export function ChartTip({ active, payload, label, fmt, labelFmt }) {
  if (!active || !payload?.length) return null
  return (
    <div className="tip">
      <strong>{labelFmt ? labelFmt(label) : `${time(label)} WIB`}</strong>
      {payload.map((p) => (
        <div key={p.dataKey}>
          <i style={{ background: p.color }} />
          <span>{p.name}</span>
          <b>{p.value == null ? 'Tidak ada data' : fmt(p.value)}</b>
        </div>
      ))}
    </div>
  )
}
