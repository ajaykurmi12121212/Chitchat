// ─────────────────────────────────────────
//  ChatHeader.jsx
// ─────────────────────────────────────────
import { useState, useRef, useEffect } from 'react'
import { Icon, IBtn } from '../Icons'
import Avatar from '../shared/Avatar'

export default function ChatHeader({ chat, other, chatName, isOnline, remoteType, onBack, onCall, onVideo, onViewProfile }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef()

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="h-14 bg-[var(--s1)] px-3 flex items-center gap-2 border-b border-[var(--border)] z-[100] flex-shrink-0 relative">

      {/* Back button */}
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-xl bg-[var(--s2)] border-none cursor-pointer flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
        title="Back"
      >
        <Icon.Back className="w-5 h-5 text-[var(--text)]" />
      </button>

      {/* Avatar + info — clickable to view profile */}
      <button
        onClick={onViewProfile}
        className="flex items-center gap-2 flex-1 min-w-0 bg-transparent border-none cursor-pointer text-left p-1 rounded-xl hover:bg-[var(--hover)] transition-colors"
      >
        <Avatar
          name={chatName}
          src={chat?.isGroup ? chat.groupAvatar : other?.avatar}
          online={!chat?.isGroup ? isOnline(other?._id) : undefined}
          size={36}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-[var(--text)] truncate leading-tight">{chatName}</div>
          <div className={`text-xs font-medium leading-tight transition-colors ${remoteType ? 'text-green-500' : 'text-[var(--muted)]'}`}>
            {remoteType
              ? 'typing...'
              : chat?.isGroup
              ? `${chat.members?.length} members`
              : isOnline(other?._id) ? 'online' : other?.phone || ''}
          </div>
        </div>
      </button>

      {/* Action buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <IBtn icon={Icon.Video} onClick={onVideo} title="Video Call" />
        <IBtn icon={Icon.Call}  onClick={onCall}  title="Voice Call" />

        {/* More dropdown */}
        <div className="relative" ref={moreRef}>
          <IBtn icon={Icon.More} onClick={() => setMoreOpen(o => !o)} title="More" />

          {moreOpen && (
            <div className="absolute right-0 top-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-50 min-w-[170px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <MoreMenuItem icon="👤" label="View Profile"    onClick={() => { onViewProfile(); setMoreOpen(false) }} />
              <MoreMenuItem icon="🔇" label="Mute"            onClick={() => setMoreOpen(false)} />
              <MoreMenuItem icon="🔍" label="Search Messages" onClick={() => setMoreOpen(false)} />
              <div className="h-px bg-[var(--border)] mx-2" />
              <MoreMenuItem icon="🗑" label="Clear Chat"      onClick={() => setMoreOpen(false)} danger />
              <MoreMenuItem icon="🚫" label="Block"           onClick={() => setMoreOpen(false)} danger />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MoreMenuItem({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium border-none cursor-pointer bg-transparent text-left hover:bg-[var(--hover)] transition-colors
        ${danger ? 'text-red-500' : 'text-[var(--text)]'}`}
    >
      <span className="text-base">{icon}</span>
      {label}
    </button>
  )
}
