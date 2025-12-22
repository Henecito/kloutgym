import Router from './Router'
import { useAuth } from '../context/AuthContext'

export default function App() {
  const { loading } = useAuth()

  if (loading) {
    return <div style={{ color: 'white', padding: 20 }}>Cargando...</div>
  }

  return <Router />
}
