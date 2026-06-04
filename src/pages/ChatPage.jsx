import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useTheme } from '../context/ThemeContext'
import { Icon, IBtn } from '../components/Icons'

const BACKEND = 'https://chitchat-backend-production-1f6e.up.railway.app'

const fmt = (d) => {
  if (!d) return ''
  const dt = new Date(d), now = new Date(), diff = now - dt
  if (diff < 60000)    return 'just now'
  if (diff < 3600000)  return `${Math.floor(diff/60000)}m ago`
  if (diff < 86400000) return dt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
  return dt.toLocaleDateString([],{day:'numeric',month:'short'})
}
const timeOnly = (d) => d ? new Date(d).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : ''
const getOther = (chat, uid) => chat.members?.find(m => (m._id||m) !== uid) || {}
const initials = (name='') => name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
const GRADS = [
  'linear-gradient(135deg,#6d1b7b,#e91e8c)',
  'linear-gradient(135deg,#1a6b3c,#22c55e)',
  'linear-gradient(135deg,#1565c0,#42a5f5)',
  'linear-gradient(135deg,#0f5132,#20c997)',
  'linear-gradient(135deg,#7c3f00,#ff9800)',
  'linear-gradient(135deg,#1a1a3a,#818cf8)',
]
const gradFor = (name='') => GRADS[name.charCodeAt(0) % GRADS.length]

function Av({ name='?', src, size=44, online, className='' }) {
  const s = size
  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width:s, height:s }}>
      {src
        ? <img src={src} alt={name} className="w-full h-full rounded-full object-cover"/>
        : <div className="w-full h-full rounded-full flex items-center justify-center font-extrabold text-white" style={{ background:gradFor(name), fontSize:s*0.32 }}>
            {initials(name)}
          </div>
      }
      {online !== undefined && (
        <span className={`absolute bottom-0.5 right-0.5 rounded-full border-2 border-[var(--s1)] ${online ? 'bg-green-500' : 'bg-[var(--s3)]'}`}
          style={{ width:s*0.27, height:s*0.27 }}/>
      )}
    </div>
  )
}

