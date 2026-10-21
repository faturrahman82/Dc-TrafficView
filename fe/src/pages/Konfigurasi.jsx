import { useState } from 'react'
import { Plus, Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useMonitor } from '../context/MonitorContext'
import { Badge, Card, Notice, PageHead } from '../components/ui'

function SumberTab({ readOnly }) {
  const { source, setSource, addEvent, setToast } = useMonitor()
  const [f, setF] = useState(source)
  const changed = f.name !== source.name || f.iface !== source.iface || f.fs !== source.fs
  function save(e) {
    e.preventDefault()
    if (!f.name.trim()) return
    const parts = []
    if (f.name !== source.name) parts.push(`nama sumber menjadi ${f.name}`)
    if (f.iface !== source.iface) parts.push(`interface menjadi ${f.iface}`)
    if (f.fs !== source.fs) parts.push(`filesystem menjadi ${f.fs}`)
    setSource(f)
    addEvent({ type: 'info', title: 'Konfigurasi diubah', desc: `Sumber diubah: ${parts.join(', ')}.` })
    setToast({ id: Date.now(), title: 'Perubahan disimpan', desc: 'Konfigurasi sumber diperbarui.' })
  }
  return (
    <form onSubmit={save}>
      <div className="form-grid">
        <label className="field"><span>Nama sumber</span><input value={f.name} disabled={readOnly} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="field"><span>Interface jaringan</span>
          <select value={f.iface} disabled={readOnly} onChange={(e) => setF({ ...f, iface: e.target.value })}>
            <option>eth0</option><option>ens3</option><option>lo</option>
          </select>
        </label>
        <label className="field"><span>Filesystem yang dipantau</span>
          <select value={f.fs} disabled={readOnly} onChange={(e) => setF({ ...f, fs: e.target.value })}>
            <option>/</option><option>/var</option><option>/home</option>
          </select>
        </label>
        <div className="os-box"><small>Sistem operasi</small><strong>Ubuntu 22.04 LTS</strong><small>Terdeteksi otomatis oleh agen</small></div>
      </div>
      {!readOnly && <div className="form-actions"><button className="btn btn-primary" disabled={!changed}><Save size={16} /> Simpan perubahan</button></div>}
    </form>
  )
}

