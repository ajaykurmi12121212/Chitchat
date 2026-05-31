import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthCtx = createContext()
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  const api = axios.create({ baseURL: API })
  api.interceptors.request.use(cfg => {
    const t = localStorage.getItem('cc_token')
    if (t) cfg.headers.Authorization = `Bearer ${t}`
    return cfg
  })

  useEffect(() => {
    const t = localStorage.getItem('cc_token')
    if (t) {
      api.get('/auth/me')
        .then(({ data }) => setUser(data))
        .catch(() => localStorage.removeItem('cc_token'))
        .finally(() => setLoading(false))
    } else { setLoading(false) }
  }, [])

  const save = (data) => {
    localStorage.setItem('cc_token', data.token)
    setUser(data)
  }

  const phoneLogin = async (phone, name) => {
    const { data } = await api.post('/auth/phone-login', { phone: `+91${phone}`, name })
    save(data)
    return data
  }

  const logout = () => {
    localStorage.removeItem('cc_token')
    setUser(null)
  }

  const updateUser = (u) => setUser(p => ({ ...p, ...u }))

  return (
    <AuthCtx.Provider value={{ user, loading, api, phoneLogin, logout, updateUser }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
