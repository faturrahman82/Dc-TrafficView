import { useState } from 'react'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Logo } from '../components/Layout'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('Isi nama pengguna dan kata sandi.')
      return
    }
    const r = login(username, password)
    if (!r.ok) {
      setError(r.message)
      setUsername('') // nama pengguna dikosongkan kembali
      setPassword('')
    }
  }

  return (
    <div className="login-bg">
      <span className="blob b1" /><span className="blob b2" />
      <form className="login-card" onSubmit={submit} noValidate>
        <Logo />
        <h1>Masuk</h1>
        <p className="muted">Gunakan akun Anda untuk melihat kondisi server.</p>
        {error && (
          <div className="login-error" role="alert"><AlertCircle size={18} />{error}</div>
        )}
        <label className="field">
          <span>Nama pengguna</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Masukkan nama pengguna" autoComplete="username" className={error ? 'invalid' : ''} autoFocus />
        </label>
        <label className="field">
          <span>Kata sandi</span>
          <div className="pw">
            <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan kata sandi" autoComplete="current-password" className={error ? 'invalid' : ''} />
            <button type="button" className="icon-btn" onClick={() => setShow((s) => !s)} aria-label="Tampilkan kata sandi">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
        </label>
        <button className="btn btn-primary btn-block" type="submit">Masuk</button>
      </form>
    </div>
  )
}