function AmbangTab({ readOnly }) {
  const { thresholds, setThresholds, addEvent, setToast } = useMonitor()
  const [f, setF] = useState(thresholds)
  const [err, setErr] = useState('')
  const rows = [['cpu', 'CPU'], ['ram', 'RAM'], ['disk', 'Disk /']]
  const setV = (k, t, v) => setF({ ...f, [k]: { ...f[k], [t]: v === '' ? '' : Number(v) } })
  function save(e) {
    e.preventDefault()
    for (const [k, l] of rows) {
      const { warn, crit } = f[k]
      if (!(warn > 0 && crit <= 100 && warn < crit)) return setErr(`${l}: nilai Peringatan harus lebih kecil dari Kritis (1–100%).`)
    }
    setErr('')
    setThresholds(f)
    addEvent({ type: 'info', title: 'Konfigurasi diubah', desc: 'Ambang tampilan CPU/RAM/Disk diperbarui.' })
    setToast({ id: Date.now(), title: 'Ambang disimpan', desc: 'Warna kartu dan grafik mengikuti ambang baru.' })
  }
  return (
    <form onSubmit={save}>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Metrik</th><th>Peringatan (kuning)</th><th>Kritis (merah)</th></tr></thead>
          <tbody>
            {rows.map(([k, l]) => (
              <tr key={k}>
                <td className="strong">{l}</td>
                <td><div className="num-input"><input type="number" min="1" max="100" value={f[k].warn} disabled={readOnly} onChange={(e) => setV(k, 'warn', e.target.value)} /><span>%</span></div></td>
                <td><div className="num-input"><input type="number" min="1" max="100" value={f[k].crit} disabled={readOnly} onChange={(e) => setV(k, 'crit', e.target.value)} /><span>%</span></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted small" style={{ marginTop: 12 }}>Ambang hanya mengubah warna tampilan, tidak mengubah nilai pengukuran.</p>
      {err && <p className="txt-red small">{err}</p>}
      {!readOnly && <div className="form-actions"><button className="btn btn-primary"><Save size={16} /> Simpan ambang</button></div>}
    </form>
  )
}

const EMPTY = { nip: '', name: '', username: '', email: '', password: '', role: 'Operator', status: 'Aktif' }

function UserForm({ initial, onCancel, onDone }) {
  const { saveUser } = useAuth()
  const [f, setF] = useState({ ...EMPTY, ...initial, password: '' })
  const [err, setErr] = useState('')
  const edit = !!initial?.id
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  function submit(e) {
    e.preventDefault()
    if (!f.nip.trim() || !f.name.trim() || !f.username.trim() || !f.email.trim()) return setErr('Lengkapi semua kolom wajib.')
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Format email tidak valid.')
    if (!edit && f.password.length < 6) return setErr('Kata sandi awal minimal 6 karakter.')
    if (edit && f.password && f.password.length < 6) return setErr('Kata sandi baru minimal 6 karakter.')
    const r = saveUser({ ...f, username: f.username.trim() })
    if (!r.ok) return setErr(r.message)
    onDone(edit ? 'Data pengguna diperbarui.' : 'Pengguna baru ditambahkan.')
  }
  return (
    <form className="user-form" onSubmit={submit}>
      <div className="user-form-head">
        <div><h4>{edit ? 'Ubah data pegawai' : 'Data pegawai baru'}</h4><p className="muted small">Lengkapi data akun sesuai data kepegawaian.</p></div>
        <Badge tone="teal" icon={false}>{edit ? 'Edit' : 'Baru'}</Badge>
      </div>
      <div className="form-grid g3">
        <label className="field"><span>NIP / ID pegawai</span><input value={f.nip} onChange={set('nip')} placeholder="Contoh: 19900101..." /></label>
        <label className="field"><span>Nama lengkap</span><input value={f.name} onChange={set('name')} placeholder="Nama pegawai" /></label>
        <label className="field"><span>Nama pengguna</span><input value={f.username} onChange={set('username')} placeholder="Untuk masuk aplikasi" disabled={initial?.primary} /></label>
        <label className="field"><span>Email kantor</span><input value={f.email} onChange={set('email')} placeholder="nama@dctv.local" /></label>
        <label className="field"><span>{edit ? 'Kata sandi baru (opsional)' : 'Kata sandi awal'}</span><input type="password" value={f.password} onChange={set('password')} placeholder="Minimal 6 karakter" /></label>
        <label className="field"><span>Peran</span>
          <select value={f.role} onChange={set('role')} disabled={initial?.primary}>
            <option>Administrator</option><option>Operator</option><option>Manajer</option>
          </select>
        </label>
        <label className="field"><span>Status akun</span>
          <select value={f.status} onChange={set('status')} disabled={initial?.primary}>
            <option>Aktif</option><option>Nonaktif</option>
          </select>
        </label>
      </div>
      {err && <p className="txt-red small">{err}</p>}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Batal</button>
        <button className="btn btn-primary">Simpan pengguna</button>
      </div>
    </form>
  )
}

function PenggunaTab({ readOnly }) {
  const { users, deleteUser, user: me } = useAuth()
  const { setToast } = useMonitor()
  const [editing, setEditing] = useState(null) // null | {} | user
  const [confirm, setConfirm] = useState(null)
  const done = (msg) => { setEditing(null); setToast({ id: Date.now(), title: 'Berhasil', desc: msg }) }
  return (
    <>
      <div className="sub-head">
        <div><h4>Daftar Pengguna</h4><p className="muted small">{users.length} akun terdaftar{readOnly ? ' · hanya dapat dilihat' : ' · data terkunci setelah disimpan'}</p></div>
        {!readOnly && !editing && <button className="btn btn-outline" onClick={() => setEditing({})}><Plus size={16} /> Tambah pengguna</button>}
      </div>
      {editing && <UserForm key={editing.id ?? 'new'} initial={editing.id ? editing : null} onCancel={() => setEditing(null)} onDone={done} />}
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>NIP</th><th>Pegawai</th><th>Nama pengguna</th><th>Email</th><th>Peran</th><th>Status</th>{!readOnly && <th>Tindakan</th>}</tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="mono">{u.nip}</td>
                <td className="strong">{u.name}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td><Badge tone={u.status === 'Aktif' ? 'green' : 'grey'} icon={false}>{u.status}</Badge></td>
                {!readOnly && <td><div className="actions">
                  {confirm === u.id ? (
                    <><span className="small">Hapus akun?</span><button className="link txt-red" onClick={() => { deleteUser(u.id); setConfirm(null); setToast({ id: Date.now(), title: 'Berhasil', desc: `Akun ${u.username} dihapus.` }) }}>Ya</button><button className="link" onClick={() => setConfirm(null)}>Batal</button></>
                  ) : (
                    <>
                      <button className="link" onClick={() => setEditing(u)}>Edit</button>
                      {u.primary ? <span className="tag">Akun utama</span> : u.id === me.id ? null : <button className="link txt-red" onClick={() => setConfirm(u.id)}>Hapus</button>}
                    </>
                  )}
                </div></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default function Konfigurasi() {
  const { canEdit } = useAuth()
  const [tab, setTab] = useState('sumber')
  const tabs = [['sumber', 'Sumber'], ['ambang', 'Ambang Tampilan'], ['pengguna', 'Pengguna']]
  return (
    <>
      <PageHead
        title="Konfigurasi"
        sub={canEdit ? 'Kelola sumber, ambang tampilan, dan akses pengguna.' : 'Lihat sumber, ambang tampilan, dan akses pengguna.'}
        right={!canEdit && <span className="ro-pill">Mode baca-saja</span>}
      />
      {canEdit ? (
        <Notice tone="info" title="Nilai pengukuran tidak dapat diubah dari aplikasi.">Konfigurasi hanya memengaruhi sumber yang dipantau dan tampilan.</Notice>
      ) : (
        <Notice tone="info" title="Anda memiliki akses baca-saja.">Hanya Administrator yang dapat mengubah konfigurasi dan pengguna.</Notice>
      )}
      <Card className="mt">
        <div className="tabline">
          {tabs.map(([v, l]) => <button key={v} className={tab === v ? 'on' : ''} onClick={() => setTab(v)}>{l}</button>)}
        </div>
        {tab === 'sumber' && <SumberTab readOnly={!canEdit} />}
        {tab === 'ambang' && <AmbangTab readOnly={!canEdit} />}
        {tab === 'pengguna' && <PenggunaTab readOnly={!canEdit} />}
      </Card>
    </>
  )
}
