import { createContext, useContext, useEffect, useState } from 'react'

// Akun dummy (nanti diganti autentikasi backend + MySQL)
const DEFAULT_USERS = [
  { id: 1, nip: '198703152010', name: 'Andi Pratama', username: 'admin', email: 'andi@dctv.local', role: 'Administrator', status: 'Aktif', password: 'admin123', primary: true },
  { id: 2, nip: '199105222015', name: 'Sinta Dewi', username: 'operator', email: 'sinta@dctv.local', role: 'Operator', status: 'Aktif', password: 'operator123' },
  { id: 3, nip: '198811302012', name: 'Budi Santoso', username: 'manajer', email: 'budi@dctv.local', role: 'Manajer', status: 'Aktif', password: 'manajer123' },
]

const AuthCtx = createContext(null)
const load = (store, key, fallback) => {
  try { const v = store.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
const save = (store, key, v) => { try { store.setItem(key, JSON.stringify(v)) } catch { /* abaikan */ } }

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => load(localStorage, 'dctv-users', DEFAULT_USERS))
  const [userId, setUserId] = useState(() => load(sessionStorage, 'dctv-session', null))

  useEffect(() => save(localStorage, 'dctv-users', users), [users])
  useEffect(() => save(sessionStorage, 'dctv-session', userId), [userId])

  const user = users.find((u) => u.id === userId) || null

  function login(username, password) {
    const u = users.find((x) => x.username.toLowerCase() === username.trim().toLowerCase() && x.password === password)
    if (!u) return { ok: false, message: 'Nama pengguna atau kata sandi salah.' }
    if (u.status !== 'Aktif') return { ok: false, message: 'Akun ini sedang nonaktif. Hubungi administrator.' }
    setUserId(u.id)
    return { ok: true }
  }
  const logout = () => setUserId(null)

  function saveUser(data) {
    const taken = users.find((u) => u.username.toLowerCase() === data.username.toLowerCase() && u.id !== data.id)
    if (taken) return { ok: false, message: 'Nama pengguna sudah dipakai.' }
    if (data.id) setUsers((us) => us.map((u) => (u.id === data.id ? { ...u, ...data, password: data.password || u.password } : u)))
    else setUsers((us) => [...us, { ...data, id: Math.max(0, ...us.map((u) => u.id)) + 1 }])
    return { ok: true }
  }
  const deleteUser = (id) => setUsers((us) => us.filter((u) => u.id !== id || u.primary))

  const canEdit = user?.role === 'Administrator'
  return (
    <AuthCtx.Provider value={{ user, users, login, logout, saveUser, deleteUser, canEdit }}>
      {children}
    </AuthCtx.Provider>
  )
}
export const useAuth = () => useContext(AuthCtx)
