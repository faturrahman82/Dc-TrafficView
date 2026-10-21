import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { LayoutGrid, BarChart3, Gauge, History, Server, Settings, LogOut, ChevronRight, CheckCircle2, X, FlaskConical } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useMonitor } from '../context/MonitorContext'
import { StatusPill } from './ui'
import { dateTime } from '../lib/format'
import { SERVER } from '../lib/series'

const MENU = [
  { to: '/ringkasan', label: 'Ringkasan', icon: LayoutGrid },
  { to: '/grafik-traffic', label: 'Grafik Traffic', icon: BarChart3 },
  { to: '/beban-server', label: 'Beban Server', icon: Gauge },
  { to: '/riwayat', label: 'Riwayat', icon: History },
  { to: '/detail-sumber', label: 'Detail Sumber', icon: Server },
  { to: '/konfigurasi', label: 'Konfigurasi', icon: Settings },
]

export function Logo() {
  return (
    <div className="logo">
      <div className="logo-mark">
        <span style={{ height: 12 }} /><span style={{ height: 20, background: '#7DD3FC' }} /><span style={{ height: 15 }} />
      </div>
      <div>
        <div className="logo-name">DC-TrafficView</div>
        <div className="logo-sub">MONITORING SERVER</div>
      </div>
    </div>
  )
}

const initials = (n) => n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

function Sidebar() {
  const { user, logout } = useAuth()
  return (
    <aside className="sidebar">
      <Logo />
      <nav>
        {MENU.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav ${isActive ? 'active' : ''}`}>
            <Icon size={20} strokeWidth={1.8} />
            <span>{label}</span>
            <ChevronRight size={16} className="chev" />
          </NavLink>
        ))}
      </nav>
      <div className="profile">
        <div className="avatar">{initials(user.name)}</div>
        <div className="profile-text">
          <strong title={user.name}>{user.name}</strong>
          <span>{user.role}</span>
        </div>
        <button className="icon-btn" onClick={logout} title="Keluar" aria-label="Keluar">
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  )
}

function Topbar() {
  const { status, lastAt, source } = useMonitor()
  return (
    <header className="topbar">
      <div className="src">
        <div className="src-icon"><Server size={22} /></div>
        <div>
          <strong>{source.name}</strong>
          <span>Ubuntu 22.04 · interface {source.iface}</span>
        </div>
      </div>
      <div className="top-right">
        <StatusPill status={status} />
        <div className="updated">
          <span>Diperbarui otomatis</span>
          <strong>{status === 'menunggu' ? 'Mengambil data…' : dateTime(lastAt)}</strong>
        </div>
      </div>
    </header>
  )
}

function Banner() {
  const { status, age } = useMonitor()
  if (status === 'kedaluwarsa')
    return (
      <div className="banner banner-amber">
        <strong>Data terakhir berumur {age} detik.</strong> Pengumpulan sedang tidak memperbarui data. Nilai di bawah tetap menampilkan pengukuran terakhir.
      </div>
    )
  if (status === 'terputus')
    return (
      <div className="banner banner-red">
        <strong>Koneksi real-time terputus.</strong> Nilai terakhir tetap ditampilkan sambil mencoba menyambung kembali.
      </div>
    )
  return null
}

function Toast() {
  const { toast, setToast } = useMonitor()
  if (!toast) return null
  return (
    <div className="toast" key={toast.id}>
      <CheckCircle2 size={20} />
      <div><strong>{toast.title}</strong><span>{toast.desc}</span></div>
      <button className="icon-btn" onClick={() => setToast(null)}><X size={16} /></button>
    </div>
  )
}

// Panel simulasi status (data dummy) — dipakai sampai backend tersedia
function DemoPanel() {
  const { sim, setSim } = useMonitor()
  const [open, setOpen] = useState(false)
  const opts = [
    ['normal', 'Terbaru (normal)'],
    ['menunggu', 'Menunggu data'],
    ['kedaluwarsa', 'Agen berhenti → Kedaluwarsa'],
    ['terputus', 'Koneksi terputus'],
  ]
  return (
    <div className={`demo ${open ? 'open' : ''}`}>
      {open && (
        <div className="demo-box">
          <div className="demo-head"><strong>Simulasi data dummy</strong><button className="icon-btn" onClick={() => setOpen(false)}><X size={15} /></button></div>
          <p>Mengubah kondisi pengumpulan. Semua halaman ikut berubah.</p>
          {opts.map(([v, l]) => (
            <label key={v} className={sim === v ? 'on' : ''}>
              <input type="radio" name="sim" checked={sim === v} onChange={() => setSim(v)} /> {l}
            </label>
          ))}
          <p className="tiny">Kedaluwarsa muncul setelah data &gt; 5 detik tidak diperbarui. Pilih “Terbaru” lagi untuk melihat status pulih.</p>
        </div>
      )}
      <button className="demo-btn" onClick={() => setOpen((o) => !o)}><FlaskConical size={16} /> Simulasi</button>
    </div>
  )
}

export default function Layout() {
  const loc = useLocation()
  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <Topbar />
        <Banner />
        <main className="content" key={loc.pathname}>
          <Outlet />
        </main>
      </div>
      <Toast />
      <DemoPanel />
    </div>
  )
}

export { SERVER }
