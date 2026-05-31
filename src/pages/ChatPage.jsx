import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useTheme } from '../context/ThemeContext'
import { Icon, IBtn } from '../components/Icons'

const fmt = (d) => {
  if (!d) return ''
  const dt = new Date(d), now = new Date(), diff = now - dt
  if (diff < 60000)    return 'just now'
  if (diff < 3600000)  return `${Math.floor(diff/60000)}m`
  if (diff < 86400000) return dt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
  return dt.toLocaleDateString([],{day:'numeric',month:'short'})
}
const timeOnly = (d) => d ? new Date(d).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : ''
const getOther = (chat, uid) => chat.members?.find(m => (m._id||m) !== uid) || {}
const ini = (n='') => n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?'
const GRADS = ['linear-gradient(135deg,#6d1b7b,#e91e8c)','linear-gradient(135deg,#1a6b3c,#22c55e)','linear-gradient(135deg,#1565c0,#42a5f5)','linear-gradient(135deg,#0f5132,#20c997)','linear-gradient(135deg,#7c3f00,#ff9800)','linear-gradient(135deg,#1a1a3a,#818cf8)']
const gradFor = (n='') => GRADS[n.charCodeAt(0)%GRADS.length]

function Av({ name='?', src, size=44, online, style={}, onClick }) {
  return (
    <div style={{ position:'relative', flexShrink:0, cursor:onClick?'pointer':'default', ...style }} onClick={onClick}>
      {src
        ? <img src={src} alt={name} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', display:'block' }}/>
        : <div style={{ width:size, height:size, borderRadius:'50%', background:gradFor(name), display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.3, fontWeight:800, color:'#fff' }}>{ini(name)}</div>
      }
      {online !== undefined && (
        <span style={{ position:'absolute', bottom:1, right:1, width:size*0.26, height:size*0.26, borderRadius:'50%', background:online?'#22c55e':'var(--s3)', border:'2.5px solid var(--s1)' }}/>
      )}
    </div>
  )
}

