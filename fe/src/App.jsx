import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { MonitorProvider } from './context/MonitorContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Ringkasan from './pages/Ringkasan'
import GrafikTraffic from './pages/GrafikTraffic'
import BebanServer from './pages/BebanServer'
import Riwayat from './pages/Riwayat'
import DetailSumber from './pages/DetailSumber'
import Konfigurasi from './pages/Konfigurasi'

function Guarded() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return (
    <MonitorProvider>
      <Layout />
    </MonitorProvider>
  )
}

function Routing() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/ringkasan" replace /> : <Login />} />
      <Route element={<Guarded />}>
        <Route path="/ringkasan" element={<Ringkasan />} />
        <Route path="/grafik-traffic" element={<GrafikTraffic />} />
        <Route path="/beban-server" element={<BebanServer />} />
        <Route path="/riwayat" element={<Riwayat />} />
        <Route path="/detail-sumber" element={<DetailSumber />} />
        <Route path="/konfigurasi" element={<Konfigurasi />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/ringkasan' : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routing />
    </AuthProvider>
  )
}
