import { useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import AuthPage from './pages/AuthPage'
import ChatPage from './ChatPage'

export default function App() {s
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: 'var(--bg)'
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: 'linear-gradient(135deg,#16a34a,#22c55e)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26, marginBottom: 20,
        boxShadow: '0 8px 24px rgba(34,197,94,.3)'
      }}>💬</div>
      <div style={{
        fontSize: 22, fontWeight: 800, letterSpacing: '-.5px', color: 'var(--text)', marginBottom: 8
      }}>
        Chit<span style={{ color: 'var(--green)' }}>Chat</span>
      </div>
      <div style={{
        width: 32, height: 32, border: '2.5px solid rgba(34,197,94,.2)',
        borderTopColor: '#22c55e', borderRadius: '50%',
        animation: 'spin .7s linear infinite', marginTop: 16
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return user
    ? <SocketProvider><ChatPage /></SocketProvider>
    : <AuthPage />
}
