// ─────────────────────────────────────────
//  MessagesList.jsx
//  — Scrollable messages area
//  — Loading spinner
//  — Empty (encrypted) state
//  — Typing indicator
// ─────────────────────────────────────────
import { useRef, useEffect } from 'react'
import { Icon } from '../Icons'
import { gradFor, initials } from '../shared/Avatar'
import MessageBubble from './MessageBubble'

// ── Typing dots ──────────────────────────
function TypingIndicator({ chatName }) {
  const grad = gradFor(chatName || '?')
  return (
    <div className="flex items-end gap-1.5">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-white font-black mb-1 flex-shrink-0 text-[8px]"
        style={{ background: grad }}
      >
        {initials(chatName)}
      </div>
      <div className="bg-[var(--in)] border border-[var(--in-border)] rounded-[0_14px_14px_14px] px-4 py-3">
        <div className="flex gap-1 items-center h-3">
          {[0, 150, 300].map(d => (
            <div
              key={d}
              className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Loading spinner ──────────────────────
function LoadingSpinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="w-6 h-6 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
    </div>
  )
}

// ── Empty / encrypted placeholder ────────
function EmptyMessages() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-60 py-10">
      <Icon.Lock className="w-5 h-5 text-[var(--muted)]" />
      <p className="text-xs text-[var(--muted)] font-medium">End-to-end encrypted</p>
    </div>
  )
}

// ── Main export ──────────────────────────
export default function MessagesList({
  messages,
  loading,
  user,
  chat,
  chatName,
  remoteType,
  onReply,
  onDelete,
}) {
  const bottomRef = useRef()

  // Auto-scroll to bottom on new messages or typing
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, remoteType])

  return (
    <div
      className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-0.5 relative z-[1]"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {loading ? (
        <LoadingSpinner />
      ) : messages.length === 0 ? (
        <EmptyMessages />
      ) : (
        messages.map((msg, i) => {
          const isMine   = msg.sender?._id === user._id
          const prev     = messages[i - 1]
          const showName = chat?.isGroup && !isMine && prev?.sender?._id !== msg.sender?._id
          return (
            <MessageBubble
              key={msg._id}
              msg={msg}
              isMine={isMine}
              showName={showName}
              onReply={onReply}
              onDelete={onDelete}
            />
          )
        })
      )}

      {remoteType && <TypingIndicator chatName={chatName} />}

      <div ref={bottomRef} />
    </div>
  )
}
