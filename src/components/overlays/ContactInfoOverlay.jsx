// ─────────────────────────────────────────
//  ContactInfoOverlay.jsx
//  — Shows contact details when tapped from chat header
//  — Has back button, block option
// ─────────────────────────────────────────
import { Icon } from '../Icons'
import Avatar from '../shared/Avatar'

export default function ContactInfoOverlay({ contact, isOnline, onClose }) {
  if (!contact) return null

  const online = isOnline(contact._id)

  return (
    <div className="absolute inset-0 z-40 bg-[var(--bg)] overflow-y-auto flex flex-col">

      {/* ── Top bar ── */}
      <div className="h-14 bg-[var(--s1)] px-4 flex items-center gap-3 border-b border-[var(--border)] flex-shrink-0 sticky top-0 z-10">
        <button
          onClick={onClose}
          className="w-9 h-9 bg-[var(--s2)] rounded-xl border-none cursor-pointer flex items-center justify-center active:scale-95 transition-transform"
          title="Back"
        >
          <Icon.Back className="w-5 h-5 text-[var(--text)]" />
        </button>
        <span className="text-base font-bold text-[var(--text)] flex-1">Contact Info</span>
      </div>

      {/* ── Hero banner ── */}
      <div className="bg-gradient-to-br from-green-700 to-green-500 px-6 pt-10 pb-14 text-center">
        <Avatar
          name={contact.name}
          src={contact.avatar}
          size={88}
          className="mx-auto mb-4 ring-4 ring-white/20"
        />
        <div className="text-xl font-black text-white">{contact.name}</div>
        {contact.phone && (
          <div className="text-sm text-white/70 mt-1">{contact.phone}</div>
        )}
        <div className={`text-xs mt-2 font-semibold ${online ? 'text-green-200' : 'text-white/50'}`}>
          {online ? '🟢 Online' : '⚫ Offline'}
        </div>
      </div>

      {/* ── Info card (pulled up) ── */}
      <div className="bg-[var(--card)] rounded-3xl mx-4 -mt-8 shadow-xl border border-[var(--border)] p-5 relative z-[1]">
        {contact.about && (
          <InfoRow label="About" value={contact.about} />
        )}
        {contact.email && (
          <InfoRow label="Email" value={contact.email} />
        )}
        {!contact.about && !contact.email && (
          <p className="text-sm text-[var(--muted)] text-center py-2">No additional info</p>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="mx-4 mt-4 flex flex-col gap-3">
        <ActionRow icon="🔕" label="Mute Notifications" />
        <ActionRow icon="🔍" label="Search in Conversation" />
        <div className="h-px bg-[var(--border)]" />
        <button className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl cursor-pointer hover:bg-red-500/20 transition-colors">
          <span className="text-xl">🚫</span>
          <span className="text-sm font-bold text-red-500">Block {contact.name}</span>
        </button>
        <button className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl cursor-pointer hover:bg-red-500/20 transition-colors">
          <span className="text-xl">🗑</span>
          <span className="text-sm font-bold text-red-500">Delete Chat</span>
        </button>
      </div>

      <div className="h-8" />
    </div>
  )
}

// ── Sub-components ────────────────────────
function InfoRow({ label, value }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-sm text-[var(--text)] break-words">{value}</div>
    </div>
  )
}

function ActionRow({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3.5 bg-[var(--card)] border border-[var(--border)] rounded-2xl cursor-pointer text-left hover:bg-[var(--hover)] transition-colors"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-semibold text-[var(--text)] flex-1">{label}</span>
      <span className="text-[var(--muted2)] text-sm">›</span>
    </button>
  )
}
