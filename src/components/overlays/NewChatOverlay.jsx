// ─────────────────────────────────────────
//  NewChatOverlay.jsx
// ─────────────────────────────────────────
import { useState } from 'react'
import { Icon } from '../Icons'
import Avatar from '../shared/Avatar'

export default function NewChatOverlay({ allUsers, isOnline, onClose, onStartDM, api }) {
  const [phone,     setPhone]     = useState('')
  const [foundUser, setFoundUser] = useState(null)
  const [loading,   setLoading]   = useState(false)

  const findUser = async () => {
    if (phone.length < 10) return
    setLoading(true)
    const { data } = await api.get(`/users/search?q=${phone}`)
    setFoundUser(data[0] || null)
    setLoading(false)
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[var(--bg)]">

      {/* Top bar */}
      <div className="h-14 bg-[var(--s1)] px-4 flex items-center gap-3 border-b border-[var(--border)] flex-shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 bg-[var(--s2)] rounded-xl border-none cursor-pointer flex items-center justify-center active:scale-95 transition-transform"
        >
          <Icon.Back className="w-5 h-5 text-[var(--text)]" />
        </button>
        <span className="text-base font-bold text-[var(--text)]">New Chat</span>
      </div>

      {/* Phone search */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <div className="text-xs text-[var(--muted)] mb-2 font-semibold">Find by mobile number</div>
        <div className="flex gap-2">
          <div className="flex-1 bg-[var(--s2)] border border-[var(--border)] rounded-xl flex items-center gap-2 px-3 py-2.5">
            <Icon.Call className="w-3.5 h-3.5 text-[var(--muted)] flex-shrink-0" />
            <span className="text-sm text-[var(--muted)] font-bold">+91</span>
            <div className="w-px h-4 bg-[var(--border)]" />
            <input
              value={phone}
              onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setFoundUser(null) }}
              placeholder="Mobile number"
              inputMode="numeric"
              className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] min-w-0"
            />
          </div>
          <button
            onClick={findUser}
            disabled={loading || phone.length < 10}
            className="bg-green-500 text-white border-none rounded-xl px-4 text-sm font-bold cursor-pointer disabled:opacity-50 transition-opacity"
          >
            {loading ? '…' : 'Find'}
          </button>
        </div>

        {foundUser && (
          <div className="mt-3 bg-green-500/5 border border-green-500/20 rounded-xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <Avatar name={foundUser.name} src={foundUser.avatar} size={40} />
            <div className="flex-1">
              <div className="text-sm font-semibold text-[var(--text)]">{foundUser.name}</div>
              <div className="text-xs text-green-500 mt-0.5">{foundUser.phone}</div>
            </div>
            <button
              onClick={() => { onStartDM(foundUser._id); setFoundUser(null); setPhone('') }}
              className="bg-green-500 text-white border-none rounded-lg px-3 py-2 text-xs font-bold cursor-pointer"
            >Chat</button>
          </div>
        )}

        {phone.length >= 3 && !foundUser && !loading && (
          <p className="text-xs text-[var(--muted)] mt-2 text-center">No user found with this number</p>
        )}
      </div>

      {/* All contacts */}
      <div className="flex-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-[var(--muted2)] px-4 py-2 uppercase tracking-wider">All Contacts</div>
        {allUsers.map(u => (
          <div key={u._id} onClick={() => onStartDM(u._id)}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-[var(--border)] hover:bg-[var(--hover)] transition-colors">
            <Avatar name={u.name} src={u.avatar} online={isOnline(u._id)} size={46} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[var(--text)]">{u.name}</div>
              <div className="text-xs text-[var(--muted)] mt-0.5">{u.phone || u.email}</div>
            </div>
            {isOnline(u._id) && <span className="text-[10px] font-bold text-green-500 flex-shrink-0">Online</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