function Bubble({ msg, isMine, showName, onReply, onDelete }) {
  const [menu, setMenu] = useState(false)
  const isDeleted = msg.isDeleted

  return (
    <div className={`flex items-end gap-1 mb-0.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseLeave={() => setMenu(false)}>
      {!isMine && (
        showName
          ? <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-black flex-shrink-0 mb-1" style={{ background:gradFor(msg.sender?.name||'?'), fontSize:8 }}>
              {initials(msg.sender?.name)}
            </div>
          : <div className="w-6 flex-shrink-0"/>
      )}

      <div className={`flex flex-col max-w-[78%] ${isMine ? 'items-end' : 'items-start'}`}>
        {showName && !isMine && !isDeleted && (
          <span className="text-[10px] font-bold text-green-500 mb-1 ml-1">{msg.sender?.name}</span>
        )}
        {msg.replyTo && !isDeleted && (
          <div className="border-l-2 border-green-500 pl-2 mb-1 bg-green-500/5 rounded-r-md px-2 py-1 max-w-full">
            <div className="text-[10px] font-bold text-green-500">{msg.replyTo.sender?.name || 'Message'}</div>
            <div className="text-[10px] text-[var(--muted)] truncate max-w-[160px]">{msg.replyTo.content || '📎 Media'}</div>
          </div>
        )}

        <div className={`relative max-w-full ${isDeleted || msg.type==='text' ? 'px-3 py-2' : 'p-1'} ${isMine ? 'rounded-[14px_14px_0_14px] bg-[var(--out)] border border-[var(--out-border)]' : 'rounded-[0_14px_14px_14px] bg-[var(--in)] border border-[var(--in-border)]'}`}>
          {isDeleted
            ? <p className="text-xs italic text-[var(--muted)]">🚫 Deleted</p>
            : msg.type === 'text'
            ? <p className="text-sm leading-relaxed text-[var(--text)] break-words whitespace-pre-wrap">{msg.content}</p>
            : msg.type === 'image'
            ? <div className="w-[220px] rounded-xl overflow-hidden cursor-pointer" onClick={() => msg.fileUrl && window.open(msg.fileUrl,'_blank')}>
                {msg.fileUrl
                  ? <img src={msg.fileUrl} alt="" className="w-full max-h-[200px] object-cover block"/>
                  : <div className="h-28 bg-[var(--s3)] flex items-center justify-center"><Icon.Gallery className="w-9 h-9 text-[var(--muted2)]"/></div>}
                {msg.content && <p className="text-xs px-2 py-1 text-[var(--text)]">{msg.content}</p>}
              </div>
            : msg.type === 'video'
            ? <div className="w-[220px] rounded-xl overflow-hidden">
                {msg.fileUrl
                  ? <video src={msg.fileUrl} controls className="w-full max-h-[180px] block"/>
                  : <div className="h-28 bg-[var(--s3)] flex items-center justify-center flex-col gap-2">
                      <Icon.Video className="w-8 h-8 text-[var(--muted2)]"/>
                    </div>}
              </div>
            : msg.type === 'document'
            ? <div onClick={() => msg.fileUrl && window.open(msg.fileUrl,'_blank')} className="flex items-center gap-2 min-w-[160px] bg-[var(--s2)] rounded-xl p-2 border border-[var(--border)] cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Icon.Doc className="w-5 h-5 text-green-500"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate text-[var(--text)]">{msg.fileName || 'Document'}</div>
                  <div className="text-[10px] text-[var(--muted)] mt-0.5">{msg.fileSize || ''}</div>
                </div>
              </div>
            : (msg.type === 'voice' || msg.type === 'audio')
            ? <div className="flex items-center gap-2 min-w-[160px] cursor-pointer" onClick={() => msg.fileUrl && window.open(msg.fileUrl,'_blank')}>
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Icon.Play className="w-3 h-3 text-white ml-0.5"/>
                </div>
                <div className="flex items-center gap-0.5 h-5 flex-1">
                  {Array.from({length:10},(_,i) => (
                    <div key={i} className="w-0.5 rounded bg-green-500" style={{ height:Math.random()*14+3 }}/>
                  ))}
                </div>
                <span className="text-[10px] text-[var(--muted)] font-medium">{msg.duration || '0:00'}</span>
              </div>
            : msg.type === 'location'
            ? <div className="flex items-center gap-2 cursor-pointer">
                <Icon.Loc className="w-4 h-4 text-green-500 flex-shrink-0"/>
                <div>
                  <div className="text-xs font-semibold text-[var(--text)]">Location</div>
                  <div className="text-[10px] text-[var(--muted)]">{msg.content}</div>
                </div>
              </div>
            : <p className="text-sm text-[var(--text)]">{msg.content}</p>
          }
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[10px] text-[var(--muted)] font-medium">{timeOnly(msg.createdAt)}</span>
            {isMine && !isDeleted && (
              msg.readBy?.length > 1
                ? <Icon.DCheck className="w-3 h-3 text-blue-400"/>
                : <Icon.Check className="w-3 h-3 text-[var(--muted)]"/>
            )}
          </div>
        </div>

        {msg.reactions?.length > 0 && (
          <div className="flex gap-1 mt-1">
            {msg.reactions.map((r,i) => <span key={i} className="text-xs bg-[var(--s2)] rounded-full px-1.5 py-0.5 border border-[var(--border)]">{r.emoji}</span>)}
          </div>
        )}
      </div>

      <div className="relative flex-shrink-0">
        <button onClick={() => setMenu(m=>!m)}
          className="msg-menu-btn opacity-0 w-6 h-6 rounded bg-none border-none cursor-pointer text-[var(--muted)] flex items-center justify-center text-xs">▾</button>
        {menu && (
          <div className={`absolute top-full ${isMine ? 'right-0' : 'left-0'} bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-lg z-20 min-w-[130px]`}>
            <div className="flex gap-1 p-2 border-b border-[var(--border)]">
              {['😀','❤️','😂','👍','😮','😢'].map(e => (
                <button key={e} className="text-base bg-none border-none cursor-pointer rounded p-0.5">{e}</button>
              ))}
            </div>
            <button onClick={() => { onReply(msg); setMenu(false) }}
              className="w-full px-3 py-2 text-sm text-[var(--text)] bg-none border-none cursor-pointer text-left font-medium hover:bg-[var(--hover)]">
              ↩ Reply
            </button>
            {isMine && (
              <button onClick={() => { onDelete(msg); setMenu(false) }}
                className="w-full px-3 py-2 text-sm text-red-500 bg-none border-none cursor-pointer text-left font-medium hover:bg-red-500/5">
                🗑 Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AttachMenu({ onSend, onClose }) {
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)
  const opts = [
    { icon: Icon.Gallery, label:'Photo',    accept:'image/*',                   type:'image',    bg:'bg-blue-400/10',  color:'text-blue-400' },
    { icon: Icon.Video,   label:'Video',    accept:'video/*',                   type:'video',    bg:'bg-purple-500/10',color:'text-purple-500' },
    { icon: Icon.Doc,     label:'Document', accept:'.pdf,.doc,.docx,.txt,.xlsx', type:'document', bg:'bg-green-500/10', color:'text-green-500' },
    { icon: Icon.Mic,     label:'Audio',    accept:'audio/*',                   type:'audio',    bg:'bg-red-500/10',   color:'text-red-500' },
  ]

  const uploadFile = async (f, type) => {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', f)
      const token = localStorage.getItem('cc_token')
      const res = await fetch(`${BACKEND}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      })
      const data = await res.json()
      onSend({ type, fileUrl: data.fileUrl, fileName: data.fileName, fileSize: data.fileSize, content: '' })
    } catch {
      onSend({ type, fileUrl: URL.createObjectURL(f), fileName: f.name, fileSize: `${Math.round(f.size/1024)} KB`, content: '' })
    }
    setUploading(false)
    onClose()
  }

  return (
    <div className="absolute bottom-16 left-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-2 grid grid-cols-3 gap-1 shadow-xl z-10 min-w-[200px]">
      {uploading && (
        <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center z-10">
          <div className="w-7 h-7 border-3 border-green-500/20 border-t-green-500 rounded-full animate-spin"/>
        </div>
      )}
      {opts.map(o => (
        <button key={o.label}
          onClick={() => { fileRef.current._type = o.type; fileRef.current.accept = o.accept; fileRef.current.click() }}
          className="flex flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer border-none bg-transparent hover:bg-[var(--hover)]">
          <div className={`w-11 h-11 rounded-full ${o.bg} flex items-center justify-center`}>
            <o.icon className={`w-5 h-5 ${o.color}`}/>
          </div>
          <span className="text-[10px] text-[var(--muted)] font-semibold">{o.label}</span>
        </button>
      ))}
      <button onClick={() => { onSend({ type:'location', content:'New Delhi, India' }); onClose() }}
        className="flex flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer border-none bg-transparent hover:bg-[var(--hover)]">
        <div className="w-11 h-11 rounded-full bg-blue-400/10 flex items-center justify-center">
          <Icon.Loc className="w-5 h-5 text-blue-400"/>
        </div>
        <span className="text-[10px] text-[var(--muted)] font-semibold">Location</span>
      </button>
      <button onClick={() => { onSend({ type:'text', content:'👤 Contact' }); onClose() }}
        className="flex flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer border-none bg-transparent hover:bg-[var(--hover)]">
        <div className="w-11 h-11 rounded-full bg-yellow-400/10 flex items-center justify-center">
          <Icon.Person className="w-5 h-5 text-yellow-400"/>
        </div>
        <span className="text-[10px] text-[var(--muted)] font-semibold">Contact</span>
      </button>
      <input ref={fileRef} type="file" className="hidden" onChange={async e => {
        const f = e.target.files[0]; if (!f) return
        const type = fileRef.current._type
        await uploadFile(f, type)
        e.target.value = ''
      }}/>
    </div>
  )
}

