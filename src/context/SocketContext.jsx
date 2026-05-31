import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketCtx = createContext()

const URL = 'https://chitchat-backend-production-1f6e.up.railway.app'

export function SocketProvider({ children }) {
  const { user }  = useAuth()
  const ref       = useRef(null)
  const [socket, setSocket]   = useState(null)
  const [online, setOnline]   = useState([])

  useEffect(() => {
    if (!user) { ref.current?.disconnect(); setSocket(null); return }
    const s = io(URL, { transports: ['websocket'] })
    ref.current = s
    setSocket(s)
    s.emit('user:online', user._id)
    s.on('users:online', ids => setOnline(ids))
    s.on('user:status', ({ userId, isOnline }) =>
      setOnline(p => isOnline ? [...new Set([...p, userId])] : p.filter(i => i !== userId))
    )
    return () => s.disconnect()
  }, [user])

  const isOnline = (id) => online.includes(id)

  return <SocketCtx.Provider value={{ socket, online, isOnline }}>{children}</SocketCtx.Provider>
}

export const useSocket = () => useContext(SocketCtx)