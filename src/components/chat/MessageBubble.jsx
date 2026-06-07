// ─────────────────────────────────────────
//  MessageBubble.jsx
// ─────────────────────────────────────────
import { useState } from 'react'
import { Icon } from '../Icons'
import Avatar, { gradFor, initials } from '../shared/Avatar'
import { timeOnly } from '../shared/utils'

function MediaBubble({ msg }) {
  if (msg.type === 'image') return (
    <div className="w-[220px] rounded-xl overflow-hidden cursor-pointer"
         onClick={() => msg.fileUrl && window.open(msg.fileUrl, '_blank')}>
      {msg.fileUrl
        ? <img src={msg.fileUrl} alt="" className="w-full max-h-[200px] object-cover block" />
        : <div className="h-28 bg-[var(--s3)] flex items-center justify-center">
            <Icon.Gallery className="w-9 h-9 text-[var(--muted2)]" />
          </div>}
      {msg.content && <p className="text-xs px-2 py-1 text-[var(--text)]">{msg.content}</p>}
    </div>
  )

  if (msg.type === 'video') return (
    <div className="w-[220px] rounded-xl overflow-hidden">
      {msg.fileUrl
        ? <video src={msg.fileUrl} controls className="w-full max-h-[180px] block bg-black" />
        : <div className="h-28 bg-[var(--s3)] flex items-center justify-center flex-col gap-1">
            <Icon.Video className="w-8 h-8 text-[var(--muted2)]" />
            <span className="text-[10px] text-[var(--muted)]">Video unavailable</span>
          </div>}
    </div>
  )

  if (msg.type === 'document') return (
    <div onClick={() => msg.fileUrl && window.open(msg.fileUrl, '_blank')}
         className="flex items-center gap-2 min-w-[160px] bg-[var(--s2)] rounded-xl p-2 border border-[var(--border)] cursor-pointer">
      <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
        <Icon.Doc className="w-5 h-5 text-green-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold truncate text-[var(--text)]">{msg.fileName || 'Document'}</div>
        <div className="text-[10px] text-[var(--muted)] mt-0.5">{msg.fileSize || ''}</div>
      </div>
    </div>
  )

  if (msg.type === 'voice' || msg.type === 'audio') return (
    <div className="flex items-center gap-2 min-w-[160px] cursor-pointer"
         onClick={() => msg.fileUrl && window.open(msg.fileUrl, '_blank')}>
      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
        <Icon.Play className="w-3 h-3 text-white ml-0.5" />
      </div>
      <div className="flex items-center gap-0.5 h-5 flex-1">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="w-0.5 rounded bg-green-500" style={{ height: Math.random() * 14 + 3 }} />
        ))}
      </div>
      <span className="text-[10px] text-[var(--muted)] font-medium">{msg.duration || '0:00'}</span>
    </div>
  )

  if (msg.type === 'location') return (
    <div className="flex items-center gap-2 cursor-pointer">
      <Icon.Loc className="w-4 h-4 text-green-500 flex-shrink-0" />
      <div>
        <div className="text-xs font-semibold text-[var(--text)]">Location</div>
        <div className="text-[10px] text-[var(--muted)]">{msg.content}</div>
      </div>
    </div>
  )

  return <p className="text-sm text-[var(--text)]">{msg.content}</p>
}

export default function MessageBubble({ msg, isMine, showName, onReply, onDelete }) {
  const [menu, setMenu] = useState(false)
  const isDeleted = msg.isDeleted
  const isText    = msg.type === 'text'

  return (
    <div
      className={`mr flex items-end gap-1 mb-0.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseLeave={() => setMenu(false)}
    >
      {/* Sender avatar (group chats) */}
      {!isMine && (
        showName
          ? <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-black flex-shrink-0 mb-1"
                 style={{ background: gradFor(msg.sender?.name || '?'), fontSize: 8 }}>
              {initials(msg.sender?.name)}
            </div>
          : <div className="w-6 flex-shrink-0" />
      )}

      {/* Bubble content */}
      <div className={`flex flex-col max-w-[78%] ${isMine ? 'items-end' : 'items-start'}`}>
        {showName && !isMine && !isDeleted && (
          <span className="text-[10px] font-bold text-green-500 mb-1 ml-1">{msg.sender?.name}</span>
        )}

        {/* Reply preview */}
        {msg.replyTo && !isDeleted && (
          <div className="border-l-2 border-green-500 pl-2 mb-1 bg-green-500/5 rounded-r-md px-2 py-1 max-w-full">
            <div className="text-[10px] font-bold text-green-500">{msg.replyTo.sender?.name || 'Message'}</div>
            <div className="text-[10px] text-[var(--muted)] truncate max-w-[160px]">
              {msg.replyTo.content || '📎 Media'}
            </div>
          </div>
        )}

        <div className={`
          relative max-w-full
          ${isDeleted || isText ? 'px-3 py-2' : 'p-1'}
          ${isMine
            ? 'rounded-[14px_14px_0_14px] bg-[var(--out)] border border-[var(--out-border)]'
            : 'rounded-[0_14px_14px_14px] bg-[var(--in)] border border-[var(--in-border)]'}
        `}>
          {isDeleted
            ? <p className="text-xs italic text-[var(--muted)]">🚫 Deleted</p>
            : isText
            ? <p className="text-sm leading-relaxed text-[var(--text)] break-words whitespace-pre-wrap">{msg.content}</p>
            : <MediaBubble msg={msg} />
          }

          {/* Time + read tick */}
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[10px] text-[var(--muted)] font-medium">{timeOnly(msg.createdAt)}</span>
            {isMine && !isDeleted && (
              msg.readBy?.length > 1
                ? <Icon.DCheck className="w-3 h-3 text-blue-400" />
                : <Icon.Check className="w-3 h-3 text-[var(--muted)]" />
            )}
          </div>
        </div>

        {/* Reactions */}
        {msg.reactions?.length > 0 && (
          <div className="flex gap-1 mt-1">
            {msg.reactions.map((r, i) => (
              <span key={i} className="text-xs bg-[var(--s2)] rounded-full px-1.5 py-0.5 border border-[var(--border)]">
                {r.emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Context menu trigger */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setMenu(m => !m)}
          className="msg-menu-btn opacity-0 w-6 h-6 rounded bg-none border-none cursor-pointer text-[var(--muted)] flex items-center justify-center text-xs"
        >▾</button>

        {menu && (
          <div className={`absolute top-full ${isMine ? 'right-0' : 'left-0'} bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-lg z-20 min-w-[130px]`}>
            <div className="flex gap-1 p-2 border-b border-[var(--border)]">
              {['😀', '❤️', '😂', '👍', '😮', '😢'].map(e => (
                <button key={e} className="text-base bg-none border-none cursor-pointer rounded p-0.5">{e}</button>
              ))}
            </div>
            <button
              onClick={() => { onReply(msg); setMenu(false) }}
              className="w-full px-3 py-2 text-sm text-[var(--text)] bg-none border-none cursor-pointer text-left font-medium hover:bg-[var(--hover)]"
            >↩ Reply</button>
            {isMine && (
              <button
                onClick={() => { onDelete(msg); setMenu(false) }}
                className="w-full px-3 py-2 text-sm text-red-500 bg-none border-none cursor-pointer text-left font-medium hover:bg-red-500/5"
              >🗑 Delete</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
