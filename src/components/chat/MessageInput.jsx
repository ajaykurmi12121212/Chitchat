// ─────────────────────────────────────────
//  MessageInput.jsx
// ─────────────────────────────────────────
import { useState, useRef } from 'react'
import { Icon } from '../Icons'
import { BACKEND } from '../shared/utils'

// ── Attach menu ──────────────────────────
function AttachMenu({ onSend, onClose }) {
  const fileRef   = useRef()
  const [uploading, setUploading] = useState(false)

  const opts = [
    { icon: Icon.Gallery, label: 'Photo',    accept: 'image/*',                    type: 'image',    bg: 'bg-blue-400/10',    color: 'text-blue-400' },
    { icon: Icon.Video,   label: 'Video',    accept: 'video/*',                    type: 'video',    bg: 'bg-purple-500/10',  color: 'text-purple-500' },
    { icon: Icon.Doc,     label: 'Document', accept: '.pdf,.doc,.docx,.txt,.xlsx',  type: 'document', bg: 'bg-green-500/10',   color: 'text-green-500' },
    { icon: Icon.Mic,     label: 'Audio',    accept: 'audio/*',                    type: 'audio',    bg: 'bg-red-500/10',     color: 'text-red-500' },
  ]

  const uploadFile = async (f, type) => {
    setUploading(true)
    try {
      const form  = new FormData()
      form.append('file', f)
      const token = localStorage.getItem('cc_token')
      const res   = await fetch(`${BACKEND}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const data = await res.json()
      onSend({ type, fileUrl: data.fileUrl, fileName: data.fileName, fileSize: data.fileSize, content: '' })
    } catch {
      onSend({ type, fileUrl: URL.createObjectURL(f), fileName: f.name, fileSize: `${Math.round(f.size / 1024)} KB`, content: '' })
    }
    setUploading(false)
    onClose()
  }

  return (
    <div className="absolute bottom-16 left-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-2 grid grid-cols-3 gap-1 shadow-xl z-10 min-w-[200px]">
      {uploading && (
        <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center z-10">
          <div className="w-7 h-7 border-3 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
        </div>
      )}
      {opts.map(o => (
        <button key={o.label}
          onClick={() => { fileRef.current._type = o.type; fileRef.current.accept = o.accept; fileRef.current.click() }}
          className="flex flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer border-none bg-transparent hover:bg-[var(--hover)]">
          <div className={`w-11 h-11 rounded-full ${o.bg} flex items-center justify-center`}>
            <o.icon className={`w-5 h-5 ${o.color}`} />
          </div>
          <span className="text-[10px] text-[var(--muted)] font-semibold">{o.label}</span>
        </button>
      ))}
      <button onClick={() => { onSend({ type: 'location', content: 'New Delhi, India' }); onClose() }}
        className="flex flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer border-none bg-transparent hover:bg-[var(--hover)]">
        <div className="w-11 h-11 rounded-full bg-blue-400/10 flex items-center justify-center">
          <Icon.Loc className="w-5 h-5 text-blue-400" />
        </div>
        <span className="text-[10px] text-[var(--muted)] font-semibold">Location</span>
      </button>
      <button onClick={() => { onSend({ type: 'text', content: '👤 Contact' }); onClose() }}
        className="flex flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer border-none bg-transparent hover:bg-[var(--hover)]">
        <div className="w-11 h-11 rounded-full bg-yellow-400/10 flex items-center justify-center">
          <Icon.Person className="w-5 h-5 text-yellow-400" />
        </div>
        <span className="text-[10px] text-[var(--muted)] font-semibold">Contact</span>
      </button>
      <input ref={fileRef} type="file" className="hidden" onChange={async e => {
        const f = e.target.files[0]; if (!f) return
        await uploadFile(f, fileRef.current._type)
        e.target.value = ''
      }} />
    </div>
  )
}

// ── Reply bar ────────────────────────────
function ReplyBar({ replyTo, onClear }) {
  return (
    <div className="bg-[var(--s1)] border-t border-[var(--border)] px-3 py-2 flex items-center gap-3 z-10 flex-shrink-0">
      <div className="flex-1 border-l-2 border-green-500 pl-2">
        <div className="text-xs font-bold text-green-500">{replyTo.sender?.name || 'You'}</div>
        <div className="text-xs text-[var(--muted)] truncate">{replyTo.content || '📎 Media'}</div>
      </div>
      <button onClick={onClear} className="border-none bg-transparent cursor-pointer text-[var(--muted)] text-lg p-1 hover:text-[var(--text)]">✕</button>
    </div>
  )
}

// ── Main export ──────────────────────────
export default function MessageInput({ replyTo, onClearReply, onSend, socket, active, user }) {
  const [text, setText]   = useState('')
  const [attach, setAttach] = useState(false)
  const typingRef         = useRef()

  const handleTyping = (e) => {
    setText(e.target.value)
    if (!socket || !active) return
    socket.emit('typing:start', { chatId: active._id, user })
    clearTimeout(typingRef.current)
    typingRef.current = setTimeout(
      () => socket.emit('typing:stop', { chatId: active._id, userId: user._id }),
      1500
    )
  }

  const send = (override) => {
    const payload = override || { type: 'text', content: text.trim() }
    if (payload.type === 'text' && !payload.content) return
    onSend(payload)
    if (!override) setText('')
    setAttach(false)
  }

  return (
    <>
      {replyTo && <ReplyBar replyTo={replyTo} onClear={onClearReply} />}

      <div
        className="bg-[var(--s1)] px-2 pt-2 flex items-center gap-2 border-t border-[var(--border)] relative z-10 flex-shrink-0"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          onClick={() => setAttach(a => !a)}
          className="w-10 h-10 rounded-full bg-[var(--s2)] flex items-center justify-center border-none cursor-pointer text-[var(--muted)] flex-shrink-0 active:scale-95 transition-transform"
        >
          <Icon.Attach className="w-5 h-5" />
        </button>

        <div className="flex-1 bg-[var(--inp)] rounded-3xl flex items-center gap-2 px-4 py-2 border border-[var(--border)] min-h-[42px]">
          <input
            value={text}
            onChange={handleTyping}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Message..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] min-w-0"
          />
          <button className="border-none bg-transparent cursor-pointer text-[var(--muted)] flex-shrink-0 p-0">
            <Icon.Emoji className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => text.trim()
            ? send()
            : send({ type: 'voice', content: '', duration: `0:${Math.floor(Math.random() * 50 + 5).toString().padStart(2, '0')}` })}
          className="w-11 h-11 rounded-full bg-gradient-to-br from-green-700 to-green-500 flex items-center justify-center border-none cursor-pointer flex-shrink-0 shadow-lg shadow-green-500/30 active:scale-95 transition-transform"
        >
          {text.trim()
            ? <Icon.Send className="w-5 h-5 text-white ml-0.5" />
            : <Icon.Mic  className="w-5 h-5 text-white" />}
        </button>

        {attach && <AttachMenu onSend={send} onClose={() => setAttach(false)} />}
      </div>
    </>
  )
}