function Bubble({ msg, isMine, showName, onReply, onDelete }) {
  const [menu, setMenu] = useState(false)
  const isDeleted = msg.isDeleted
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, marginBottom:2, flexDirection:isMine?'row-reverse':'row' }}
      onMouseLeave={()=>setMenu(false)}>
      {!isMine && (showName
        ? <div style={{ width:24, height:24, borderRadius:'50%', background:gradFor(msg.sender?.name||'?'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'#fff', flexShrink:0, marginBottom:4 }}>{ini(msg.sender?.name)}</div>
        : <div style={{ width:24, flexShrink:0 }}/>
      )}
      <div style={{ display:'flex', flexDirection:'column', alignItems:isMine?'flex-end':'flex-start', maxWidth:'72%' }}>
        {showName && !isMine && !isDeleted && <span style={{ fontSize:11, fontWeight:700, color:'#22c55e', marginBottom:2, marginLeft:2 }}>{msg.sender?.name}</span>}
        {msg.replyTo && !isDeleted && (
          <div style={{ borderLeft:'3px solid #22c55e', paddingLeft:8, marginBottom:3, background:'rgba(34,197,94,.06)', borderRadius:'0 6px 6px 0', padding:'4px 8px', maxWidth:'100%' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#22c55e' }}>{msg.replyTo.sender?.name||'Message'}</div>
            <div style={{ fontSize:11, color:'var(--muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:160 }}>{msg.replyTo.content||'📎 Media'}</div>
          </div>
        )}
        <div style={{ padding: msg.type==='text'||isDeleted ? '8px 12px' : '4px', borderRadius:14, background:isMine?'var(--out)':'var(--in)', borderRadius:isMine?'14px 14px 0 14px':'0 14px 14px 14px', border:isMine?'.5px solid var(--out-b)':'.5px solid var(--in-b)', maxWidth:'100%' }}>
          {isDeleted
            ? <p style={{ fontSize:13, fontStyle:'italic', color:'var(--muted)' }}>🚫 Deleted</p>
            : msg.type==='text'
            ? <p style={{ fontSize:13.5, lineHeight:1.55, color:'var(--text)', wordBreak:'break-word' }}>{msg.content}</p>
            : msg.type==='image'
            ? <div style={{ width:'min(200px,60vw)', borderRadius:10, overflow:'hidden' }}>
                {msg.fileUrl ? <img src={msg.fileUrl} alt="" style={{ width:'100%', maxHeight:180, objectFit:'cover', display:'block' }}/> : <div style={{ height:130, background:'var(--s3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>🖼️</div>}
              </div>
            : msg.type==='document'
            ? <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:'min(190px,50vw)', background:'var(--s2)', borderRadius:10, padding:10, border:'.5px solid var(--border)' }}>
                <div style={{ width:36, height:36, borderRadius:9, background:'rgba(34,197,94,.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>📄</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'var(--text)' }}>{msg.fileName||'Document'}</div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{msg.fileSize||''}</div>
                </div>
              </div>
            : (msg.type==='voice'||msg.type==='audio')
            ? <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:'min(180px,50vw)', cursor:'pointer' }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:'#22c55e', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:13, color:'#fff' }}>▶</div>
                <div style={{ flex:1, display:'flex', alignItems:'center', gap:2, height:24 }}>
                  {Array.from({length:12},(_,i)=><div key={i} style={{ width:2.5, borderRadius:2, background:'#22c55e', height:Math.random()*16+3, animation:`ww 1.2s ease-in-out ${i*.1}s infinite` }}/>)}
                </div>
                <span style={{ fontSize:10, color:'var(--muted)', fontWeight:500 }}>{msg.duration||'0:00'}</span>
              </div>
            : msg.type==='location'
            ? <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:18 }}>📍</span>
                <div><div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Location</div><div style={{ fontSize:11, color:'var(--muted)' }}>{msg.content||'Tap to view'}</div></div>
              </div>
            : <p style={{ fontSize:13.5, color:'var(--text)' }}>{msg.content}</p>
          }
          <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4, marginTop:msg.type==='text'||isDeleted?4:2, padding:msg.type!=='text'&&!isDeleted?'2px 6px':0 }}>
            <span style={{ fontSize:10, color:'var(--muted)', fontWeight:500 }}>{timeOnly(msg.createdAt)}</span>
            {isMine && !isDeleted && (msg.readBy?.length>1 ? <span style={{ fontSize:11, color:'var(--blue)' }}>✓✓</span> : <span style={{ fontSize:11, color:'var(--muted)' }}>✓</span>)}
          </div>
        </div>
      </div>
      <div style={{ position:'relative', flexShrink:0 }}>
        <button onClick={()=>setMenu(m=>!m)} style={{ opacity:0, width:22, height:22, borderRadius:6, background:'none', border:'none', cursor:'pointer', color:'var(--muted)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }} className="mbtn">▾</button>
        {menu && (
          <div style={{ position:'absolute', [isMine?'right':'left']:0, top:'100%', background:'var(--s1)', border:'.5px solid var(--border)', borderRadius:12, overflow:'hidden', boxShadow:'var(--shadow)', zIndex:20, minWidth:130 }}>
            <div style={{ display:'flex', gap:2, padding:'6px 8px', borderBottom:'.5px solid var(--border)' }}>
              {['😀','❤️','😂','👍','😮','😢'].map(e=>(
                <button key={e} style={{ fontSize:16, background:'none', border:'none', cursor:'pointer', borderRadius:6, padding:2 }}>{e}</button>
              ))}
            </div>
            <button onClick={()=>{onReply(msg);setMenu(false)}} style={{ width:'100%', padding:'9px 13px', fontSize:13, color:'var(--text)', background:'none', border:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit', fontWeight:500 }}>↩ Reply</button>
            {isMine && <button onClick={()=>{onDelete(msg);setMenu(false)}} style={{ width:'100%', padding:'9px 13px', fontSize:13, color:'#ef4444', background:'none', border:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit', fontWeight:500 }}>🗑 Delete</button>}
          </div>
        )}
      </div>
    </div>
  )
}

function AttachMenu({ onSend, onClose }) {
  const fRef = useRef()
  const opts = [
    { e:'📷', l:'Photo',    a:'image/*',                    t:'image',    c:'#60a5fa' },
    { e:'🎬', l:'Video',    a:'video/*',                    t:'video',    c:'#a855f7' },
    { e:'📄', l:'Document', a:'.pdf,.doc,.docx,.txt,.xlsx', t:'document', c:'#22c55e' },
    { e:'🎵', l:'Audio',    a:'audio/*',                    t:'audio',    c:'#ef4444' },
    { e:'📍', l:'Location', a:null,                         t:'location', c:'#60a5fa' },
    { e:'👤', l:'Contact',  a:null,                         t:'contact',  c:'#fbbf24' },
  ]
  return (
    <div style={{ position:'absolute', bottom:60, left:10, background:'var(--s1)', border:'.5px solid var(--border)', borderRadius:16, padding:8, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:2, boxShadow:'var(--shadow)', zIndex:20 }}>
      {opts.map(o=>(
        <button key={o.l} onClick={()=>{
          if (o.t==='location') { onSend({type:'location',content:'New Delhi, India'}); onClose(); return }
          if (o.t==='contact')  { onSend({type:'text',content:'👤 Contact\n+91 98765 43210'}); onClose(); return }
          fRef.current._t=o.t; fRef.current.accept=o.a; fRef.current.click(); onClose()
        }} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'10px 8px', borderRadius:12, cursor:'pointer', border:'none', background:'none', fontFamily:'inherit' }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:`rgba(0,0,0,.08)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{o.e}</div>
          <span style={{ fontSize:11, color:'var(--muted)', fontWeight:600 }}>{o.l}</span>
        </button>
      ))}
      <input ref={fRef} type="file" style={{ display:'none' }} onChange={e=>{
        const f=e.target.files[0]; if(!f) return
        onSend({ type:fRef.current._t, fileUrl:URL.createObjectURL(f), fileName:f.name, fileSize:`${Math.round(f.size/1024)} KB`, content:'' })
        e.target.value=''
      }}/>
    </div>
  )
}

export default function ChatPage() {
  const { user, api, logout, updateUser } = useAuth()
  const { socket, isOnline }              = useSocket()
  const { theme, toggle }                 = useTheme()

  const [chats,      setChats]      = useState([])
  const [active,     setActive]     = useState(null)
  const [messages,   setMessages]   = useState([])
  const [text,       setText]       = useState('')
  const [tab,        setTab]        = useState('chats')
  const [searchQ,    setSearchQ]    = useState('')
  const [searchRes,  setSearchRes]  = useState([])
  const [allUsers,   setAllUsers]   = useState([])
  const [statuses,   setStatuses]   = useState([])
  const [remoteType, setRemoteType] = useState(false)
  const [loadMsg,    setLoadMsg]    = useState(false)
  const [attach,     setAttach]     = useState(false)
  const [replyTo,    setReplyTo]    = useState(null)
  const [overlay,    setOverlay]    = useState(null)
  const [profEdit,   setProfEdit]   = useState(false)
  const [profForm,   setProfForm]   = useState({name:'',about:'',phone:''})
  const [addPhone,   setAddPhone]   = useState('')
  const [foundUser,  setFoundUser]  = useState(null)
  const [groupForm,  setGroupForm]  = useState({name:'',selected:[]})
  const [statusBg,   setStatusBg]   = useState('linear-gradient(135deg,#16a34a,#22c55e)')
  const [statusTxt,  setStatusTxt]  = useState('')
  const [statusMedia,setStatusMedia]= useState(null)
  // Mobile: show sidebar or chat
  const [showSidebar,setShowSidebar]= useState(true)

  const bottomRef = useRef()
  const typingRef = useRef()
  const isDark    = theme === 'dark'

  useEffect(()=>{ api.get('/chats').then(({data})=>setChats(data)) },[])

  useEffect(()=>{
    if (tab==='status') api.get('/status').then(({data})=>setStatuses(data))
    if (overlay==='addmem') api.get('/users/all').then(({data})=>setAllUsers(data))
  },[tab, overlay])

  useEffect(()=>{
    if (!searchQ.trim()) return setSearchRes([])
    const t = setTimeout(()=>api.get(`/users/search?q=${searchQ}`).then(({data})=>setSearchRes(data)),400)
    return ()=>clearTimeout(t)
  },[searchQ])

  useEffect(()=>{
    if (!socket) return
    const onMsg = (msg) => {
      if (active?._id===msg.chat) setMessages(p=>[...p,msg])
      setChats(p=>p.map(c=>c._id===msg.chat?{...c,lastMessage:msg,updatedAt:new Date()}:c).sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)))
    }
    socket.on('message:receive', onMsg)
    socket.on('typing:start', ({chatId})=>{ if(active?._id===chatId) setRemoteType(true) })
    socket.on('typing:stop',  ({chatId})=>{ if(active?._id===chatId) setRemoteType(false) })
    socket.on('status:new', s=>setStatuses(p=>{
      const uid=s.user?._id; const ex=p.find(g=>g.user._id===uid)
      if(ex) return p.map(g=>g.user._id===uid?{...g,statuses:[...g.statuses,s]}:g)
      return [{user:s.user,statuses:[s]},...p]
    }))
    return ()=>{ socket.off('message:receive',onMsg); socket.off('typing:start'); socket.off('typing:stop') }
  },[socket,active])

  useEffect(()=>{
    if (!active||!socket) return
    socket.emit('chat:join', active._id)
    setLoadMsg(true)
    api.get(`/messages/${active._id}`).then(({data})=>setMessages(data)).finally(()=>setLoadMsg(false))
    return ()=>socket.emit('chat:leave', active._id)
  },[active])

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages,remoteType])

  const openChat = (chat) => {
    setActive(chat); setRemoteType(false); setReplyTo(null)
    setShowSidebar(false) // mobile: hide sidebar, show chat
  }

  const startDM = async (uid) => {
    const {data} = await api.post('/chats',{userId:uid})
    setChats(p=>p.find(c=>c._id===data._id)?p:[data,...p])
    openChat(data); setOverlay(null); setSearchQ(''); setSearchRes([])
  }

  const sendMsg = async (override) => {
    const payload = override || {type:'text', content:text.trim()}
    if (payload.type==='text' && !payload.content) return
    if (!active) return
    if (!override) setText('')
    setReplyTo(null); setAttach(false)
    try {
      const {data:msg} = await api.post('/messages',{
        chatId:active._id, ...payload,
        ...(replyTo&&!override?{replyTo:replyTo._id}:{})
      })
      setMessages(p=>[...p,msg])
      socket?.emit('message:send', msg)
      setChats(p=>p.map(c=>c._id===active._id?{...c,lastMessage:msg,updatedAt:new Date()}:c).sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)))
    } catch {}
  }

  const handleTyping = (e) => {
    setText(e.target.value)
    if (!socket||!active) return
    socket.emit('typing:start',{chatId:active._id,user})
    clearTimeout(typingRef.current)
    typingRef.current = setTimeout(()=>socket.emit('typing:stop',{chatId:active._id,userId:user._id}),1500)
  }

  const deleteMsg = async (msg) => {
    await api.delete(`/messages/${msg._id}`,{data:{forEveryone:true}})
    setMessages(p=>p.map(m=>m._id===msg._id?{...m,isDeleted:true,content:'This message was deleted'}:m))
  }

  const createGroup = async () => {
    if (!groupForm.name||groupForm.selected.length<2) return
    const {data} = await api.post('/chats/group',{name:groupForm.name,members:groupForm.selected.map(u=>u._id)})
    setChats(p=>[data,...p]); openChat(data); setGroupForm({name:'',selected:[]}); setOverlay(null)
  }

  const postStatus = async () => {
    if (!statusTxt.trim()&&!statusMedia) return
    const {data} = await api.post('/status',{content:statusTxt,type:statusMedia?statusMedia.type:'text',bgColor:statusBg,fileUrl:statusMedia?.url||''})
    socket?.emit('status:new',{...data,user})
    setStatusTxt(''); setStatusMedia(null); setOverlay(null)
  }

  const other    = active&&!active.isGroup?getOther(active,user._id):null
  const chatName = active?.isGroup?active.name:other?.name

  const BG_COLORS = ['linear-gradient(135deg,#16a34a,#22c55e)','linear-gradient(135deg,#1565c0,#42a5f5)','linear-gradient(135deg,#6d1b7b,#e91e8c)','linear-gradient(135deg,#7c1515,#ef4444)','linear-gradient(135deg,#7c3f00,#f59e0b)','#111820','#f0f4f8']

  // ── Sidebar ───────────────────────────────────────────────
  const Sidebar = () => (
    <div style={{ width:'100%', height:'100%', background:'var(--s1)', display:'flex', flexDirection:'column', borderRight:'.5px solid var(--border)' }}>
      {/* Topbar */}
      <div style={{ padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'.5px solid var(--border)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#16a34a,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, boxShadow:'0 4px 10px rgba(34,197,94,.25)', flexShrink:0 }}>💬</div>
          <span style={{ fontSize:16, fontWeight:800, letterSpacing:'-.5px', color:'var(--text)' }}>Chit<span style={{color:'#22c55e'}}>Chat</span></span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:2 }}>
          {/* Theme toggle */}
          <button onClick={toggle} style={{ width:32, height:32, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'none', background:'none', color:'var(--muted)', fontSize:15 }}>
            {isDark?'☀️':'🌙'}
          </button>
          {/* Profile top right */}
          <button onClick={()=>{ setOverlay('profile'); setProfEdit(false); setProfForm({name:user.name,about:user.about||'',phone:user.phone?.replace('+91','')||''}) }}
            style={{ padding:0, background:'none', border:'none', cursor:'pointer', borderRadius:'50%' }}>
            <Av name={user.name} src={user.avatar} size={32} online={true}/>
          </button>
          <button onClick={()=>setOverlay('addmem')} style={{ width:32, height:32, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'none', background:'none', color:'var(--muted)', fontSize:18 }}>✏️</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'.5px solid var(--border)', flexShrink:0 }}>
        {['chats','status','calls'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:'10px 0', fontSize:11, fontWeight:700, color:tab===t?'#22c55e':'var(--muted)', cursor:'pointer', border:'none', background:'none', fontFamily:'inherit', textTransform:'uppercase', letterSpacing:'.5px', position:'relative' }}>
            {t}
            {tab===t&&<span style={{ position:'absolute', bottom:0, left:'25%', right:'25%', height:2, background:'#22c55e', borderRadius:'2px 2px 0 0' }}/>}
          </button>
        ))}
      </div>

      {/* Search */}
      {tab==='chats' && (
        <div style={{ padding:'8px 12px', borderBottom:'.5px solid var(--border)', flexShrink:0 }}>
          <div style={{ background:'var(--s2)', borderRadius:10, display:'flex', alignItems:'center', gap:8, padding:'7px 12px', border:'.5px solid var(--border)' }}>
            <span style={{ color:'var(--muted2)', fontSize:14 }}>🔍</span>
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search..."
              style={{ background:'none', border:'none', outline:'none', fontSize:13, color:'var(--text)', flex:1, fontFamily:'inherit' }}/>
            {searchQ&&<button onClick={()=>{setSearchQ('');setSearchRes([])}} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:16 }}>✕</button>}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto' }}>

        {/* CHATS */}
        {tab==='chats' && (
          <>
            {searchQ&&searchRes.length>0 ? searchRes.map(u=>(
              <div key={u._id} onClick={()=>startDM(u._id)} style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 14px', cursor:'pointer', borderBottom:'.5px solid var(--border)' }}>
                <Av name={u.name} src={u.avatar} online={isOnline(u._id)}/>
                <div><div style={{ fontSize:14,fontWeight:600,color:'var(--text)' }}>{u.name}</div><div style={{ fontSize:12,color:'var(--muted)',marginTop:2 }}>{u.phone||u.email}</div></div>
              </div>
            )) : chats.length===0
              ? <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--muted)' }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>💬</div>
                  <p style={{ fontSize:14,fontWeight:600 }}>No chats yet</p>
                  <p style={{ fontSize:12,marginTop:4 }}>Tap ✏️ to start chatting</p>
                </div>
              : chats.map(chat=>{
                  const o=chat.isGroup?null:getOther(chat,user._id)
                  const name=chat.isGroup?chat.name:o?.name||'Unknown'
                  const last=chat.lastMessage
                  let lastTxt='Start a conversation'
                  if(last){
                    if(last.isDeleted) lastTxt='🚫 Deleted'
                    else if(last.type==='image') lastTxt='📷 Photo'
                    else if(last.type==='video') lastTxt='🎬 Video'
                    else if(last.type==='document') lastTxt=`📄 ${last.fileName||'Document'}`
                    else if(last.type==='audio'||last.type==='voice') lastTxt='🎵 Audio'
                    else if(last.type==='location') lastTxt='📍 Location'
                    else lastTxt=last.content?.slice(0,36)+(last.content?.length>36?'…':'')
                  }
                  return (
                    <div key={chat._id} onClick={()=>openChat(chat)}
                      style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 14px', cursor:'pointer', borderBottom:'.5px solid var(--border)', background:active?._id===chat._id?'var(--hover)':'transparent', position:'relative', transition:'background .1s' }}>
                      {active?._id===chat._id&&<div style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:2.5, background:'#22c55e', borderRadius:'0 2px 2px 0' }}/>}
                      <Av name={name} src={chat.isGroup?chat.groupAvatar:o?.avatar} online={!chat.isGroup?isOnline(o?._id):undefined}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                          <span style={{ fontSize:14,fontWeight:600,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:160 }}>{name}</span>
                          <span style={{ fontSize:11,color:'var(--muted)',flexShrink:0 }}>{fmt(last?.createdAt||chat.updatedAt)}</span>
                        </div>
                        <p style={{ fontSize:12,color:'var(--muted)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{lastTxt}</p>
                      </div>
                    </div>
                  )
                })
            }
          </>
        )}

        {/* STATUS */}
        {tab==='status' && (
          <>
            <div onClick={()=>setOverlay('sc')} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', cursor:'pointer', borderBottom:'.5px solid var(--border)' }}>
              <div style={{ position:'relative', flexShrink:0 }}>
                <div style={{ width:48, height:48, borderRadius:'50%', border:'2px dashed var(--muted2)', padding:1 }}><Av name={user.name} src={user.avatar} size={42}/></div>
                <div style={{ position:'absolute', bottom:0, right:0, width:17, height:17, background:'#22c55e', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid var(--s1)', fontSize:12, color:'#fff', fontWeight:800 }}>+</div>
              </div>
              <div><div style={{ fontSize:14,fontWeight:600,color:'var(--text)' }}>My Status</div><div style={{ fontSize:12,color:'var(--muted)',marginTop:2 }}>Tap to add update</div></div>
            </div>
            {statuses.length>0&&<div style={{ fontSize:11,fontWeight:700,color:'var(--muted2)',padding:'8px 14px 4px',textTransform:'uppercase',letterSpacing:'.7px' }}>Recent</div>}
            {statuses.map((g,gi)=>(
              <div key={gi} onClick={()=>setOverlay(`sv-${gi}`)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', cursor:'pointer', borderBottom:'.5px solid var(--border)' }}>
                <div style={{ width:48, height:48, borderRadius:'50%', padding:2.5, background:'conic-gradient(#22c55e,#10b981,#22c55e)', flexShrink:0 }}>
                  <Av name={g.user.name} src={g.user.avatar} size={43} style={{ border:'2.5px solid var(--s1)' }}/>
                </div>
                <div>
                  <div style={{ fontSize:14,fontWeight:600,color:'var(--text)' }}>{g.user._id===user._id?'My Status':g.user.name}</div>
                  <div style={{ fontSize:12,color:'var(--muted)',marginTop:2 }}>{g.statuses.length} update{g.statuses.length>1?'s':''}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* CALLS */}
        {tab==='calls' && (
          <>
            <div style={{ padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'.5px solid var(--border)' }}>
              <span style={{ fontSize:11,fontWeight:700,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:'.6px' }}>Recent</span>
              <button onClick={()=>setOverlay('addmem')} style={{ background:'rgba(34,197,94,.1)',color:'#22c55e',border:'none',borderRadius:8,padding:'5px 12px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>+ New</button>
            </div>
            {chats.filter(c=>!c.isGroup).slice(0,8).map(chat=>{
              const o=getOther(chat,user._id)
              return (
                <div key={chat._id} style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 14px', borderBottom:'.5px solid var(--border)' }}>
                  <Av name={o.name} src={o.avatar} online={isOnline(o._id)}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14,fontWeight:600,color:'var(--text)' }}>{o.name}</div>
                    <div style={{ fontSize:12,color:'#22c55e',marginTop:3,display:'flex',alignItems:'center',gap:4 }}>📞 Incoming · Today</div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={()=>setOverlay('voice')} style={{ width:34,height:34,borderRadius:'50%',background:'var(--s2)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15 }}>📞</button>
                    <button onClick={()=>setOverlay('video')} style={{ width:34,height:34,borderRadius:'50%',background:'var(--s2)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15 }}>📹</button>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )

  // ── Chat Window ────────────────────────────────────────────
  const ChatWindow = () => (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:'var(--bg)', position:'relative', overflow:'hidden', height:'100%' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle,var(--s3) 1px,transparent 1px)', backgroundSize:'24px 24px', opacity:.25, pointerEvents:'none' }}/>

      {/* Header */}
      <div style={{ background:'var(--s1)', padding:'10px 14px', display:'flex', alignItems:'center', gap:11, borderBottom:'.5px solid var(--border)', zIndex:2, flexShrink:0 }}>
        {/* Back button on mobile */}
        <button onClick={()=>setShowSidebar(true)} style={{ display:'none', width:32,height:32,borderRadius:9,background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:18,alignItems:'center',justifyContent:'center', flexShrink:0 }} className="mobile-back">←</button>
        <Av name={chatName} src={active?.isGroup?active.groupAvatar:other?.avatar} online={!active?.isGroup?isOnline(other?._id):undefined} size={38}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14,fontWeight:700,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{chatName}</div>
          <div style={{ fontSize:12,marginTop:1,fontWeight:500,color:remoteType?'#22c55e':'var(--muted)' }}>
            {remoteType?'typing...' : active?.isGroup?`${active.members?.length} members` : isOnline(other?._id)?'online':other?.phone||''}
          </div>
        </div>
        <div style={{ display:'flex', gap:2, flexShrink:0 }}>
          <button onClick={()=>setOverlay('video')} style={{ width:34,height:34,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:'none',background:'none',color:'var(--muted)',fontSize:16 }}>📹</button>
          <button onClick={()=>setOverlay('voice')} style={{ width:34,height:34,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:'none',background:'none',color:'var(--muted)',fontSize:16 }}>📞</button>
          <button style={{ width:34,height:34,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:'none',background:'none',color:'var(--muted)',fontSize:16 }}>🔍</button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:1, position:'relative', zIndex:1 }}>
        {loadMsg
          ? <div style={{ display:'flex',justifyContent:'center',padding:40 }}><div style={{ width:24,height:24,border:'2px solid rgba(34,197,94,.2)',borderTopColor:'#22c55e',borderRadius:'50%',animation:'spin .7s linear infinite' }}/></div>
          : messages.length===0
          ? <div style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,opacity:.6,paddingTop:60 }}>
              <span style={{ fontSize:24 }}>🔒</span>
              <p style={{ fontSize:13,color:'var(--muted)',fontWeight:500 }}>Messages are end-to-end encrypted</p>
            </div>
          : messages.map((msg,i)=>{
              const isMine=msg.sender?._id===user._id
              const prev=messages[i-1]
              const showName=active?.isGroup&&!isMine&&prev?.sender?._id!==msg.sender?._id
              return <Bubble key={msg._id} msg={msg} isMine={isMine} showName={showName} onReply={setReplyTo} onDelete={deleteMsg}/>
            })
        }
        {remoteType&&(
          <div style={{ display:'flex',alignItems:'flex-end',gap:6 }}>
            <div style={{ width:24,height:24,borderRadius:'50%',background:gradFor(chatName),display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:'#fff',marginBottom:4 }}>{ini(chatName)}</div>
            <div style={{ background:'var(--in)',border:'.5px solid var(--in-b)',borderRadius:'0 14px 14px 14px',padding:'10px 14px' }}>
              <div style={{ display:'flex',gap:3,alignItems:'center',height:16 }}>
                {[0,150,300].map(d=><div key={d} style={{ width:6,height:6,borderRadius:'50%',background:'var(--muted)',animation:`ww 1.2s ease-in-out ${d}ms infinite` }}/>)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Reply bar */}
      {replyTo&&(
        <div style={{ background:'var(--s1)',borderTop:'.5px solid var(--border)',padding:'8px 14px',display:'flex',alignItems:'center',gap:10,zIndex:2,flexShrink:0 }}>
          <div style={{ flex:1,borderLeft:'3px solid #22c55e',paddingLeft:10 }}>
            <div style={{ fontSize:12,fontWeight:700,color:'#22c55e' }}>{replyTo.sender?.name||'You'}</div>
            <div style={{ fontSize:12,color:'var(--muted)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'70vw' }}>{replyTo.content||'📎 Media'}</div>
          </div>
          <button onClick={()=>setReplyTo(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:18 }}>✕</button>
        </div>
      )}

      {/* Input */}
      <div style={{ background:'var(--s1)',padding:'8px 10px',display:'flex',alignItems:'flex-end',gap:7,borderTop:'.5px solid var(--border)',position:'relative',zIndex:2,flexShrink:0 }}>
        <button onClick={()=>setAttach(a=>!a)} style={{ width:40,height:40,borderRadius:'50%',background:'var(--s2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:'none',color:'var(--muted)',flexShrink:0,fontSize:16 }}>📎</button>
        <div style={{ flex:1,background:'var(--inp)',borderRadius:22,display:'flex',alignItems:'center',gap:6,padding:'8px 12px',border:'.5px solid var(--border)',minWidth:0 }}>
          <span style={{ fontSize:17,cursor:'pointer',color:'var(--muted2)',flexShrink:0 }}>😊</span>
          <input value={text} onChange={handleTyping} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),sendMsg())}
            placeholder="Message..."
            style={{ flex:1,background:'none',border:'none',outline:'none',fontSize:14,color:'var(--text)',fontFamily:'inherit',minWidth:0 }}/>
          <button onClick={()=>sendMsg({type:'voice',content:'',duration:`0:${Math.floor(Math.random()*50+5).toString().padStart(2,'0')}`})}
            style={{ fontSize:16,background:'none',border:'none',cursor:'pointer',color:'var(--muted2)',flexShrink:0 }}>🎙️</button>
        </div>
        <button onClick={()=>sendMsg()} style={{ width:42,height:42,borderRadius:'50%',background:'linear-gradient(135deg,#16a34a,#22c55e)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:'none',flexShrink:0,fontSize:18,color:'#fff',boxShadow:'0 4px 14px rgba(34,197,94,.3)' }}>➤</button>
        {attach&&<AttachMenu onSend={p=>sendMsg(p)} onClose={()=>setAttach(false)}/>}
      </div>

      {/* CALL OVERLAYS */}
      {(overlay==='voice'||overlay==='video') && (
        <div style={{ position:'absolute',inset:0,zIndex:50,background:overlay==='video'?'linear-gradient(180deg,#070b1f,#040610)':'linear-gradient(180deg,#071a0f,#040c07)',display:'flex',flexDirection:'column' }}>
          <div style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14 }}>
            <div style={{ width:88,height:88,borderRadius:'50%',background:gradFor(chatName),display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,fontWeight:800,color:'#fff',boxShadow:'0 0 0 10px rgba(34,197,94,.08)' }}>{ini(chatName)}</div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:22,fontWeight:800,color:'#fff' }}>{chatName}</div>
              <div style={{ fontSize:13,color:'rgba(255,255,255,.45)',marginTop:6 }}>{overlay==='video'?'Video Call':'Voice Call'} · Calling...</div>
            </div>
          </div>
          <div style={{ display:'flex',gap:22,justifyContent:'center',paddingBottom:48 }}>
            {[{e:'🔇',l:'Mute'},{e:'📵',l:'End',bg:'#ef4444',fn:()=>setOverlay(null)},{e:'🔊',l:'Speaker'}].map(b=>(
              <div key={b.l} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:8 }}>
                <button onClick={b.fn} style={{ width:58,height:58,borderRadius:'50%',background:b.bg||'rgba(255,255,255,.12)',display:'flex',alignItems:'center',justifyContent:'center',border:'none',cursor:'pointer',fontSize:22 }}>{b.e}</button>
                <span style={{ fontSize:11,fontWeight:600,color:'rgba(255,255,255,.4)' }}>{b.l}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // ── Welcome screen ─────────────────────────────────────────
  const Welcome = () => (
    <div style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14,padding:24,background:'var(--bg)',position:'relative' }}>
      <div style={{ position:'absolute',inset:0,backgroundImage:'radial-gradient(circle,var(--s3) 1px,transparent 1px)',backgroundSize:'24px 24px',opacity:.25,pointerEvents:'none' }}/>
      <div style={{ width:72,height:72,borderRadius:20,background:'linear-gradient(135deg,#16a34a,#22c55e)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:34,boxShadow:'0 12px 32px rgba(34,197,94,.25)',position:'relative',zIndex:1 }}>💬</div>
      <div style={{ fontSize:26,fontWeight:800,letterSpacing:'-.6px',color:'var(--text)',position:'relative',zIndex:1 }}>Chit<span style={{color:'#22c55e'}}>Chat</span></div>
      <p style={{ fontSize:14,color:'var(--muted)',textAlign:'center',maxWidth:260,lineHeight:1.6,position:'relative',zIndex:1 }}>Select a conversation or tap ✏️ to start chatting.</p>
      <div style={{ background:'var(--s2)',border:'.5px solid var(--border)',borderRadius:20,padding:'6px 16px',fontSize:12,fontWeight:600,color:'var(--muted)',position:'relative',zIndex:1 }}>🔒 End-to-end encrypted</div>
    </div>
  )

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:'var(--ff)', background:'var(--bg)' }}>
      <style>{`
        .mbtn{opacity:0}.mr:hover .mbtn{opacity:1!important}
        @media(max-width:640px){
          .desktop-only{display:none!important}
          .mobile-back{display:flex!important}
          .sidebar-col{position:absolute!important;inset:0!important;z-index:10!important}
          .chat-col{position:absolute!important;inset:0!important;z-index:10!important}
        }
      `}</style>

      {/* SIDEBAR */}
      <div className={`sidebar-col ${!showSidebar ? 'desktop-only' : ''}`}
        style={{ width:340, maxWidth:'100vw', flexShrink:0, height:'100%', position:'relative' }}>
        <Sidebar/>
      </div>

      {/* MAIN */}
      <div className={`chat-col ${showSidebar ? 'desktop-only' : ''}`}
        style={{ flex:1, height:'100%', display:'flex', flexDirection:'column', minWidth:0 }}>
        {active ? <ChatWindow/> : <Welcome/>}
      </div>

      {/* ── OVERLAYS ── */}

      {/* ADD MEMBER */}
      {overlay==='addmem' && (
        <div style={{ position:'fixed',inset:0,zIndex:60,background:'var(--bg)',display:'flex',flexDirection:'column' }}>
          <div style={{ background:'var(--s1)',padding:'12px 14px',display:'flex',alignItems:'center',gap:12,borderBottom:'.5px solid var(--border)',flexShrink:0 }}>
            <button onClick={()=>setOverlay(null)} style={{ width:34,height:34,borderRadius:9,background:'var(--s2)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text)',fontSize:16 }}>←</button>
            <span style={{ fontSize:15,fontWeight:700,color:'var(--text)' }}>New Chat / Add Member</span>
          </div>
          <div style={{ padding:'13px 14px',borderBottom:'.5px solid var(--border)',flexShrink:0 }}>
            <div style={{ fontSize:12,color:'var(--muted)',marginBottom:10,fontWeight:500 }}>Find by mobile number:</div>
            <div style={{ display:'flex',gap:8 }}>
              <div style={{ flex:1,background:'var(--s2)',border:'.5px solid var(--border)',borderRadius:11,display:'flex',alignItems:'center',gap:8,padding:'10px 12px' }}>
                <span style={{ fontSize:13,color:'var(--muted)',fontWeight:700 }}>📞 +91</span>
                <div style={{ width:1,height:15,background:'var(--border)' }}/>
                <input value={addPhone} onChange={e=>setAddPhone(e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="Enter mobile number" inputMode="numeric"
                  style={{ flex:1,background:'none',border:'none',outline:'none',fontSize:14,color:'var(--text)',fontFamily:'inherit' }}/>
              </div>
              <button onClick={async()=>{ if(addPhone.length<10) return; const {data}=await api.get(`/users/search?q=${addPhone}`); setFoundUser(data[0]||null) }}
                style={{ background:'#22c55e',color:'#fff',border:'none',borderRadius:10,padding:'0 16px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>Find</button>
            </div>
            {foundUser&&(
              <div style={{ marginTop:10,background:'rgba(34,197,94,.06)',border:'.5px solid rgba(34,197,94,.2)',borderRadius:12,padding:11,display:'flex',alignItems:'center',gap:10 }}>
                <Av name={foundUser.name} src={foundUser.avatar} size={40}/>
                <div style={{ flex:1 }}><div style={{ fontSize:14,fontWeight:600,color:'var(--text)' }}>{foundUser.name}</div><div style={{ fontSize:12,color:'#22c55e',marginTop:2 }}>{foundUser.phone}</div></div>
                <button onClick={()=>{ startDM(foundUser._id); setFoundUser(null); setAddPhone('') }}
                  style={{ background:'#22c55e',color:'#fff',border:'none',borderRadius:9,padding:'7px 14px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>Chat</button>
              </div>
            )}
          </div>
          {/* Group create */}
          <div style={{ padding:'10px 14px',borderBottom:'.5px solid var(--border)',flexShrink:0,display:'flex',gap:8 }}>
            <input value={groupForm.name} onChange={e=>setGroupForm(f=>({...f,name:e.target.value}))} placeholder="Group name (select 2+ below)"
              style={{ flex:1,background:'var(--s2)',border:'.5px solid var(--border)',borderRadius:10,padding:'9px 12px',fontSize:13,color:'var(--text)',outline:'none',fontFamily:'inherit' }}/>
            <button onClick={createGroup} disabled={!groupForm.name||groupForm.selected.length<2}
              style={{ background:groupForm.name&&groupForm.selected.length>=2?'#22c55e':'var(--s3)',color:groupForm.name&&groupForm.selected.length>=2?'#fff':'var(--muted)',border:'none',borderRadius:10,padding:'0 14px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>
              Create
            </button>
          </div>
          <div style={{ flex:1,overflowY:'auto' }}>
            <div style={{ fontSize:11,fontWeight:700,color:'var(--muted2)',padding:'8px 14px 4px',textTransform:'uppercase',letterSpacing:'.7px' }}>All Contacts</div>
            {allUsers.map(u=>{
              const sel=groupForm.selected.find(x=>x._id===u._id)
              return (
                <div key={u._id} style={{ display:'flex',alignItems:'center',gap:11,padding:'10px 14px',borderBottom:'.5px solid var(--border)',cursor:'pointer' }}
                  onClick={()=>{
                    const notGrp=()=>startDM(u._id)
                    if(!groupForm.name) notGrp()
                    else setGroupForm(f=>({...f,selected:sel?f.selected.filter(x=>x._id!==u._id):[...f.selected,u]}))
                  }}>
                  <Av name={u.name} src={u.avatar} online={isOnline(u._id)}/>
                  <div style={{ flex:1 }}><div style={{ fontSize:14,fontWeight:600,color:'var(--text)' }}>{u.name}</div><div style={{ fontSize:12,color:'var(--muted)',marginTop:2 }}>{u.phone||u.email}</div></div>
                  {sel&&<span style={{ color:'#22c55e',fontWeight:800,fontSize:16 }}>✓</span>}
                  {isOnline(u._id)&&!sel&&<span style={{ fontSize:11,fontWeight:700,color:'#22c55e' }}>Online</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* STATUS COMPOSE */}
      {overlay==='sc' && (
        <div style={{ position:'fixed',inset:0,zIndex:60,background:'var(--bg)',display:'flex',flexDirection:'column' }}>
          <div style={{ background:'var(--s1)',padding:'12px 14px',display:'flex',alignItems:'center',gap:12,borderBottom:'.5px solid var(--border)',flexShrink:0 }}>
            <button onClick={()=>setOverlay(null)} style={{ width:34,height:34,borderRadius:9,background:'var(--s2)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text)',fontSize:16 }}>←</button>
            <span style={{ fontSize:15,fontWeight:700,color:'var(--text)',flex:1 }}>New Status</span>
            <button onClick={postStatus} style={{ background:'rgba(34,197,94,.1)',color:'#22c55e',border:'none',borderRadius:8,padding:'7px 15px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>Post</button>
          </div>
          <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',background:statusBg,position:'relative',transition:'background .3s',minHeight:0 }}>
            {statusMedia
              ? statusMedia.type==='video'
                ? <video src={statusMedia.url} style={{ maxWidth:'100%',maxHeight:'100%',objectFit:'contain' }} muted autoPlay loop/>
                : <img src={statusMedia.url} alt="" style={{ maxWidth:'100%',maxHeight:'100%',objectFit:'contain' }}/>
              : <p style={{ fontSize:20,fontWeight:700,color:'#fff',textAlign:'center',padding:28 }}>{statusTxt||'Write something or add photo...'}</p>
            }
            <div style={{ position:'absolute',bottom:14,right:14,display:'flex',gap:8 }}>
              <label style={{ width:38,height:38,borderRadius:'50%',background:'rgba(0,0,0,.35)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:18 }}>
                📷<input type="file" accept="image/*,video/*" style={{ display:'none' }} onChange={e=>{ const f=e.target.files[0]; if(!f) return; setStatusMedia({url:URL.createObjectURL(f),type:f.type.startsWith('video')?'video':'image'}); setStatusBg('#000') }}/>
              </label>
            </div>
          </div>
          <div style={{ display:'flex',gap:8,padding:'10px 14px',borderTop:'.5px solid var(--border)',overflowX:'auto',flexShrink:0 }}>
            {BG_COLORS.map((c,i)=>(
              <button key={i} onClick={()=>{ setStatusBg(c); setStatusMedia(null) }}
                style={{ width:28,height:28,borderRadius:'50%',cursor:'pointer',flexShrink:0,border:statusBg===c?'2px solid var(--text)':'2px solid transparent',background:c,transition:'all .15s',transform:statusBg===c?'scale(1.15)':'none' }}/>
            ))}
          </div>
          <div style={{ padding:'9px 12px',display:'flex',alignItems:'center',gap:8,background:'var(--s1)',flexShrink:0 }}>
            <input value={statusTxt} onChange={e=>setStatusTxt(e.target.value)} placeholder="Write a status..."
              style={{ flex:1,background:'var(--inp)',border:'.5px solid var(--border)',borderRadius:22,padding:'10px 16px',fontSize:13.5,color:'var(--text)',outline:'none',fontFamily:'inherit' }}/>
          </div>
        </div>
      )}

      {/* STATUS VIEWER */}
      {overlay&&overlay.startsWith('sv-') && (()=>{
        const gi=parseInt(overlay.split('-')[1])
        const grp=statuses[gi]
        if (!grp) return null
        const s=grp.statuses[0]
        return (
          <div style={{ position:'fixed',inset:0,zIndex:60,background:'#000',display:'flex',flexDirection:'column' }}>
            <div style={{ display:'flex',gap:4,padding:'12px 14px 0',flexShrink:0 }}>
              {grp.statuses.map((_,i)=>(
                <div key={i} style={{ flex:1,height:2,background:'rgba(255,255,255,.2)',borderRadius:2,overflow:'hidden' }}>
                  <div style={{ height:'100%',background:'#fff',width:'100%',animation:'sv 5s linear forwards' }}/>
                </div>
              ))}
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',flexShrink:0 }}>
              <Av name={grp.user.name} src={grp.user.avatar} size={38}/>
              <div><div style={{ fontSize:13,fontWeight:700,color:'#fff' }}>{grp.user.name}</div><div style={{ fontSize:11,color:'rgba(255,255,255,.45)' }}>{timeOnly(s?.createdAt)}</div></div>
              <button onClick={()=>setOverlay(null)} style={{ marginLeft:'auto',background:'rgba(255,255,255,.1)',border:'none',width:32,height:32,borderRadius:8,cursor:'pointer',color:'#fff',fontSize:16 }}>✕</button>
            </div>
            <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',background:s?.bgColor||'#16a34a',padding:28,minHeight:0 }}>
              {s?.fileUrl
                ? s.type==='video'
                  ? <video src={s.fileUrl} style={{ maxWidth:'100%',maxHeight:'100%',objectFit:'contain' }} controls autoPlay/>
                  : <img src={s.fileUrl} alt="" style={{ maxWidth:'100%',maxHeight:'100%',objectFit:'contain',borderRadius:12 }}/>
                : <p style={{ fontSize:22,fontWeight:700,color:'#fff',textAlign:'center' }}>{s?.content}</p>
              }
            </div>
          </div>
        )
      })()}

      {/* PROFILE */}
      {overlay==='profile' && (
        <div style={{ position:'fixed',inset:0,zIndex:60,background:'rgba(0,0,0,.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}
          onClick={e=>e.target===e.currentTarget&&setOverlay(null)}>
          <div style={{ background:'var(--s1)',borderRadius:20,width:'100%',maxWidth:380,overflow:'hidden',boxShadow:'var(--shadow)' }}>
            <div style={{ background:'linear-gradient(135deg,#16a34a,#22c55e)',padding:'28px 24px 20px',textAlign:'center',position:'relative' }}>
              <button onClick={()=>setOverlay(null)} style={{ position:'absolute',top:12,right:12,background:'rgba(255,255,255,.2)',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',color:'#fff',fontSize:16 }}>✕</button>
              <Av name={user.name} src={user.avatar} size={68} style={{ margin:'0 auto 12px' }}/>
              <div style={{ fontSize:18,fontWeight:800,color:'#fff' }}>{user.name}</div>
              <div style={{ fontSize:13,color:'rgba(255,255,255,.7)',marginTop:4 }}>{user.phone||user.email}</div>
            </div>
            <div style={{ padding:'20px 22px' }}>
              {!profEdit ? (
                <>
                  <div style={{ background:'var(--s2)',borderRadius:12,padding:14,marginBottom:14 }}>
                    <div style={{ fontSize:11,fontWeight:700,color:'#22c55e',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:5 }}>About</div>
                    <div style={{ fontSize:14,color:'var(--text)' }}>{user.about||'Hey there! I am using ChitChat 👋'}</div>
                  </div>
                  <div style={{ display:'flex',gap:10 }}>
                    <button onClick={()=>setProfEdit(true)} style={{ flex:1,padding:12,background:'linear-gradient(135deg,#16a34a,#22c55e)',color:'#fff',border:'none',borderRadius:11,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>Edit Profile</button>
                    <button onClick={()=>{ logout(); setOverlay(null) }} style={{ padding:'12px 16px',background:'rgba(239,68,68,.1)',color:'#ef4444',border:'none',borderRadius:11,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>Logout</button>
                  </div>
                </>
              ) : (
                <>
                  {[{k:'name',l:'Name',p:'Rahul Sharma'},{k:'about',l:'About',p:'Hey there!'},{k:'phone',l:'Phone (+91)',p:'9876543210'}].map(f=>(
                    <div key={f.k} style={{ marginBottom:14 }}>
                      <label style={{ display:'block',fontSize:11,fontWeight:700,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:'.7px',marginBottom:6 }}>{f.l}</label>
                      <input value={profForm[f.k]} onChange={e=>setProfForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.p}
                        style={{ width:'100%',border:'.5px solid var(--border)',borderRadius:10,background:'var(--inp)',padding:'11px 13px',fontSize:14,color:'var(--text)',outline:'none',fontFamily:'inherit' }}/>
                    </div>
                  ))}
                  <div style={{ display:'flex',gap:10 }}>
                    <button onClick={()=>setProfEdit(false)} style={{ flex:1,padding:12,background:'var(--s2)',color:'var(--muted)',border:'none',borderRadius:11,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>Cancel</button>
                    <button onClick={async()=>{ const {data}=await api.put('/users/profile',{name:profForm.name,about:profForm.about,phone:profForm.phone?`+91${profForm.phone}`:undefined}); updateUser(data); setProfEdit(false) }}
                      style={{ flex:1,padding:12,background:'linear-gradient(135deg,#16a34a,#22c55e)',color:'#fff',border:'none',borderRadius:11,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>Save</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