function StatusViewer({ groups, user, onClose }) {
  const [gi, setGi] = useState(0)
  const [si, setSi] = useState(0)
  const [prog, setProg] = useState(0)
  const tRef = useRef()
  const grp = groups[gi]
  const s = grp?.statuses?.[si]

  useEffect(() => {
    if (!s) return
    setProg(0); clearInterval(tRef.current)
    const step = 100 / (5000/50)
    tRef.current = setInterval(() => setProg(p => {
      if (p >= 100) {
        clearInterval(tRef.current)
        if (si < grp.statuses.length - 1) setSi(i=>i+1)
        else if (gi < groups.length - 1) { setGi(i=>i+1); setSi(0) }
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
        {grp.statuses.map((_,i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/20 rounded overflow-hidden">
            <div className="h-full bg-white rounded" style={{ width: i < si ? '100%' : i === si ? `${prog}%` : '0%' }}/>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <Av name={grp.user.name} src={grp.user.avatar} size={36}/>
        <div>
          <div className="text-sm font-bold text-white">{grp.user._id === user._id ? 'My Status' : grp.user.name}</div>
          <div className="text-xs text-white/40">{timeOnly(s.createdAt)}</div>
        </div>
        <button onClick={onClose} className="ml-auto w-8 h-8 bg-white/10 border-none rounded-lg cursor-pointer flex items-center justify-center">
          <Icon.Close className="w-4 h-4 text-white"/>
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-6" style={{ background: s.type === 'text' ? s.bgColor : '#000' }}>
        {s.type === 'image' && s.fileUrl
          ? <img src={s.fileUrl} alt="" className="max-w-full max-h-[80%] object-contain rounded-xl"/>
          : s.type === 'video' && s.fileUrl
          ? <video src={s.fileUrl} className="max-w-full max-h-[80%]" controls autoPlay/>
          : <p className="text-xl font-bold text-white text-center">{s.content}</p>
        }
      </div>
      <button className="absolute left-0 top-20 bottom-20 w-[40%] opacity-0 cursor-pointer border-none bg-transparent" onClick={() => { if(si>0)setSi(i=>i-1); else if(gi>0){setGi(i=>i-1);setSi(0)} }}/>
      <button className="absolute right-0 top-20 bottom-20 w-[40%] opacity-0 cursor-pointer border-none bg-transparent" onClick={() => { if(si<grp.statuses.length-1)setSi(i=>i+1); else if(gi<groups.length-1){setGi(i=>i+1);setSi(0)} else onClose() }}/>
    </div>
  )
}

function CallOverlay({ type, chat, user, isOnline, onEnd }) {
  const [elapsed, setElapsed] = useState(0)
  const tRef = useRef()
  const other = chat?.isGroup ? null : getOther(chat, user._id)
  const name = chat?.isGroup ? chat.name : other?.name || 'Unknown'

  useEffect(() => {
    setTimeout(() => { tRef.current = setInterval(() => setElapsed(e => e+1), 1000) }, 1500)
    return () => clearInterval(tRef.current)
  }, [])

  const dur = `${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(elapsed%60).padStart(2,'0')}`

  return (
    <div className={`absolute inset-0 z-50 flex flex-col ${type==='video' ? 'bg-gradient-to-b from-[#070b1f] to-[#040610]' : 'bg-gradient-to-b from-[#071a0f] to-[#040c07]'}`}>
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white" style={{ background:gradFor(name) }}>
          {initials(name)}
        </div>
        <div className="text-center">
          <div className="text-xl font-black text-white">{name}</div>
          <div className="text-sm text-white/40 mt-1">{elapsed > 0 ? `${type==='video'?'Video':'Voice'} · ${dur}` : 'Calling...'}</div>
        </div>
      </div>
      <div className="flex gap-6 justify-center pb-12">
        {[
          { icon:Icon.Mute, label:'Mute', fn:()=>{} },
          { icon:Icon.End, label:'End', fn:onEnd, bg:'bg-red-500' },
          { icon:Icon.Speaker, label:'Speaker', fn:()=>{} },
        ].map(b => (
          <div key={b.label} className="flex flex-col items-center gap-2">
            <button onClick={b.fn} className={`w-14 h-14 rounded-full ${b.bg||'bg-white/10'} flex items-center justify-center border-none cursor-pointer`}>
              <b.icon className="w-6 h-6 text-white"/>
            </button>
            <span className="text-xs font-semibold text-white/40">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusCompose({ user, api, socket, onClose }) {
  const [text, setText] = useState('')
  const [bg, setBg] = useState('linear-gradient(135deg,#16a34a,#22c55e)')
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
          <Icon.Back className="w-5 h-5 text-[var(--text)]"/>
        </button>
        <span className="text-base font-bold text-[var(--text)] flex-1">New Status</span>
        <button onClick={post} disabled={posting || !text.trim()}
          className="bg-green-500/10 text-green-500 border-none rounded-lg px-4 py-2 text-sm font-bold cursor-pointer disabled:opacity-50">
          {posting ? 'Posting...' : 'Post'}
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-7" style={{ background:bg }}>
        <p className="text-xl font-bold text-white text-center">{text || 'Write something...'}</p>
      </div>
      <div className="flex gap-2 px-4 py-3 border-t border-[var(--border)] overflow-x-auto">
        {COLORS.map((c,i) => (
          <button key={i} onClick={() => setBg(c)}
            className="w-7 h-7 rounded-full cursor-pointer flex-shrink-0"
            style={{ background:c, border: bg===c ? '2px solid var(--text)' : '2px solid transparent' }}/>
        ))}
      </div>
      <div className="px-3 py-2 bg-[var(--s1)] border-t border-[var(--border)] flex-shrink-0">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Write a status..."
          className="w-full bg-[var(--inp)] border border-[var(--border)] rounded-full px-4 py-2.5 text-sm text-[var(--text)] outline-none"/>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { user, api, logout, updateUser } = useAuth()
  const { socket, isOnline } = useSocket()
  const { theme, toggle } = useTheme()

  const [chats, setChats] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [tab, setTab] = useState('chats')
  const [searchQ, setSearchQ] = useState('')
  const [searchRes, setSearchRes] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [statuses, setStatuses] = useState([])
  const [remoteType, setRemoteType] = useState(false)
  const [loadMsg, setLoadMsg] = useState(false)
  const [attach, setAttach] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [overlay, setOverlay] = useState(null)
  const [statusView, setStatusView] = useState(0)
  const [profEdit, setProfEdit] = useState(false)
  const [profForm, setProfForm] = useState({ name:'', about:'', phone:'' })
  const [addPhone, setAddPhone] = useState('')
  const [foundUser, setFoundUser] = useState(null)
  const [showSidebar, setShowSidebar] = useState(true)

  const bottomRef = useRef()
  const typingRef = useRef()
  const isDark = theme === 'dark'

  useEffect(() => { api.get('/chats').then(({ data }) => setChats(data)) }, [])

  useEffect(() => {
    if (tab === 'contacts' || overlay === 'addmem') api.get('/users/all').then(({ data }) => setAllUsers(data))
    if (tab === 'status') api.get('/status').then(({ data }) => setStatuses(data))
  }, [tab, overlay])

  useEffect(() => {
    if (!searchQ.trim()) return setSearchRes([])
    const t = setTimeout(() => api.get(`/users/search?q=${searchQ}`).then(({ data }) => setSearchRes(data)), 400)
    return () => clearTimeout(t)
  }, [searchQ])

  useEffect(() => {
    if (!socket) return
    const onMsg = (msg) => {
      if (active?._id === msg.chat) setMessages(p => [...p, msg])
      setChats(p => p.map(c => c._id === msg.chat ? { ...c, lastMessage: msg, updatedAt: new Date() } : c)
        .sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)))
      if (active?._id !== msg.chat && 'Notification' in window && Notification.permission === 'granted')
        new Notification(msg.sender?.name || 'New Message', { body: msg.content || '📎 Media', icon: '/favicon.ico' })
    }
    socket.on('message:receive', onMsg)
    socket.on('typing:start', ({ chatId }) => { if (active?._id === chatId) setRemoteType(true) })
    socket.on('typing:stop', ({ chatId }) => { if (active?._id === chatId) setRemoteType(false) })
    socket.on('status:new', (s) => setStatuses(p => {
      const uid = s.user?._id
      const ex = p.find(g => g.user._id === uid)
      if (ex) return p.map(g => g.user._id === uid ? { ...g, statuses:[...g.statuses,s] } : g)
      return [{ user:s.user, statuses:[s] }, ...p]
    }))
    return () => { socket.off('message:receive', onMsg); socket.off('typing:start'); socket.off('typing:stop') }
  }, [socket, active])

  useEffect(() => {
    if (!active || !socket) return
    socket.emit('chat:join', active._id)
    setLoadMsg(true)
    api.get(`/messages/${active._id}`).then(({ data }) => setMessages(data)).finally(() => setLoadMsg(false))
    return () => socket.emit('chat:leave', active._id)
  }, [active])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, remoteType])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
  }, [])

  const goBack = () => { setActive(null); setShowSidebar(true) }

  const openChat = (chat) => {
    setActive(chat); setRemoteType(false); setReplyTo(null); setShowSidebar(false)
  }

  const startDM = async (uid) => {
    const { data } = await api.post('/chats', { userId: uid })
    setChats(p => p.find(c => c._id === data._id) ? p : [data, ...p])
    openChat(data); setOverlay(null); setSearchQ(''); setSearchRes([])
  }

  const sendMsg = async (override) => {
    const payload = override || { type:'text', content: text.trim() }
    if (payload.type === 'text' && !payload.content) return
    if (!active) return
    if (!override) setText('')
    setReplyTo(null); setAttach(false)
    try {
      const { data: msg } = await api.post('/messages', {
        chatId: active._id, ...payload,
        ...(replyTo && !override ? { replyTo: replyTo._id } : {}),
      })
      setMessages(p => [...p, msg])
      socket?.emit('message:send', msg)
      setChats(p => p.map(c => c._id === active._id ? { ...c, lastMessage: msg, updatedAt: new Date() } : c)
        .sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)))
    } catch {}
  }

  const handleTyping = (e) => {
    setText(e.target.value)
    if (!socket || !active) return
    socket.emit('typing:start', { chatId: active._id, user })
    clearTimeout(typingRef.current)
    typingRef.current = setTimeout(() => socket.emit('typing:stop', { chatId: active._id, userId: user._id }), 1500)
  }

  const deleteMsg = async (msg) => {
    await api.delete(`/messages/${msg._id}`, { data: { forEveryone: true } })
    setMessages(p => p.map(m => m._id === msg._id ? { ...m, isDeleted: true, content: 'deleted' } : m))
  }

  const findUser = async () => {
    if (addPhone.length < 10) return
    const { data } = await api.get(`/users/search?q=${addPhone}`)
    setFoundUser(data[0] || null)
  }

  const saveProfile = async () => {
    const { data } = await api.put('/users/profile', { name: profForm.name, about: profForm.about, phone: profForm.phone ? `+91${profForm.phone}` : undefined })
    updateUser(data); setProfEdit(false)
  }

  const other = active && !active.isGroup ? getOther(active, user._id) : null
  const chatName = active?.isGroup ? active.name : other?.name
  const activeGrad = chatName ? gradFor(chatName) : GRADS[0]

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[var(--bg)] font-[var(--ff)]">
      <style>{`.msg-menu-btn{opacity:0}.mr:hover .msg-menu-btn{opacity:1!important}*{-webkit-tap-highlight-color:transparent}`}</style>

      {/* SIDEBAR */}
      <div className={`
        flex flex-col bg-[var(--s1)] border-r border-[var(--border)] flex-shrink-0
        md:relative md:w-[340px] md:translate-x-0
        absolute inset-y-0 left-0 z-30 w-full
        transition-transform duration-300
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Topbar */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-700 to-green-500 flex items-center justify-center flex-shrink-0">
              <Icon.Chat className="w-4 h-4 text-white"/>
            </div>
            <span className="text-lg font-black tracking-tight text-[var(--text)]">
              Chit<span className="text-green-500">Chat</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggle} className="w-9 h-9 rounded-xl flex items-center justify-center border-none bg-transparent cursor-pointer text-[var(--muted)] hover:bg-[var(--hover)]">
              {isDark ? <Icon.Sun className="w-5 h-5"/> : <Icon.Moon className="w-5 h-5"/>}
            </button>
            <IBtn icon={Icon.Edit} onClick={() => setOverlay('addmem')} title="New Chat"/>
            <IBtn icon={Icon.More} onClick={() => logout()} title="Logout"/>
          </div>
        </div>

        {/* Profile */}
        <button onClick={() => { setOverlay('profile'); setProfEdit(false); setProfForm({ name:user.name, about:user.about||'', phone:user.phone?.replace('+91','')||'' }) }}
          className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-transparent border-none cursor-pointer text-left w-full hover:bg-[var(--hover)] flex-shrink-0">
          <Av name={user.name} src={user.avatar} online={true} size={42}/>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-[var(--text)] truncate">{user.name}</div>
            <div className="text-xs text-[var(--muted)] mt-0.5">{user.phone || 'Tap to edit profile'}</div>
          </div>
          <Icon.Edit className="w-4 h-4 text-[var(--muted2)] flex-shrink-0"/>
        </button>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] flex-shrink-0">
          {['chats','status','calls'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-none cursor-pointer relative transition-colors
                ${tab===t ? 'text-green-500 bg-transparent' : 'text-[var(--muted)] bg-transparent hover:bg-[var(--hover)]'}`}>
              {t}
              {tab===t && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-green-500 rounded-t"/>}
            </button>
          ))}
        </div>

        {/* Search */}
        {tab === 'chats' && (
          <div className="px-3 py-2 border-b border-[var(--border)] flex-shrink-0">
            <div className="bg-[var(--s2)] rounded-xl flex items-center gap-2 px-3 py-2.5 border border-[var(--border)]">
              <Icon.Search className="w-4 h-4 text-[var(--muted2)] flex-shrink-0"/>
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search or start new chat"
                className="bg-transparent border-none outline-none text-sm text-[var(--text)] flex-1 min-w-0"/>
              {searchQ && <button onClick={() => { setSearchQ(''); setSearchRes([]) }} className="border-none bg-transparent cursor-pointer text-[var(--muted)] text-base leading-none">✕</button>}
            </div>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'chats' && searchQ
            ? searchRes.map(u => (
                <div key={u._id} onClick={() => startDM(u._id)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-[var(--border)] hover:bg-[var(--hover)]">
                  <Av name={u.name} src={u.avatar} online={isOnline(u._id)} size={46}/>
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)]">{u.name}</div>
                    <div className="text-xs text-[var(--muted)] mt-0.5">{u.phone||u.email}</div>
                  </div>
                </div>
              ))
            : tab === 'chats'
            ? chats.length === 0
              ? <div className="text-center py-12 px-6 text-[var(--muted)]">
                  <Icon.Chat className="w-10 h-10 mx-auto mb-3 text-[var(--muted2)]"/>
                  <p className="text-sm font-semibold">No chats yet</p>
                  <p className="text-xs mt-1">Search for users to start chatting</p>
                </div>
              : chats.map(chat => {
                  const o = chat.isGroup ? null : getOther(chat, user._id)
                  const name = chat.isGroup ? chat.name : o?.name || 'Unknown'
                  const last = chat.lastMessage
                  let lastTxt = 'Start a conversation'
                  if (last) {
                    if (last.isDeleted) lastTxt = '🚫 Deleted'
                    else if (last.type === 'image') lastTxt = '📷 Photo'
                    else if (last.type === 'video') lastTxt = '🎬 Video'
                    else if (last.type === 'document') lastTxt = `📄 ${last.fileName||'Doc'}`
                    else if (last.type === 'audio' || last.type === 'voice') lastTxt = '🎵 Audio'
                    else if (last.type === 'location') lastTxt = '📍 Location'
                    else lastTxt = last.content?.slice(0,40) + (last.content?.length > 40 ? '…' : '')
                  }
                  return (
                    <div key={chat._id} onClick={() => openChat(chat)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-[var(--border)] relative transition-colors
                        ${active?._id === chat._id ? 'bg-[var(--hover)]' : 'hover:bg-[var(--hover)]'}`}>
                      {active?._id === chat._id && <div className="absolute left-0 top-[20%] bottom-[20%] w-0.5 bg-green-500 rounded-r"/>}
                      <Av name={name} src={chat.isGroup ? chat.groupAvatar : o?.avatar} online={!chat.isGroup ? isOnline(o?._id) : undefined} size={46}/>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-sm font-semibold text-[var(--text)] truncate max-w-[60%]">{name}</span>
                          <span className="text-[10px] text-[var(--muted)] font-medium flex-shrink-0">{fmt(last?.createdAt || chat.updatedAt)}</span>
                        </div>
                        <p className="text-xs text-[var(--muted)] truncate">{lastTxt}</p>
                      </div>
                    </div>
                  )
                })
            : tab === 'status'
            ? <>
                <div onClick={() => setOverlay('sc')} className="flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-[var(--border)] hover:bg-[var(--hover)]">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-[var(--muted2)] p-0.5">
                      <Av name={user.name} src={user.avatar} size={40}/>
                    </div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-[var(--s1)]">
                      <Icon.Plus className="w-2 h-2 text-white"/>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)]">My Status</div>
                    <div className="text-xs text-[var(--muted)] mt-0.5">Tap to add update</div>
                  </div>
                </div>
                {statuses.map((g, gi) => (
                  <div key={gi} onClick={() => { setStatusView(gi); setOverlay('sv') }} className="flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-[var(--border)] hover:bg-[var(--hover)]">
                    <div className="w-12 h-12 rounded-full p-0.5 flex-shrink-0" style={{ background:'conic-gradient(#22c55e,#10b981,#22c55e)' }}>
                      <Av name={g.user.name} src={g.user.avatar} size={43} className="border-2 border-[var(--s1)] rounded-full"/>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--text)]">{g.user._id === user._id ? 'My Status' : g.user.name}</div>
                      <div className="text-xs text-[var(--muted)] mt-0.5">{g.statuses.length} update{g.statuses.length > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                ))}
              </>
            : chats.filter(c => !c.isGroup).slice(0,5).map(chat => {
                const o = getOther(chat, user._id)
                return (
                  <div key={chat._id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
                    <Av name={o.name} src={o.avatar} online={isOnline(o._id)} size={46}/>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[var(--text)]">{o.name}</div>
                      <div className="text-xs text-green-500 mt-0.5">📞 Incoming · Today</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setActive(chat); setOverlay('voice') }} className="w-9 h-9 rounded-full bg-[var(--s2)] border-none cursor-pointer flex items-center justify-center">
                        <Icon.Call className="w-4 h-4 text-green-500"/>
                      </button>
                      <button onClick={() => { setActive(chat); setOverlay('video') }} className="w-9 h-9 rounded-full bg-[var(--s2)] border-none cursor-pointer flex items-center justify-center">
                        <Icon.Video className="w-4 h-4 text-green-500"/>
                      </button>
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>

      {/* MAIN CHAT */}
      <div className={`
        flex-1 flex flex-col bg-[var(--bg)] relative overflow-hidden
        md:translate-x-0
        absolute inset-0 z-20
        transition-transform duration-300
        ${!showSidebar ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        {/* Dot pattern bg */}
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage:'radial-gradient(circle, var(--s3) 1px, transparent 1px)', backgroundSize:'24px 24px' }}/>

        {active ? (
          <>
            {/* Chat Header */}
            <div className="h-14 bg-[var(--s1)] px-3 flex items-center gap-2 border-b border-[var(--border)] z-10 flex-shrink-0 relative">
              <button onClick={goBack}
                className="w-9 h-9 rounded-xl bg-[var(--s2)] border-none cursor-pointer flex items-center justify-center flex-shrink-0 active:scale-95">
                <Icon.Back className="w-5 h-5 text-[var(--text)]"/>
              </button>
              <Av name={chatName} src={active.isGroup ? active.groupAvatar : other?.avatar} online={!active.isGroup ? isOnline(other?._id) : undefined} size={36}/>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[var(--text)] truncate leading-tight">{chatName}</div>
                <div className={`text-xs font-medium leading-tight ${remoteType ? 'text-green-500' : 'text-[var(--muted)]'}`}>
                  {remoteType ? 'typing...' : active.isGroup ? `${active.members?.length} members` : isOnline(other?._id) ? 'online' : other?.phone || ''}
                </div>
              </div>
              <div className="flex gap-1">
                <IBtn icon={Icon.Video} onClick={() => setOverlay('video')} title="Video"/>
                <IBtn icon={Icon.Call} onClick={() => setOverlay('voice')} title="Call"/>
                <IBtn icon={Icon.More} title="More"/>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-0.5 relative z-[1]" style={{ WebkitOverflowScrolling:'touch' }}>
              {loadMsg
                ? <div className="flex justify-center py-10">
                    <div className="w-6 h-6 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin"/>
                  </div>
                : messages.length === 0
                ? <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-60">
                    <Icon.Lock className="w-5 h-5 text-[var(--muted)]"/>
                    <p className="text-xs text-[var(--muted)] font-medium">End-to-end encrypted</p>
                  </div>
                : messages.map((msg, i) => {
                    const isMine = msg.sender?._id === user._id
                    const prev = messages[i-1]
                    const showName = active.isGroup && !isMine && prev?.sender?._id !== msg.sender?._id
                    return <Bubble key={msg._id} msg={msg} isMine={isMine} showName={showName} onReply={setReplyTo} onDelete={deleteMsg}/>
                  })
              }
              {remoteType && (
                <div className="flex items-end gap-1.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-black mb-1 flex-shrink-0 text-[8px]" style={{ background:activeGrad }}>
                    {initials(chatName)}
                  </div>
                  <div className="bg-[var(--in)] border border-[var(--in-border)] rounded-[0_14px_14px_14px] px-4 py-3">
                    <div className="flex gap-1 items-center h-3">
                      {[0,150,300].map(d => <div key={d} className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce" style={{ animationDelay:`${d}ms` }}/>)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Reply bar */}
            {replyTo && (
              <div className="bg-[var(--s1)] border-t border-[var(--border)] px-3 py-2 flex items-center gap-3 z-10 flex-shrink-0">
                <div className="flex-1 border-l-2 border-green-500 pl-2">
                  <div className="text-xs font-bold text-green-500">{replyTo.sender?.name || 'You'}</div>
                  <div className="text-xs text-[var(--muted)] truncate">{replyTo.content || '📎 Media'}</div>
                </div>
                <button onClick={() => setReplyTo(null)} className="border-none bg-transparent cursor-pointer text-[var(--muted)] text-lg p-1">✕</button>
              </div>
            )}

            {/* Input */}
            <div className="bg-[var(--s1)] px-2 py-2 flex items-center gap-2 border-t border-[var(--border)] relative z-10 flex-shrink-0">
              <button onClick={() => setAttach(a => !a)}
                className="w-10 h-10 rounded-full bg-[var(--s2)] flex items-center justify-center border-none cursor-pointer text-[var(--muted)] flex-shrink-0 active:scale-95">
                <Icon.Attach className="w-5 h-5"/>
              </button>
              <div className="flex-1 bg-[var(--inp)] rounded-3xl flex items-center gap-2 px-4 py-2 border border-[var(--border)] min-h-[42px]">
                <input value={text} onChange={handleTyping}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMsg())}
                  placeholder="Message..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] min-w-0"/>
                <button className="border-none bg-transparent cursor-pointer text-[var(--muted)] flex-shrink-0 p-0">
                  <Icon.Emoji className="w-5 h-5"/>
                </button>
              </div>
              <button onClick={() => text.trim() ? sendMsg() : sendMsg({ type:'voice', content:'', duration:`0:${Math.floor(Math.random()*50+5).toString().padStart(2,'0')}` })}
                className="w-11 h-11 rounded-full bg-gradient-to-br from-green-700 to-green-500 flex items-center justify-center border-none cursor-pointer flex-shrink-0 shadow-lg shadow-green-500/30 active:scale-95">
                {text.trim()
                  ? <Icon.Send className="w-5 h-5 text-white ml-0.5"/>
                  : <Icon.Mic className="w-5 h-5 text-white"/>
                }
              </button>
              {attach && <AttachMenu onSend={(p) => sendMsg(p)} onClose={() => setAttach(false)}/>}
            </div>

            {(overlay === 'voice' || overlay === 'video') && (
              <CallOverlay type={overlay} chat={active} user={user} isOnline={isOnline} onEnd={() => setOverlay(null)}/>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 relative z-[1]">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-700 to-green-500 flex items-center justify-center shadow-xl shadow-green-500/25">
              <Icon.Chat className="w-8 h-8 text-white"/>
            </div>
            <div className="text-2xl font-black tracking-tight text-[var(--text)]">
              Chit<span className="text-green-500">Chat</span>
            </div>
            <p className="text-sm text-[var(--muted)] text-center max-w-[220px] leading-relaxed">
              Select a conversation or search for a user to start chatting.
            </p>
            <button onClick={() => setShowSidebar(true)}
              className="md:hidden bg-gradient-to-r from-green-700 to-green-500 text-white border-none rounded-xl px-6 py-3 text-sm font-bold cursor-pointer mt-2 shadow-lg shadow-green-500/25">
              View Chats
            </button>
          </div>
        )}

        {/* ADD MEMBER OVERLAY */}
        {overlay === 'addmem' && (
          <div className="absolute inset-0 z-40 flex flex-col bg-[var(--bg)]">
            <div className="h-14 bg-[var(--s1)] px-4 flex items-center gap-3 border-b border-[var(--border)] flex-shrink-0">
              <button onClick={() => setOverlay(null)} className="w-9 h-9 bg-[var(--s2)] rounded-xl border-none cursor-pointer flex items-center justify-center">
                <Icon.Back className="w-5 h-5 text-[var(--text)]"/>
              </button>
              <span className="text-base font-bold text-[var(--text)]">New Chat</span>
            </div>
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <div className="text-xs text-[var(--muted)] mb-2 font-medium">Find by mobile number:</div>
              <div className="flex gap-2">
                <div className="flex-1 bg-[var(--s2)] border border-[var(--border)] rounded-xl flex items-center gap-2 px-3 py-2.5">
                  <Icon.Call className="w-3.5 h-3.5 text-[var(--muted)] flex-shrink-0"/>
                  <span className="text-sm text-[var(--muted)] font-bold">+91</span>
                  <div className="w-px h-4 bg-[var(--border)]"/>
                  <input value={addPhone} onChange={e => setAddPhone(e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="Mobile number" inputMode="numeric"
                    className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] min-w-0"/>
                </div>
                <button onClick={findUser} className="bg-green-500 text-white border-none rounded-xl px-4 text-sm font-bold cursor-pointer">Find</button>
              </div>
              {foundUser && (
                <div className="mt-3 bg-green-500/5 border border-green-500/20 rounded-xl p-3 flex items-center gap-3">
                  <Av name={foundUser.name} src={foundUser.avatar} size={40}/>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[var(--text)]">{foundUser.name}</div>
                    <div className="text-xs text-green-500 mt-0.5">{foundUser.phone}</div>
                  </div>
                  <button onClick={() => { startDM(foundUser._id); setFoundUser(null); setAddPhone('') }}
                    className="bg-green-500 text-white border-none rounded-lg px-3 py-2 text-xs font-bold cursor-pointer">Chat</button>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="text-[10px] font-bold text-[var(--muted2)] px-4 py-2 uppercase tracking-wider">All Contacts</div>
              {allUsers.map(u => (
                <div key={u._id} onClick={() => startDM(u._id)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-[var(--border)] hover:bg-[var(--hover)]">
                  <Av name={u.name} src={u.avatar} online={isOnline(u._id)} size={46}/>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[var(--text)]">{u.name}</div>
                    <div className="text-xs text-[var(--muted)] mt-0.5">{u.phone || u.email}</div>
                  </div>
                  {isOnline(u._id) && <span className="text-[10px] font-bold text-green-500 flex-shrink-0">Online</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {overlay === 'sc' && <StatusCompose user={user} api={api} socket={socket} onClose={() => setOverlay(null)}/>}
        {overlay === 'sv' && statuses[statusView] && <StatusViewer groups={statuses} user={user} onClose={() => setOverlay(null)}/>}

        {/* PROFILE OVERLAY */}
        {overlay === 'profile' && (
          <div className="absolute inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-[var(--card)] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-br from-green-700 to-green-500 p-6 text-center relative">
                <button onClick={() => setOverlay(null)} className="absolute top-3 right-3 w-8 h-8 bg-white/20 border-none rounded-lg cursor-pointer flex items-center justify-center">
                  <Icon.Close className="w-4 h-4 text-white"/>
                </button>
                <Av name={user.name} src={user.avatar} size={64} className="mx-auto mb-3"/>
                <div className="text-lg font-black text-white">{user.name}</div>
                <div className="text-sm text-white/70 mt-1">{user.phone || user.email}</div>
              </div>
              <div className="p-5">
                {!profEdit ? (
                  <>
                    <div className="bg-[var(--s2)] rounded-xl p-3 mb-4">
                      <div className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1">About</div>
                      <div className="text-sm text-[var(--text)]">{user.about || 'Hey there! I am using ChitChat 👋'}</div>
                    </div>
                    <button onClick={() => setProfEdit(true)}
                      className="w-full py-3 bg-gradient-to-r from-green-700 to-green-500 text-white border-none rounded-xl text-sm font-bold cursor-pointer">
                      Edit Profile
                    </button>
                  </>
                ) : (
                  <>
                    {[{k:'name',l:'Name',p:'Your name'},{k:'about',l:'About',p:'Hey there!'},{k:'phone',l:'Phone',p:'9876543210'}].map(f => (
                      <div key={f.k} className="mb-3">
                        <label className="block text-[10px] font-bold text-[var(--muted2)] uppercase tracking-wider mb-1">{f.l}</label>
                        <input value={profForm[f.k]} onChange={e => setProfForm(p => ({...p,[f.k]:e.target.value}))} placeholder={f.p}
                          className="w-full border border-[var(--border)] rounded-xl bg-[var(--inp)] px-3 py-2.5 text-sm text-[var(--text)] outline-none"/>
                      </div>
                    ))}
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => setProfEdit(false)}
                        className="flex-1 py-3 bg-[var(--s2)] text-[var(--muted)] border-none rounded-xl text-sm font-bold cursor-pointer">Cancel</button>
                      <button onClick={saveProfile}
                        className="flex-1 py-3 bg-gradient-to-r from-green-700 to-green-500 text-white border-none rounded-xl text-sm font-bold cursor-pointer">Save</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}