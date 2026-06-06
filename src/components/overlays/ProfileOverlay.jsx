// ─────────────────────────────────────────
//  ProfileOverlay.jsx
//  — Full profile view + edit sheet
//  — Separate logout button
//  — Back / close button
// ─────────────────────────────────────────
import { useState } from 'react'
import { Icon } from '../Icons'
import Avatar from '../shared/Avatar'

export default function ProfileOverlay({ user, onClose, onSave, onLogout }) {
  const [editing, setEditing]   = useState(false)
  const [saving,  setSaving]    = useState(false)
  const [form,    setForm]      = useState({
    name:  user.name  || '',
    about: user.about || '',
    phone: user.phone?.replace('+91', '') || '',
  })

  const handleSave = async () => {
    setSaving(true)
    await onSave({ name: form.name, about: form.about, phone: form.phone ? `+91${form.phone}` : undefined })
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[var(--bg)] overflow-y-auto">

      {/* ── Top bar ── */}
      <div className="h-14 bg-[var(--s1)] px-4 flex items-center gap-3 border-b border-[var(--border)] flex-shrink-0 sticky top-0 z-10">
        <button
          onClick={onClose}
          className="w-9 h-9 bg-[var(--s2)] rounded-xl border-none cursor-pointer flex items-center justify-center active:scale-95 transition-transform"
          title="Back"
        >
          <Icon.Back className="w-5 h-5 text-[var(--text)]" />
        </button>
        <span className="text-base font-bold text-[var(--text)] flex-1">Profile</span>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg px-3 py-1.5 text-sm font-bold cursor-pointer hover:bg-green-500/20 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {/* ── Hero banner ── */}
      <div className="bg-gradient-to-br from-green-700 to-green-500 px-6 pt-10 pb-14 text-center relative">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Avatar name={user.name} src={user.avatar} size={88} className="ring-4 ring-white/20" />
            {editing && (
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-none cursor-pointer">
                <Icon.Edit className="w-4 h-4 text-green-700" />
              </button>
            )}
          </div>
        </div>
        <div className="text-xl font-black text-white">{user.name}</div>
        <div className="text-sm text-white/70 mt-1">{user.phone || user.email}</div>
      </div>

      {/* ── Info card (pulled up) ── */}
      <div className="bg-[var(--card)] rounded-3xl mx-4 -mt-8 shadow-xl border border-[var(--border)] overflow-hidden relative z-[1]">

        {!editing ? (
          /* ── View mode ── */
          <div className="p-5 flex flex-col gap-4">
            <InfoRow icon="👤" label="Name"  value={user.name} />
            <InfoRow icon="💬" label="About" value={user.about || 'Hey there! I am using ChitChat 👋'} />
            {user.phone && <InfoRow icon="📞" label="Phone" value={user.phone} />}
            {user.email && <InfoRow icon="📧" label="Email" value={user.email} />}
          </div>
        ) : (
          /* ── Edit mode ── */
          <div className="p-5 flex flex-col gap-4">
            {[
              { k: 'name',  l: 'Name',  p: 'Your name',   t: 'text' },
              { k: 'about', l: 'About', p: 'Hey there!',  t: 'text' },
              { k: 'phone', l: 'Phone', p: '9876543210',  t: 'tel'  },
            ].map(f => (
              <div key={f.k}>
                <label className="block text-[10px] font-bold text-[var(--muted2)] uppercase tracking-wider mb-1.5">{f.l}</label>
                <input
                  type={f.t}
                  value={form[f.k]}
                  onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                  placeholder={f.p}
                  className="w-full border border-[var(--border)] rounded-xl bg-[var(--inp)] px-4 py-3 text-sm text-[var(--text)] outline-none focus:border-green-500/50 transition-colors"
                />
              </div>
            ))}
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-3 bg-[var(--s2)] text-[var(--muted)] border-none rounded-xl text-sm font-bold cursor-pointer hover:bg-[var(--hover)] transition-colors"
              >Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-gradient-to-r from-green-700 to-green-500 text-white border-none rounded-xl text-sm font-bold cursor-pointer disabled:opacity-60 transition-opacity"
              >{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Action buttons ── */}
      <div className="mx-4 mt-4 flex flex-col gap-3">
        {/* Notifications, Privacy, etc. */}
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

        {/* ── Logout ── */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl cursor-pointer hover:bg-red-500/20 transition-colors mt-2"
        >
          <span className="text-xl">🚪</span>
          <span className="text-sm font-bold text-red-500">Logout</span>
        </button>
      </div>

      <div className="h-8" /> {/* bottom spacer */}
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
