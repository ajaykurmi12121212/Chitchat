import { useState, useRef } from 'react'
import { Icon } from '../Icons'
import Avatar from '../shared/Avatar'
import { BACKEND } from '../shared/utils'

export default function ProfileOverlay({ user, onClose, onSave, onLogout }) {
  const [editing,     setEditing]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [showLogout,  setShowLogout]  = useState(false)
  const [avatar,      setAvatar]      = useState(user.avatar || '')
  const [form,        setForm]        = useState({
    name:  user.name  || '',
    about: user.about || '',
    phone: user.phone?.replace('+91', '') || '',
  })
  const fileRef = useRef()

  const handleSave = async () => {
    setSaving(true)
    await onSave({
      name:   form.name,
      about:  form.about,
      phone:  form.phone ? `+91${form.phone}` : undefined,
      avatar: avatar || undefined,
    })
    setSaving(false)
    setEditing(false)
  }

  const handlePhotoUpload = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', f)
      const token = localStorage.getItem('cc_token')
      const res   = await fetch(`${BACKEND}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      setAvatar(data.fileUrl)
    } catch {
      setAvatar(URL.createObjectURL(f))
    }
    setUploading(false)
    e.target.value = ''
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[var(--bg)] overflow-y-auto">

      {/* ── Top bar ── */}
      <div className="h-14 bg-[var(--s1)] px-4 flex items-center gap-3 border-b border-[var(--border)] flex-shrink-0 sticky top-0 z-10">
        <button onClick={onClose}
          className="w-9 h-9 bg-[var(--s2)] rounded-xl border-none cursor-pointer flex items-center justify-center active:scale-95 transition-transform">
          <Icon.Back className="w-5 h-5 text-[var(--text)]" />
        </button>
        <span className="text-base font-bold text-[var(--text)] flex-1">Profile</span>
        {!editing && (
          <button onClick={() => setEditing(true)}
            className="bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg px-3 py-1.5 text-sm font-bold cursor-pointer hover:bg-green-500/20 transition-colors">
            Edit
          </button>
        )}
      </div>

      {/* ── Hero banner ── */}
      <div className="bg-gradient-to-br from-green-700 to-green-500 px-6 pt-10 pb-14 text-center relative">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Avatar name={user.name} src={avatar} size={88} className="ring-4 ring-white/20" />
            {/* Photo upload button — always visible */}
            <button
              onClick={() => fileRef.current.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-none cursor-pointer active:scale-95 transition-transform"
            >
              {uploading
                ? <div className="w-4 h-4 border-2 border-green-500/30 border-t-green-600 rounded-full animate-spin" />
                : <Icon.Edit className="w-4 h-4 text-green-700" />
              }
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
        </div>
        <div className="text-xl font-black text-white">{form.name || user.name}</div>
        <div className="text-sm text-white/70 mt-1">{user.phone || user.email}</div>
      </div>

      {/* ── Info card ── */}
      <div className="bg-[var(--card)] rounded-3xl mx-4 -mt-8 shadow-xl border border-[var(--border)] overflow-hidden relative z-[1]">
        {!editing ? (
          <div className="p-5 flex flex-col gap-4">
            <InfoRow icon="👤" label="Name"  value={user.name} />
            <InfoRow icon="💬" label="About" value={user.about || 'Hey there! I am using ChitChat 👋'} />
            {user.phone && <InfoRow icon="📞" label="Phone" value={user.phone} />}
            {user.email && <InfoRow icon="📧" label="Email" value={user.email} />}
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-4">
            {[
              { k: 'name',  l: 'Name',  p: 'Your name',  t: 'text' },
              { k: 'about', l: 'About', p: 'Hey there!', t: 'text' },
              { k: 'phone', l: 'Phone', p: '9876543210', t: 'tel'  },
            ].map(f => (
              <div key={f.k}>
                <label className="block text-[10px] font-bold text-[var(--muted2)] uppercase tracking-wider mb-1.5">{f.l}</label>
                <input type={f.t} value={form[f.k]}
                  onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                  placeholder={f.p}
                  className="w-full border border-[var(--border)] rounded-xl bg-[var(--inp)] px-4 py-3 text-sm text-[var(--text)] outline-none focus:border-green-500/50 transition-colors" />
              </div>
            ))}
            <div className="flex gap-3 mt-2">
              <button onClick={() => setEditing(false)}
                className="flex-1 py-3 bg-[var(--s2)] text-[var(--muted)] border-none rounded-xl text-sm font-bold cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 bg-gradient-to-r from-green-700 to-green-500 text-white border-none rounded-xl text-sm font-bold cursor-pointer disabled:opacity-60">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Action buttons ── */}
      <div className="mx-4 mt-4 flex flex-col gap-3">
        {[
          { icon: '🔔', label: 'Notifications' },
          { icon: '🔒', label: 'Privacy' },
          { icon: '💾', label: 'Storage & Data' },
          { icon: '❓', label: 'Help' },
        ].map(item => (
          <button key={item.label}
            className="w-full flex items-center gap-4 px-4 py-3.5 bg-[var(--card)] border border-[var(--border)] rounded-2xl cursor-pointer text-left hover:bg-[var(--hover)] transition-colors">
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-semibold text-[var(--text)] flex-1">{item.label}</span>
            <span className="text-[var(--muted2)] text-sm">›</span>
          </button>
        ))}

        {/* ── Logout button ── */}
        <button onClick={() => setShowLogout(true)}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl cursor-pointer hover:bg-red-500/20 transition-colors mt-2">
          <span className="text-xl">🚪</span>
          <span className="text-sm font-bold text-red-500">Logout</span>
        </button>
      </div>

      <div className="h-8" />

      {/* ── Logout Confirm Modal ── */}
      {showLogout && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
          <div className="bg-[var(--card)] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-[var(--border)]">
            <div className="p-6 text-center">
              <div className="text-4xl mb-3">🚪</div>
              <div className="text-lg font-black text-[var(--text)] mb-2">Logout?</div>
              <div className="text-sm text-[var(--muted)]">Kya aap sach mein logout karna chahte hain?</div>
            </div>
            <div className="flex border-t border-[var(--border)]">
              <button onClick={() => setShowLogout(false)}
                className="flex-1 py-4 text-sm font-bold text-[var(--muted)] bg-transparent border-none cursor-pointer hover:bg-[var(--hover)] transition-colors">
                Cancel
              </button>
              <div className="w-px bg-[var(--border)]" />
              <button onClick={onLogout}
                className="flex-1 py-4 text-sm font-bold text-red-500 bg-transparent border-none cursor-pointer hover:bg-red-500/5 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xl mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-0.5">{label}</div>
        <div className="text-sm text-[var(--text)] break-words">{value}</div>
      </div>
    </div>
  )
}
