// ─────────────────────────────────────────
//  EmptyState.jsx
//  — Shown on desktop when no chat is selected
//  — Has "View Chats" button for mobile
// ─────────────────────────────────────────
import { Icon } from '../Icons'

export default function EmptyState({ onShowSidebar }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 relative z-[1]">
      {/* Logo icon */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-700 to-green-500 flex items-center justify-center shadow-xl shadow-green-500/25">
        <Icon.Chat className="w-8 h-8 text-white" />
      </div>

      {/* Brand name */}
      <div className="text-2xl font-black tracking-tight text-[var(--text)]">
        Chit<span className="text-green-500">Chat</span>
      </div>

      {/* Subtitle */}
      <p className="text-sm text-[var(--muted)] text-center max-w-[220px] leading-relaxed">
        Select a conversation or search for a user to start chatting.
      </p>

      {/* Mobile only — open sidebar */}
      <button
        onClick={onShowSidebar}
        className="md:hidden bg-gradient-to-r from-green-700 to-green-500 text-white border-none rounded-xl px-6 py-3 text-sm font-bold cursor-pointer mt-2 shadow-lg shadow-green-500/25 active:scale-95 transition-transform"
      >
        View Chats
      </button>
    </div>
  )
}
