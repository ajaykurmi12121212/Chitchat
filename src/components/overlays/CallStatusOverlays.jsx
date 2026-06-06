// ─────────────────────────────────────────
//  CallOverlay.jsx
// ─────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { Icon } from '../Icons'
import { gradFor, initials } from '../shared/Avatar'
import { getOther } from '../shared/utils'

export function CallOverlay({ type, chat, user, isOnline, onEnd }) {
  const [elapsed, setElapsed] = useState(0)
  const tRef = useRef()
  const other = chat?.isGroup ? null : getOther(chat, user._id)
  const name  = chat?.isGroup ? chat.name : other?.name || 'Unknown'

  useEffect(() => {
    setTimeout(() => { tRef.current = setInterval(() => setElapsed(e => e + 1), 1000) }, 1500)
    return () => clearInterval(tRef.current)
  }, [])

  const dur = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`

  return (
    <div className={`absolute inset-0 z-50 flex flex-col ${type === 'video' ? 'bg-gradient-to-b from-[#070b1f] to-[#040610]' : 'bg-gradient-to-b from-[#071a0f] to-[#040c07]'}`}>
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white"
             style={{ background: gradFor(name) }}>
          {initials(name)}
        </div>
        <div className="text-center">
          <div className="text-xl font-black text-white">{name}</div>
          <div className="text-sm text-white/40 mt-1">
            {elapsed > 0 ? `${type === 'video' ? 'Video' : 'Voice'} · ${dur}` : 'Calling...'}
          </div>
        </div>
      </div>
      <div className="flex gap-6 justify-center pb-12">
        {[
          { icon: Icon.Mute,    label: 'Mute',    fn: () => {} },
          { icon: Icon.End,     label: 'End',     fn: onEnd, bg: 'bg-red-500' },
          { icon: Icon.Speaker, label: 'Speaker', fn: () => {} },
        ].map(b => (
          <div key={b.label} className="flex flex-col items-center gap-2">
            <button onClick={b.fn} className={`w-14 h-14 rounded-full ${b.bg || 'bg-white/10'} flex items-center justify-center border-none cursor-pointer`}>
              <b.icon className="w-6 h-6 text-white" />
            </button>
            <span className="text-xs font-semibold text-white/40">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
//  StatusViewer.jsx
// ─────────────────────────────────────────
import { Icon } from '../Icons'
import Avatar from '../shared/Avatar'
import { timeOnly } from '../shared/utils'

export function StatusViewer({ groups, user, onClose }) {
  const [gi, setGi] = useState(0)
  const [si, setSi] = useState(0)
  const [prog, setProg] = useState(0)
  const tRef = useRef()
  const grp = groups[gi]
  const s   = grp?.statuses?.[si]

  useEffect(() => {
    if (!s) return
    setProg(0); clearInterval(tRef.current)
    const step = 100 / (5000 / 50)
    tRef.current = setInterval(() => setProg(p => {
      if (p >= 100) {
        clearInterval(tRef.current)
        if (si < grp.statuses.length - 1) setSi(i => i + 1)
        else if (gi < groups.length - 1) { setGi(i => i + 1); setSi(0) }
        else onClose()
        return 100
      }
      return p + step
    }), 50)
    return () => clearInterval(tRef.current)
  }, [gi, si])

  if (!grp || !s) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="flex gap-1 px-4 pt-3">
        {grp.statuses.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/20 rounded overflow-hidden">
            <div className="h-full bg-white rounded" style={{ width: i < si ? '100%' : i === si ? `${prog}%` : '0%' }} />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar name={grp.user.name} src={grp.user.avatar} size={36} />
        <div>
          <div className="text-sm font-bold text-white">{grp.user._id === user._id ? 'My Status' : grp.user.name}</div>
          <div className="text-xs text-white/40">{timeOnly(s.createdAt)}</div>
        </div>
        <button onClick={onClose} className="ml-auto w-8 h-8 bg-white/10 border-none rounded-lg cursor-pointer flex items-center justify-center">
          <Icon.Close className="w-4 h-4 text-white" />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-6" style={{ background: s.type === 'text' ? s.bgColor : '#000' }}>
        {s.type === 'image' && s.fileUrl
          ? <img src={s.fileUrl} alt="" className="max-w-full max-h-[80%] object-contain rounded-xl" />
          : s.type === 'video' && s.fileUrl
          ? <video src={s.fileUrl} className="max-w-full max-h-[80%]" controls autoPlay />
          : <p className="text-xl font-bold text-white text-center">{s.content}</p>}
      </div>
      <button className="absolute left-0 top-20 bottom-20 w-[40%] opacity-0 cursor-pointer border-none bg-transparent"
        onClick={() => { if (si > 0) setSi(i => i - 1); else if (gi > 0) { setGi(i => i - 1); setSi(0) } }} />
      <button className="absolute right-0 top-20 bottom-20 w-[40%] opacity-0 cursor-pointer border-none bg-transparent"
        onClick={() => { if (si < grp.statuses.length - 1) setSi(i => i + 1); else if (gi < groups.length - 1) { setGi(i => i + 1); setSi(0) } else onClose() }} />
    </div>
  )
}

// ─────────────────────────────────────────
//  StatusCompose.jsx
// ─────────────────────────────────────────
export function StatusCompose({ user, api, socket, onClose }) {
  const [text,    setText]    = useState('')
  const [bg,      setBg]      = useState('linear-gradient(135deg,#16a34a,#22c55e)')
  const [posting, setPosting] = useState(false)

  const COLORS = [
    'linear-gradient(135deg,#16a34a,#22c55e)',
    'linear-gradient(135deg,#1565c0,#42a5f5)',
    'linear-gradient(135deg,#6d1b7b,#e91e8c)',
    'linear-gradient(135deg,#7c1515,#ef4444)',
    'linear-gradient(135deg,#7c3f00,#f59e0b)',
    'linear-gradient(135deg,#1a1a3a,#818cf8)',
  ]

  const post = async () => {
    if (!text.trim()) return
    setPosting(true)
    try {
      const { data } = await api.post('/status', { content: text, type: 'text', bgColor: bg, fileUrl: '' })
      socket?.emit('status:new', { ...data, user })
      onClose()
    } catch { setPosting(false) }
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[var(--bg)]">
      <div className="h-14 bg-[var(--s1)] px-4 flex items-center gap-3 border-b border-[var(--border)] flex-shrink-0">
        <button onClick={onClose} className="w-9 h-9 bg-[var(--s2)] rounded-xl border-none cursor-pointer flex items-center justify-center">
          <Icon.Back className="w-5 h-5 text-[var(--text)]" />
        </button>
        <span className="text-base font-bold text-[var(--text)] flex-1">New Status</span>
        <button onClick={post} disabled={posting || !text.trim()}
          className="bg-green-500/10 text-green-500 border-none rounded-lg px-4 py-2 text-sm font-bold cursor-pointer disabled:opacity-50">
          {posting ? 'Posting...' : 'Post'}
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-7" style={{ background: bg }}>
        <p className="text-xl font-bold text-white text-center">{text || 'Write something...'}</p>
      </div>
      <div className="flex gap-2 px-4 py-3 border-t border-[var(--border)] overflow-x-auto">
        {COLORS.map((c, i) => (
          <button key={i} onClick={() => setBg(c)}
            className="w-7 h-7 rounded-full cursor-pointer flex-shrink-0"
            style={{ background: c, border: bg === c ? '2px solid var(--text)' : '2px solid transparent' }} />
        ))}
      </div>
      <div className="px-3 py-2 bg-[var(--s1)] border-t border-[var(--border)] flex-shrink-0">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Write a status..."
          className="w-full bg-[var(--inp)] border border-[var(--border)] rounded-full px-4 py-2.5 text-sm text-[var(--text)] outline-none" />
      </div>
    </div>
  )
}
