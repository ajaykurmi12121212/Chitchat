import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useTheme } from '../context/ThemeContext'
import { Icon, IBtn } from '../components/Icons'

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

function Av({ name='?', src, size=44, online, style={} }) {
  return (
    <div style={{ position:'relative', flexShrink:0, ...style }}>
      {src
        ? <img src={src} alt={name} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover' }}/>
        : <div style={{ width:size, height:size, borderRadius:'50%', background:gradFor(name), display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.3, fontWeight:800, color:'#fff', letterSpacing:'-.3px' }}>
            {initials(name)}
          </div>
      }
      {online !== undefined && (
        <span style={{ position:'absolute', bottom:1, right:1, width:size*0.25, height:size*0.25, borderRadius:'50%', background: online ? '#22c55e' : 'var(--s3)', border:'2.5px solid var(--s1)', boxShadow: online ? '0 0 6px rgba(34,197,94,.4)' : 'none' }}/>
      )}
    </div>
  )
}

function Bubble({ msg, isMine, showName, onReply, onDelete }) {
  const [menu, setMenu] = useState(false)
  const isDeleted = msg.isDeleted

  const bubStyle = {
    padding: msg.type === 'text' || isDeleted ? '8px 12px' : '4px',
    borderRadius: isMine ? '14px 14px 0 14px' : '0 14px 14px 14px',
    maxWidth: '66%',
    position: 'relative',
    background: isMine ? 'var(--out)' : 'var(--in)',
    border: isMine ? '.5px solid var(--out-border)' : '.5px solid var(--in-border)',
  }

  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, marginBottom:2, flexDirection: isMine ? 'row-reverse' : 'row' }}
      onMouseLeave={() => setMenu(false)}>
      {!isMine && (
        showName
          ? <div style={{ width:26, height:26, borderRadius:'50%', background:gradFor(msg.sender?.name||'?'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'#fff', flexShrink:0, marginBottom:4 }}>
              {initials(msg.sender?.name)}
            </div>
          : <div style={{ width:26, flexShrink:0 }}/>
      )}

      <div style={{ display:'flex', flexDirection:'column', alignItems: isMine ? 'flex-end' : 'flex-start', maxWidth:'66%' }}>
        {showName && !isMine && !isDeleted && (
          <span style={{ fontSize:11, fontWeight:700, color:'#22c55e', marginBottom:3, marginLeft:2 }}>{msg.sender?.name}</span>
        )}
        {msg.replyTo && !isDeleted && (
          <div style={{ borderLeft:'3px solid #22c55e', paddingLeft:8, marginBottom:3, background:'rgba(34,197,94,.06)', borderRadius:'0 6px 6px 0', padding:'5px 8px', maxWidth:'100%' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#22c55e' }}>{msg.replyTo.sender?.name || 'Message'}</div>
            <div style={{ fontSize:11, color:'var(--muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:180 }}>{msg.replyTo.content || '📎 Media'}</div>
          </div>
        )}
        <div style={bubStyle}>
          {isDeleted
            ? <p style={{ fontSize:13, fontStyle:'italic', color:'var(--muted)' }}>🚫 This message was deleted</p>
            : msg.type === 'text'
            ? <p style={{ fontSize:13.5, lineHeight:1.55, color:'var(--text)', whiteSpace:'pre-wrap' }}>{msg.content}</p>
            : msg.type === 'image'
            ? <div style={{ width:200, borderRadius:10, overflow:'hidden', cursor:'pointer' }}>
                {msg.fileUrl
                  ? <img src={msg.fileUrl} alt="" style={{ width:'100%', maxHeight:180, objectFit:'cover' }}/>
                  : <div style={{ height:150, background:'var(--s3)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon.Gallery width={44} height={44} style={{ color:'var(--muted2)' }}/></div>}
                {msg.content && <p style={{ fontSize:13, padding:'6px 10px', color:'var(--text)' }}>{msg.content}</p>}
              </div>
            : msg.type === 'video'
            ? <div style={{ width:200, borderRadius:10, overflow:'hidden', cursor:'pointer', background:'var(--s3)', height:150, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8 }}>
                <Icon.Video width={40} height={40} style={{ color:'var(--muted2)' }}/>
                <span style={{ fontSize:11, color:'var(--muted)', fontWeight:600 }}>Video</span>
              </div>
            : msg.type === 'document'
            ? <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:190, background:'var(--s2)', borderRadius:10, padding:10, border:'.5px solid var(--border)' }}>
                <div style={{ width:38, height:38, borderRadius:9, background:'rgba(34,197,94,.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon.Doc width={20} height={20} style={{ color:'#22c55e' }}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'var(--text)' }}>{msg.fileName || 'Document'}</div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{msg.fileSize || ''}</div>
                </div>
                <Icon.Down width={16} height={16} style={{ color:'#22c55e' }}/>
              </div>
            : (msg.type === 'voice' || msg.type === 'audio')
            ? <div style={{ display:'flex', alignItems:'center', gap:9, minWidth:190, cursor:'pointer' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'#22c55e', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon.Play width={13} height={13} style={{ color:'#fff', marginLeft:2 }}/>
                </div>
                <div style={{ flex:1, display:'flex', alignItems:'center', gap:2, height:26 }}>
                  {Array.from({length:12},(_,i) => (
                    <div key={i} style={{ width:2.5, borderRadius:2, background:'#22c55e', height:Math.random()*18+3 }}/>
                  ))}
                </div>
                <span style={{ fontSize:10, color:'var(--muted)', fontWeight:500, whiteSpace:'nowrap' }}>{msg.duration || '0:00'}</span>
              </div>
            : msg.type === 'location'
            ? <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                <Icon.Loc width={16} height={16} style={{ color:'#22c55e', flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Location</div>
                  <div style={{ fontSize:11, color:'var(--muted)' }}>{msg.content || 'Tap to view'}</div>
                </div>
              </div>
            : <p style={{ fontSize:13.5, color:'var(--text)' }}>{msg.content}</p>
          }
          <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4, marginTop: msg.type === 'text' || isDeleted ? 4 : 2, padding: msg.type !== 'text' && !isDeleted ? '2px 6px' : 0 }}>
            <span style={{ fontSize:10, color:'var(--muted)', fontWeight:500 }}>{timeOnly(msg.createdAt)}</span>
            {isMine && !isDeleted && (
              msg.readBy?.length > 1
                ? <Icon.DCheck width={13} height={13} style={{ color:'var(--blue)' }}/>
                : <Icon.Check width={12} height={12} style={{ color:'var(--muted)' }}/>
            )}
          </div>
        </div>
        {msg.reactions?.length > 0 && (
          <div style={{ display:'flex', gap:3, marginTop:3 }}>
            {msg.reactions.map((r,i) => <span key={i} style={{ fontSize:13, background:'var(--s2)', borderRadius:20, padding:'2px 6px', border:'.5px solid var(--border)' }}>{r.emoji}</span>)}
          </div>
        )}
      </div>

      <div style={{ position:'relative', flexShrink:0 }}>
        <button onClick={() => setMenu(m=>!m)}
          style={{ opacity: menu ? 1 : 0, width:24, height:24, borderRadius:6, background:'none', border:'none', cursor:'pointer', color:'var(--muted)', transition:'opacity .15s', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}
          className="msg-menu-btn">▾</button>
        {menu && (
          <div style={{ position:'absolute', [isMine?'right':'left']:0, top:'100%', background:'var(--card)', border:'.5px solid var(--border)', borderRadius:12, overflow:'hidden', boxShadow:'var(--shadow)', zIndex:20, minWidth:140 }}>
            <div style={{ display:'flex', gap:2, padding:'8px 10px', borderBottom:'.5px solid var(--border)' }}>
              {['😀','❤️','😂','👍','😮','😢'].map(e => (
                <button key={e} style={{ fontSize:17, background:'none', border:'none', cursor:'pointer', borderRadius:6, padding:3 }}>{e}</button>
              ))}
            </div>
            <button onClick={() => { onReply(msg); setMenu(false) }}
              style={{ width:'100%', padding:'10px 14px', fontSize:13, color:'var(--text)', background:'none', border:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit', fontWeight:500, display:'flex', alignItems:'center', gap:8 }}>
              ↩ Reply
            </button>
            {isMine && (
              <button onClick={() => { onDelete(msg); setMenu(false) }}
                style={{ width:'100%', padding:'10px 14px', fontSize:13, color:'#ef4444', background:'none', border:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit', fontWeight:500, display:'flex', alignItems:'center', gap:8 }}>
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
  const opts = [
    { icon: Icon.Gallery, label:'Photo',    accept:'image/*',                   type:'image',    bg:'rgba(96,165,250,.12)',  color:'#60a5fa' },
    { icon: Icon.Video,   label:'Video',    accept:'video/*',                   type:'video',    bg:'rgba(168,85,247,.12)',  color:'#a855f7' },
    { icon: Icon.Doc,     label:'Document', accept:'.pdf,.doc,.docx,.txt,.xlsx', type:'document', bg:'rgba(34,197,94,.1)',    color:'#22c55e' },
    { icon: Icon.Mic,     label:'Audio',    accept:'audio/*',                   type:'audio',    bg:'rgba(239,68,68,.1)',    color:'#ef4444' },
  ]
  return (
    <div style={{ position:'absolute', bottom:66, left:12, background:'var(--card)', border:'.5px solid var(--border)', borderRadius:18, padding:8, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:2, boxShadow:'var(--shadow)', zIndex:10, minWidth:220 }}>
      {opts.map(o => (
        <button key={o.label}
          onClick={() => { fileRef.current._type = o.type; fileRef.current.accept = o.accept; fileRef.current.click(); onClose() }}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:7, padding:'11px 10px', borderRadius:12, cursor:'pointer', border:'none', background:'none', fontFamily:'inherit' }}>
          <div style={{ width:46, height:46, borderRadius:'50%', background:o.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <o.icon width={22} height={22} style={{ color:o.color }}/>
          </div>
          <span style={{ fontSize:11, color:'var(--muted)', fontWeight:600, whiteSpace:'nowrap' }}>{o.label}</span>
        </button>
      ))}
      <button onClick={() => { onSend({ type:'location', content:'New Delhi, India' }); onClose() }}
        style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:7, padding:'11px 10px', borderRadius:12, cursor:'pointer', border:'none', background:'none', fontFamily:'inherit' }}>
        <div style={{ width:46, height:46, borderRadius:'50%', background:'rgba(96,165,250,.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon.Loc width={22} height={22} style={{ color:'#60a5fa' }}/>
        </div>
        <span style={{ fontSize:11, color:'var(--muted)', fontWeight:600 }}>Location</span>
      </button>
      <button onClick={() => { onSend({ type:'text', content:'👤 Contact' }); onClose() }}
        style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:7, padding:'11px 10px', borderRadius:12, cursor:'pointer', border:'none', background:'none', fontFamily:'inherit' }}>
        <div style={{ width:46, height:46, borderRadius:'50%', background:'rgba(251,191,36,.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon.Person width={22} height={22} style={{ color:'#fbbf24' }}/>
        </div>
        <span style={{ fontSize:11, color:'var(--muted)', fontWeight:600 }}>Contact</span>
      </button>
      <input ref={fileRef} type="file" style={{ display:'none' }} onChange={e => {
        const f = e.target.files[0]; if (!f) return
        const type = fileRef.current._type
        onSend({ type, fileUrl: URL.createObjectURL(f), fileName: f.name, fileSize: `${Math.round(f.size/1024)} KB`, content: '' })
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
    <div style={{ position:'fixed', inset:0, zIndex:100, background:'#000', display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', gap:4, padding:'12px 14px 0' }}>
        {grp.statuses.map((_,i) => (
          <div key={i} style={{ flex:1, height:2, background:'rgba(255,255,255,.2)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'#fff', borderRadius:2, width: i < si ? '100%' : i === si ? `${prog}%` : '0%' }}/>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px' }}>
        <Av name={grp.user.name} src={grp.user.avatar} size={38}/>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{grp.user._id === user._id ? 'My Status' : grp.user.name}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.45)' }}>{timeOnly(s.createdAt)}</div>
        </div>
        <button onClick={onClose} style={{ marginLeft:'auto', background:'rgba(255,255,255,.1)', border:'none', width:32, height:32, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon.Close width={15} height={15} style={{ color:'#fff' }}/>
        </button>
      </div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background: s.type === 'text' ? s.bgColor : '#000', padding:28 }}>
        {s.type === 'image' && s.fileUrl
          ? <img src={s.fileUrl} alt="" style={{ maxWidth:'100%', maxHeight:'80%', objectFit:'contain', borderRadius:12 }}/>
          : s.type === 'video' && s.fileUrl
          ? <video src={s.fileUrl} style={{ maxWidth:'100%', maxHeight:'80%' }} controls autoPlay/>
          : <p style={{ fontSize:22, fontWeight:700, color:'#fff', textAlign:'center' }}>{s.content}</p>
        }
      </div>
      <button style={{ position:'absolute', left:0, top:80, bottom:80, width:'40%', opacity:0, cursor:'pointer', border:'none', background:'none' }} onClick={() => { if(si>0)setSi(i=>i-1); else if(gi>0){setGi(i=>i-1);setSi(0)} }}/>
      <button style={{ position:'absolute', right:0, top:80, bottom:80, width:'40%', opacity:0, cursor:'pointer', border:'none', background:'none' }} onClick={() => { if(si<grp.statuses.length-1)setSi(i=>i+1); else if(gi<groups.length-1){setGi(i=>i+1);setSi(0)} else onClose() }}/>
    </div>
  )
}

function CallOverlay({ type, chat, user, isOnline, onEnd }) {
  const [elapsed, setElapsed] = useState(0)
  const tRef = useRef()
  const other = chat?.isGroup ? null : getOther(chat, user._id)
  const name = chat?.isGroup ? chat.name : other?.name || 'Unknown'

  useEffect(() => {
    setTimeout(() => {
      tRef.current = setInterval(() => setElapsed(e => e+1), 1000)
    }, 1500)
    return () => clearInterval(tRef.current)
  }, [])

  const dur = `${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(elapsed%60).padStart(2,'0')}`

  return (
    <div style={{ position:'absolute', inset:0, zIndex:50, display:'flex', flexDirection:'column', background: type==='video' ? 'linear-gradient(180deg,#070b1f,#040610)' : 'linear-gradient(180deg,#071a0f,#040c07)' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
        <div style={{ width:88, height:88, borderRadius:'50%', background:gradFor(name), display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, fontWeight:800, color:'#fff' }}>
          {initials(name)}
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:22, fontWeight:800, color:'#fff' }}>{name}</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,.45)', marginTop:6 }}>
            {elapsed > 0 ? `${type==='video'?'Video':'Voice'} Call · ${dur}` : 'Calling...'}
          </div>
        </div>
      </div>
      <div style={{ display:'flex', gap:22, justifyContent:'center', paddingBottom:44 }}>
        {[
          { icon:Icon.Mute, label:'Mute', fn:()=>{} },
          { icon:Icon.End, label:'End', fn:onEnd, bg:'#ef4444' },
          { icon:Icon.Speaker, label:'Speaker', fn:()=>{} },
        ].map(b => (
          <div key={b.label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            <button onClick={b.fn} style={{ width:58, height:58, borderRadius:'50%', background:b.bg||'rgba(255,255,255,.12)', display:'flex', alignItems:'center', justifyContent:'center', border:'none', cursor:'pointer' }}>
              <b.icon width={22} height={22} style={{ color:'#fff' }}/>
            </button>
            <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,.4)' }}>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CameraOverlay({ onCapture, onClose }) {
  return (
    <div style={{ position:'absolute', inset:0, zIndex:50, background:'#000', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'rgba(0,0,0,.8)', padding:'12px 14px', display:'flex', alignItems:'center', gap:12, borderBottom:'.5px solid rgba(255,255,255,.06)' }}>
        <button onClick={onClose} style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,.1)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon.Back width={17} height={17} style={{ color:'#fff' }}/>
        </button>
        <span style={{ fontSize:15, fontWeight:700, color:'#fff', flex:1 }}>Camera</span>
      </div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#080808' }}>
        <Icon.Camera width={64} height={64} style={{ color:'rgba(255,255,255,.15)' }}/>
      </div>
      <div style={{ background:'rgba(0,0,0,.9)', padding:'20px 30px', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <button onClick={onCapture} style={{ width:68, height:68, borderRadius:'50%', background:'#fff', border:'5px solid rgba(255,255,255,.28)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon.Camera width={22} height={22} style={{ color:'#111' }}/>
        </button>
      </div>
    </div>
  )
}

function StatusCompose({ user, api, socket, onClose }) {
  const [text, setText] = useState('')
  const [bg, setBg] = useState('linear-gradient(135deg,#16a34a,#22c55e)')
  const [media, setMedia] = useState(null)
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
    if (!text.trim() && !media) return
    setPosting(true)
    try {
      const { data } = await api.post('/status', { content: text, type: media ? media.type : 'text', bgColor: bg, fileUrl: media?.url || '' })
      socket?.emit('status:new', { ...data, user })
      onClose()
    } catch { setPosting(false) }
  }

  return (
    <div style={{ position:'absolute', inset:0, zIndex:40, display:'flex', flexDirection:'column', background:'var(--bg)' }}>
      <div style={{ background:'var(--s1)', padding:'12px 14px', display:'flex', alignItems:'center', gap:12, borderBottom:'.5px solid var(--border)' }}>
        <button onClick={onClose} style={{ width:34, height:34, borderRadius:9, background:'var(--s2)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon.Back width={16} height={16} style={{ color:'var(--text)' }}/>
        </button>
        <span style={{ fontSize:15, fontWeight:700, color:'var(--text)', flex:1 }}>New Status</span>
        <button onClick={post} disabled={posting || (!text.trim() && !media)}
          style={{ background:'rgba(34,197,94,.1)', color:'#22c55e', border:'none', borderRadius:8, padding:'7px 15px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', opacity: posting || (!text.trim()&&!media) ? .5 : 1 }}>
          {posting ? 'Posting...' : 'Post'}
        </button>
      </div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:bg, position:'relative', minHeight:200 }}>
        {media
          ? <img src={media.url} alt="" style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }}/>
          : <p style={{ fontSize:22, fontWeight:700, color:'#fff', textAlign:'center', padding:28 }}>{text || 'Write something...'}</p>
        }
      </div>
      <div style={{ display:'flex', gap:8, padding:'11px 14px', borderTop:'.5px solid var(--border)', overflowX:'auto' }}>
        {COLORS.map((c,i) => (
          <button key={i} onClick={() => setBg(c)}
            style={{ width:28, height:28, borderRadius:'50%', cursor:'pointer', flexShrink:0, border: bg===c ? '2px solid var(--text)' : '2px solid transparent', background:c }}/>
        ))}
      </div>
      <div style={{ padding:'9px 12px', display:'flex', alignItems:'center', gap:8, background:'var(--s1)', borderTop:'.5px solid var(--border)' }}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Write a status..."
          style={{ flex:1, background:'var(--inp)', border:'.5px solid var(--border)', borderRadius:22, padding:'10px 16px', fontSize:13.5, color:'var(--text)', outline:'none', fontFamily:'inherit' }}/>
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
  const isMobile = window.innerWidth <= 768

  useEffect(() => { api.get('/chats').then(({ data }) => setChats(data)) }, [])

  useEffect(() => {
    if (tab === 'contacts' || overlay === 'addmem')
      api.get('/users/all').then(({ data }) => setAllUsers(data))
    if (tab === 'status')
      api.get('/status').then(({ data }) => setStatuses(data))
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
      // Notification
      if (active?._id !== msg.chat && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(msg.sender?.name || 'New Message', { body: msg.content || '📎 Media', icon: '/favicon.ico' })
      }
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

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const openChat = (chat) => {
    setActive(chat); setRemoteType(false); setReplyTo(null)
    if (isMobile) setShowSidebar(false)
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
    setMessages(p => p.map(m => m._id === msg._id ? { ...m, isDeleted: true, content: 'This message was deleted' } : m))
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

  const ChatList = () => (
    <>
      {chats.length === 0
        ? <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--muted)' }}>
            <Icon.Chat width={40} height={40} style={{ margin:'0 auto 12px', color:'var(--muted2)' }}/>
            <p style={{ fontSize:14, fontWeight:600 }}>No chats yet</p>
            <p style={{ fontSize:12, marginTop:4 }}>Search for users to start chatting</p>
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
              else if (last.type === 'document') lastTxt = `📄 ${last.fileName||'Document'}`
              else if (last.type === 'audio' || last.type === 'voice') lastTxt = '🎵 Audio'
              else if (last.type === 'location') lastTxt = '📍 Location'
              else lastTxt = last.content?.slice(0,38) + (last.content?.length > 38 ? '…' : '')
            }
            return (
              <div key={chat._id} onClick={() => openChat(chat)}
                style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 14px', cursor:'pointer', borderBottom:'.5px solid var(--border)', background: active?._id === chat._id ? 'var(--hover)' : 'transparent', position:'relative' }}>
                {active?._id === chat._id && <div style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:2.5, background:'#22c55e', borderRadius:'0 2px 2px 0' }}/>}
                <Av name={name} src={chat.isGroup ? chat.groupAvatar : o?.avatar} online={!chat.isGroup ? isOnline(o?._id) : undefined}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                    <span style={{ fontSize:14, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:160 }}>{name}</span>
                    <span style={{ fontSize:11, color:'var(--muted)', fontWeight:500, flexShrink:0 }}>{fmt(last?.createdAt || chat.updatedAt)}</span>
                  </div>
                  <p style={{ fontSize:12, color:'var(--muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{lastTxt}</p>
                </div>
              </div>
            )
          })
      }
    </>
  )

  const StatusList = () => (
    <>
      <div onClick={() => setOverlay('sc')}
        style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', cursor:'pointer', borderBottom:'.5px solid var(--border)' }}>
        <div style={{ position:'relative', flexShrink:0 }}>
          <div style={{ width:48, height:48, borderRadius:'50%', border:'2px dashed var(--muted2)', padding:1 }}>
            <Av name={user.name} src={user.avatar} size={42}/>
          </div>
          <div style={{ position:'absolute', bottom:0, right:0, width:17, height:17, background:'#22c55e', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid var(--s1)' }}>
            <Icon.Plus width={9} height={9} style={{ color:'#fff' }}/>
          </div>
        </div>
        <div><div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>My Status</div><div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>Tap to add update</div></div>
      </div>
      {statuses.length > 0 && statuses.map((g, gi) => (
        <div key={gi} onClick={() => { setStatusView(gi); setOverlay('sv') }}
          style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', cursor:'pointer', borderBottom:'.5px solid var(--border)' }}>
          <div style={{ width:48, height:48, borderRadius:'50%', padding:2.5, background:'conic-gradient(#22c55e,#10b981,#22c55e)', flexShrink:0 }}>
            <Av name={g.user.name} src={g.user.avatar} size={43} style={{ border:'2.5px solid var(--s1)' }}/>
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{g.user._id === user._id ? 'My Status' : g.user.name}</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{g.statuses.length} update{g.statuses.length > 1 ? 's' : ''}</div>
          </div>
        </div>
      ))}
    </>
  )

  const CallsList = () => (
    <>
      {chats.filter(c => !c.isGroup).slice(0,5).map(chat => {
        const o = getOther(chat, user._id)
        return (
          <div key={chat._id} style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 14px', borderBottom:'.5px solid var(--border)' }}>
            <Av name={o.name} src={o.avatar} online={isOnline(o._id)}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{o.name}</div>
              <div style={{ fontSize:12, color:'#22c55e', marginTop:3 }}>📞 Incoming · Today</div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={() => setOverlay('voice')} style={{ width:34, height:34, borderRadius:'50%', background:'var(--s2)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon.Call width={15} height={15} style={{ color:'#22c55e' }}/>
              </button>
            </div>
          </div>
        )
      })}
    </>
  )

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:'var(--ff)', background:'var(--bg)' }}>
      <style>{`
        .msg-menu-btn{opacity:0}
        .mr:hover .msg-menu-btn{opacity:1!important}
        @media(max-width:768px){
          .sidebar{ position:absolute!important; left:0; top:0; bottom:0; z-index:30; width:100%!important; }
          .main-chat{ width:100%!important; }
        }
      `}</style>

      {/* SIDEBAR */}
      {(showSidebar || !isMobile) && (
        <div className="sidebar" style={{ width:340, background:'var(--s1)', display:'flex', flexDirection:'column', borderRight:'.5px solid var(--border)', flexShrink:0 }}>

          {/* Topbar */}
          <div style={{ padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'.5px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <div style={{ width:33, height:33, borderRadius:10, background:'linear-gradient(135deg,#16a34a,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon.Chat width={17} height={17} style={{ color:'#fff' }}/>
              </div>
              <span style={{ fontSize:16, fontWeight:800, letterSpacing:'-.5px', color:'var(--text)' }}>
                Chit<span style={{ color:'#22c55e' }}>Chat</span>
              </span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:2 }}>
              <button onClick={toggle} style={{ width:34, height:34, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'none', background:'none', color:'var(--muted)' }}>
                {isDark ? <Icon.Sun width={16} height={16}/> : <Icon.Moon width={16} height={16}/>}
              </button>
              <IBtn icon={Icon.Edit} onClick={() => setOverlay('addmem')} title="New Chat"/>
              <IBtn icon={Icon.More} onClick={() => logout()} title="Logout"/>
            </div>
          </div>

          {/* Profile Row - TOP */}
          <button onClick={() => { setOverlay('profile'); setProfEdit(false); setProfForm({ name:user.name, about:user.about||'', phone:user.phone?.replace('+91','')||'' }) }}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom:'.5px solid var(--border)', background:'none', border:'none', cursor:'pointer', textAlign:'left', width:'100%' }}
            onMouseEnter={e => e.currentTarget.style.background='var(--hover)'} onMouseLeave={e => e.currentTarget.style.background='none'}>
            <Av name={user.name} src={user.avatar} online={true} size={38}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:1 }}>{user.phone || 'Tap to edit profile'}</div>
            </div>
            <Icon.Edit width={13} height={13} style={{ color:'var(--muted2)', flexShrink:0 }}/>
          </button>

          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'.5px solid var(--border)' }}>
            {['chats','status','calls'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex:1, padding:'11px 0', fontSize:11, fontWeight:700, color: tab===t ? '#22c55e' : 'var(--muted)', cursor:'pointer', border:'none', background:'none', fontFamily:'var(--ff)', textTransform:'uppercase', letterSpacing:'.5px', position:'relative' }}>
                {t}
                {tab === t && <span style={{ position:'absolute', bottom:0, left:'25%', right:'25%', height:2, background:'#22c55e', borderRadius:'2px 2px 0 0' }}/>}
              </button>
            ))}
          </div>

          {/* Search */}
          {tab === 'chats' && (
            <div style={{ padding:'8px 12px', borderBottom:'.5px solid var(--border)' }}>
              <div style={{ background:'var(--s2)', borderRadius:10, display:'flex', alignItems:'center', gap:8, padding:'8px 12px', border:'.5px solid var(--border)' }}>
                <Icon.Search width={14} height={14} style={{ color:'var(--muted2)', flexShrink:0 }}/>
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search or start new chat"
                  style={{ background:'none', border:'none', outline:'none', fontSize:13, color:'var(--text)', flex:1, fontFamily:'var(--ff)' }}/>
                {searchQ && <button onClick={() => { setSearchQ(''); setSearchRes([]) }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:16 }}>✕</button>}
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div style={{ flex:1, overflowY:'auto' }}>
            {tab === 'chats' && searchQ
              ? searchRes.map(u => (
                  <div key={u._id} onClick={() => startDM(u._id)}
                    style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 14px', cursor:'pointer', borderBottom:'.5px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--hover)'} onMouseLeave={e => e.currentTarget.style.background='none'}>
                    <Av name={u.name} src={u.avatar} online={isOnline(u._id)}/>
                    <div><div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{u.name}</div><div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{u.phone||u.email}</div></div>
                  </div>
                ))
              : tab === 'chats' ? <ChatList/>
              : tab === 'status' ? <StatusList/>
              : <CallsList/>
            }
          </div>
        </div>
      )}

      {/* MAIN CHAT */}
      {(!showSidebar || !isMobile) && (
        <div className="main-chat" style={{ flex:1, display:'flex', flexDirection:'column', background:'var(--bg)', position:'relative', overflow:'hidden' }}>

          <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle, var(--s3) 1px, transparent 1px)', backgroundSize:'24px 24px', opacity:.3, pointerEvents:'none' }}/>

          {active ? (
            <>
              {/* Chat Header */}
              <div style={{ background:'var(--s1)', padding:'10px 14px', display:'flex', alignItems:'center', gap:11, borderBottom:'.5px solid var(--border)', zIndex:2 }}>
                {isMobile && (
                  <button onClick={() => setShowSidebar(true)} style={{ width:34, height:34, borderRadius:9, background:'var(--s2)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon.Back width={16} height={16} style={{ color:'var(--text)' }}/>
                  </button>
                )}
                <Av name={chatName} src={active.isGroup ? active.groupAvatar : other?.avatar} online={!active.isGroup ? isOnline(other?._id) : undefined}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{chatName}</div>
                  <div style={{ fontSize:12, marginTop:1, fontWeight:500, color: remoteType ? '#22c55e' : 'var(--muted)' }}>
                    {remoteType ? 'typing...' : active.isGroup ? `${active.members?.length} members` : isOnline(other?._id) ? 'online' : other?.phone || ''}
                  </div>
                </div>
                <div style={{ display:'flex', gap:1 }}>
                  <IBtn icon={Icon.Video} onClick={() => setOverlay('video')} title="Video call"/>
                  <IBtn icon={Icon.Call} onClick={() => setOverlay('voice')} title="Voice call"/>
                  <IBtn icon={Icon.Search} title="Search"/>
                  <IBtn icon={Icon.More} title="More"/>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:1, position:'relative', zIndex:1 }}>
                {loadMsg
                  ? <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
                      <div style={{ width:24, height:24, border:'2px solid rgba(34,197,94,.2)', borderTopColor:'#22c55e', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
                    </div>
                  : messages.length === 0
                  ? <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, opacity:.6 }}>
                      <Icon.Lock width={22} height={22} style={{ color:'var(--muted)' }}/>
                      <p style={{ fontSize:13, color:'var(--muted)', fontWeight:500 }}>Messages are end-to-end encrypted</p>
                    </div>
                  : messages.map((msg, i) => {
                      const isMine = msg.sender?._id === user._id
                      const prev = messages[i-1]
                      const showName = active.isGroup && !isMine && prev?.sender?._id !== msg.sender?._id
                      return <Bubble key={msg._id} msg={msg} isMine={isMine} showName={showName} onReply={setReplyTo} onDelete={deleteMsg}/>
                    })
                }
                {remoteType && (
                  <div style={{ display:'flex', alignItems:'flex-end', gap:6 }}>
                    <div style={{ width:26, height:26, borderRadius:'50%', background:activeGrad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'#fff', marginBottom:4 }}>
                      {initials(chatName)}
                    </div>
                    <div style={{ background:'var(--in)', border:'.5px solid var(--in-border)', borderRadius:'0 14px 14px 14px', padding:'10px 14px' }}>
                      <div style={{ display:'flex', gap:3, alignItems:'center', height:16 }}>
                        {[0,150,300].map(d => <div key={d} style={{ width:6, height:6, borderRadius:'50%', background:'var(--muted)', animation:`ww 1.2s ease-in-out ${d}ms infinite` }}/>)}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef}/>
              </div>

              {/* Reply bar */}
              {replyTo && (
                <div style={{ background:'var(--s1)', borderTop:'.5px solid var(--border)', padding:'8px 14px', display:'flex', alignItems:'center', gap:10, zIndex:2 }}>
                  <div style={{ flex:1, borderLeft:'3px solid #22c55e', paddingLeft:10 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#22c55e' }}>{replyTo.sender?.name || 'You'}</div>
                    <div style={{ fontSize:12, color:'var(--muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:260 }}>{replyTo.content || '📎 Media'}</div>
                  </div>
                  <button onClick={() => setReplyTo(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:18 }}>✕</button>
                </div>
              )}

              {/* Input */}
              <div style={{ background:'var(--s1)', padding:'9px 12px', display:'flex', alignItems:'flex-end', gap:7, borderTop:'.5px solid var(--border)', position:'relative', zIndex:2 }}>
                <button onClick={() => setAttach(a => !a)}
                  style={{ width:42, height:42, borderRadius:'50%', background:'var(--s2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'none', color:'var(--muted)', flexShrink:0 }}>
                  <Icon.Attach width={17} height={17}/>
                </button>
                <div style={{ flex:1, background:'var(--inp)', borderRadius:22, display:'flex', alignItems:'center', gap:8, padding:'9px 14px', border:'.5px solid var(--border)' }}>
                  <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', display:'flex', alignItems:'center', padding:0, flexShrink:0 }}>
                    <Icon.Emoji width={18} height={18}/>
                  </button>
                  <input value={text} onChange={handleTyping}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMsg())}
                    placeholder="Message..."
                    style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:13.5, color:'var(--text)', fontFamily:'var(--ff)' }}/>
                  <button onClick={() => setOverlay('camera')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', display:'flex', alignItems:'center', padding:0, flexShrink:0 }}>
                    <Icon.Camera width={17} height={17}/>
                  </button>
                  <button onClick={() => sendMsg({ type:'voice', content:'', duration:`0:${Math.floor(Math.random()*50+5).toString().padStart(2,'0')}` })}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', display:'flex', alignItems:'center', padding:0, flexShrink:0 }}>
                    <Icon.Mic width={16} height={16}/>
                  </button>
                </div>
                <button onClick={() => sendMsg()}
                  style={{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(135deg,#16a34a,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'none', flexShrink:0, boxShadow:'0 4px 14px rgba(34,197,94,.25)' }}>
                  <Icon.Send width={17} height={17} style={{ color:'#fff', marginLeft:1 }}/>
                </button>
                {attach && <AttachMenu onSend={(p) => sendMsg(p)} onClose={() => setAttach(false)}/>}
              </div>

              {(overlay === 'voice' || overlay === 'video') && (
                <CallOverlay type={overlay} chat={active} user={user} isOnline={isOnline} onEnd={() => setOverlay(null)}/>
              )}
              {overlay === 'camera' && (
                <CameraOverlay onCapture={() => { sendMsg({ type:'image', content:'' }); setOverlay(null) }} onClose={() => setOverlay(null)}/>
              )}
            </>
          ) : (
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, padding:24, position:'relative', zIndex:1 }}>
              <div style={{ width:72, height:72, borderRadius:20, background:'linear-gradient(135deg,#16a34a,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 12px 32px rgba(34,197,94,.25)' }}>
                <Icon.Chat width={34} height={34} style={{ color:'#fff' }}/>
              </div>
              <div style={{ fontSize:26, fontWeight:800, letterSpacing:'-.6px', color:'var(--text)' }}>
                Chit<span style={{ color:'#22c55e' }}>Chat</span>
              </div>
              <p style={{ fontSize:14, color:'var(--muted)', textAlign:'center', maxWidth:260, lineHeight:1.6 }}>
                Select a conversation or search for a user to start chatting.
              </p>
            </div>
          )}

          {/* ADD MEMBER OVERLAY */}
          {overlay === 'addmem' && (
            <div style={{ position:'absolute', inset:0, zIndex:40, background:'var(--bg)', display:'flex', flexDirection:'column' }}>
              <div style={{ background:'var(--s1)', padding:'12px 14px', display:'flex', alignItems:'center', gap:12, borderBottom:'.5px solid var(--border)' }}>
                <button onClick={() => setOverlay(null)} style={{ width:34, height:34, borderRadius:9, background:'var(--s2)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon.Back width={16} height={16} style={{ color:'var(--text)' }}/>
                </button>
                <span style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>New Chat</span>
              </div>
              <div style={{ padding:'13px 14px', borderBottom:'.5px solid var(--border)' }}>
                <div style={{ fontSize:12, color:'var(--muted)', marginBottom:10, fontWeight:500 }}>Find by mobile number:</div>
                <div style={{ display:'flex', gap:8 }}>
                  <div style={{ flex:1, background:'var(--s2)', border:'.5px solid var(--border)', borderRadius:11, display:'flex', alignItems:'center', gap:8, padding:'10px 12px' }}>
                    <Icon.Call width={13} height={13} style={{ color:'var(--muted)', flexShrink:0 }}/>
                    <span style={{ fontSize:13, color:'var(--muted)', fontWeight:700 }}>+91</span>
                    <div style={{ width:1, height:15, background:'var(--border)' }}/>
                    <input value={addPhone} onChange={e => setAddPhone(e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="Enter mobile number" inputMode="numeric"
                      style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:14, color:'var(--text)', fontFamily:'var(--ff)' }}/>
                  </div>
                  <button onClick={findUser}
                    style={{ background:'#22c55e', color:'#fff', border:'none', borderRadius:10, padding:'0 16px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'var(--ff)' }}>
                    Find
                  </button>
                </div>
                {foundUser && (
                  <div style={{ marginTop:10, background:'rgba(34,197,94,.06)', border:'.5px solid rgba(34,197,94,.2)', borderRadius:12, padding:11, display:'flex', alignItems:'center', gap:10 }}>
                    <Av name={foundUser.name} src={foundUser.avatar} size={40}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{foundUser.name}</div>
                      <div style={{ fontSize:12, color:'#22c55e', marginTop:2 }}>{foundUser.phone}</div>
                    </div>
                    <button onClick={() => { startDM(foundUser._id); setFoundUser(null); setAddPhone('') }}
                      style={{ background:'#22c55e', color:'#fff', border:'none', borderRadius:9, padding:'7px 14px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'var(--ff)' }}>
                      Chat
                    </button>
                  </div>
                )}
              </div>
              <div style={{ flex:1, overflowY:'auto' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--muted2)', padding:'8px 14px 4px', textTransform:'uppercase', letterSpacing:'.7px' }}>All Contacts</div>
                {allUsers.map(u => (
                  <div key={u._id} onClick={() => startDM(u._id)}
                    style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 14px', cursor:'pointer', borderBottom:'.5px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--hover)'} onMouseLeave={e => e.currentTarget.style.background='none'}>
                    <Av name={u.name} src={u.avatar} online={isOnline(u._id)}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{u.name}</div>
                      <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{u.phone || u.email}</div>
                    </div>
                    {isOnline(u._id) && <span style={{ fontSize:11, fontWeight:700, color:'#22c55e' }}>Online</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {overlay === 'sc' && <StatusCompose user={user} api={api} socket={socket} onClose={() => setOverlay(null)}/>}
          {overlay === 'sv' && statuses[statusView] && <StatusViewer groups={statuses} user={user} onClose={() => setOverlay(null)}/>}

          {/* PROFILE OVERLAY */}
          {overlay === 'profile' && (
            <div style={{ position:'absolute', inset:0, zIndex:40, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
              <div style={{ background:'var(--card)', borderRadius:20, width:'100%', maxWidth:380, overflow:'hidden', boxShadow:'var(--shadow)' }}>
                <div style={{ background:'linear-gradient(135deg,#16a34a,#22c55e)', padding:'28px 24px 20px', textAlign:'center', position:'relative' }}>
                  <button onClick={() => setOverlay(null)} style={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,.2)', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon.Close width={15} height={15} style={{ color:'#fff' }}/>
                  </button>
                  <Av name={user.name} src={user.avatar} size={68} style={{ margin:'0 auto 12px' }}/>
                  <div style={{ fontSize:18, fontWeight:800, color:'#fff' }}>{user.name}</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,.7)', marginTop:4 }}>{user.phone || user.email}</div>
                </div>
                <div style={{ padding:'20px 22px' }}>
                  {!profEdit ? (
                    <>
                      <div style={{ background:'var(--s2)', borderRadius:12, padding:14, marginBottom:14 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:'#22c55e', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:5 }}>About</div>
                        <div style={{ fontSize:14, color:'var(--text)' }}>{user.about || 'Hey there! I am using ChitChat 👋'}</div>
                      </div>
                      <button onClick={() => setProfEdit(true)}
                        style={{ width:'100%', padding:13, background:'linear-gradient(135deg,#16a34a,#22c55e)', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--ff)' }}>
                        Edit Profile
                      </button>
                    </>
                  ) : (
                    <>
                      {[{k:'name',l:'Name',p:'Your name'},{k:'about',l:'About',p:'Hey there!'},{k:'phone',l:'Phone',p:'9876543210'}].map(f => (
                        <div key={f.k} style={{ marginBottom:14 }}>
                          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--muted2)', textTransform:'uppercase', letterSpacing:'.7px', marginBottom:6 }}>{f.l}</label>
                          <input value={profForm[f.k]} onChange={e => setProfForm(p => ({...p,[f.k]:e.target.value}))} placeholder={f.p}
                            style={{ width:'100%', border:'.5px solid var(--border)', borderRadius:10, background:'var(--inp)', padding:'11px 13px', fontSize:14, color:'var(--text)', outline:'none', fontFamily:'var(--ff)' }}/>
                        </div>
                      ))}
                      <div style={{ display:'flex', gap:10 }}>
                        <button onClick={() => setProfEdit(false)}
                          style={{ flex:1, padding:12, background:'var(--s2)', color:'var(--muted)', border:'none', borderRadius:11, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--ff)' }}>
                          Cancel
                        </button>
                        <button onClick={saveProfile}
                          style={{ flex:1, padding:12, background:'linear-gradient(135deg,#16a34a,#22c55e)', color:'#fff', border:'none', borderRadius:11, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--ff)' }}>
                          Save
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}