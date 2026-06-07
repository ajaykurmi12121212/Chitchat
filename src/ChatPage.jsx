// ─────────────────────────────────────────
//  ChatPage.jsx  — PURE LOGIC ONLY
//  Zero UI here. All rendering → components.
// ─────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useAuth }   from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useTheme }  from '../context/ThemeContext'

// Layout components
import Sidebar       from '../components/sidebar/Sidebar'
import ChatWindow    from '../components/chat/ChatWindow'
import EmptyState    from '../components/chat/EmptyState'

// Overlay components
import ProfileOverlay  from '../components/overlays/ProfileOverlay'
import NewChatOverlay  from '../components/overlays/NewChatOverlay'
import { StatusViewer, StatusCompose } from '../components/overlays/CallStatusOverlays'

// Utilities
import { getOther } from '../components/shared/utils'

export default function ChatPage() {
  const { user, api, logout, updateUser } = useAuth()
  const { socket, isOnline }              = useSocket()
  const { theme, toggle }                 = useTheme()

  // ── App state ──────────────────────────
  const [chats,       setChats]       = useState([])
  const [active,      setActive]      = useState(null)
  const [messages,    setMessages]    = useState([])
  const [tab,         setTab]         = useState('chats')
  const [searchQ,     setSearchQ]     = useState('')
  const [searchRes,   setSearchRes]   = useState([])
  const [allUsers,    setAllUsers]    = useState([])
  const [statuses,    setStatuses]    = useState([])
  const [remoteType,  setRemoteType]  = useState(false)
  const [loadMsg,     setLoadMsg]     = useState(false)
  const [replyTo,     setReplyTo]     = useState(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [statusView,  setStatusView]  = useState(0)

  // overlay: null | 'profile' | 'newchat' | 'sv' | 'sc'
  const [overlay, setOverlay] = useState(null)

  const isDark = theme === 'dark'

  // ── Data fetching ──────────────────────
  useEffect(() => {
    api.get('/chats').then(({ data }) => setChats(data))
  }, [])

  useEffect(() => {
    if (tab === 'contacts' || overlay === 'newchat')
      api.get('/users/all').then(({ data }) => setAllUsers(data))
    if (tab === 'status')
      api.get('/status').then(({ data }) => setStatuses(data))
  }, [tab, overlay])

  useEffect(() => {
    if (!searchQ.trim()) return setSearchRes([])
    const t = setTimeout(
      () => api.get(`/users/search?q=${searchQ}`).then(({ data }) => setSearchRes(data)),
      400
    )
    return () => clearTimeout(t)
  }, [searchQ])

  // ── Socket listeners ───────────────────
  useEffect(() => {
    if (!socket) return

    const onMsg = (msg) => {
      if (active?._id === msg.chat)
        setMessages(p => [...p, msg])

      setChats(p =>
        p.map(c => c._id === msg.chat ? { ...c, lastMessage: msg, updatedAt: new Date() } : c)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      )

      // Browser notification for background chats
      if (
        active?._id !== msg.chat &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        new Notification(msg.sender?.name || 'New Message', {
          body: msg.content || '📎 Media',
          icon: '/favicon.ico',
        })
      }
    }

    const onTypingStart = ({ chatId }) => {
      if (active?._id === chatId) setRemoteType(true)
    }
    const onTypingStop = ({ chatId }) => {
      if (active?._id === chatId) setRemoteType(false)
    }
    const onStatusNew = (s) => {
      setStatuses(p => {
        const uid = s.user?._id
        const ex  = p.find(g => g.user._id === uid)
        if (ex) return p.map(g => g.user._id === uid ? { ...g, statuses: [...g.statuses, s] } : g)
        return [{ user: s.user, statuses: [s] }, ...p]
      })
    }

    socket.on('message:receive', onMsg)
    socket.on('typing:start',    onTypingStart)
    socket.on('typing:stop',     onTypingStop)
    socket.on('status:new',      onStatusNew)

    return () => {
      socket.off('message:receive', onMsg)
      socket.off('typing:start',    onTypingStart)
      socket.off('typing:stop',     onTypingStop)
      socket.off('status:new',      onStatusNew)
    }
  }, [socket, active])

  // Join/leave chat room + fetch messages
  useEffect(() => {
    if (!active || !socket) return
    socket.emit('chat:join', active._id)
    setLoadMsg(true)
    api.get(`/messages/${active._id}`)
      .then(({ data }) => setMessages(data))
      .finally(() => setLoadMsg(false))
    return () => socket.emit('chat:leave', active._id)
  }, [active])

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default')
      Notification.requestPermission()
  }, [])

  // ── Actions ────────────────────────────
  const goBack = () => {
    setActive(null)
    setShowSidebar(true)
  }

  const openChat = (chat) => {
    setActive(chat)
    setRemoteType(false)
    setReplyTo(null)
    setShowSidebar(false)
  }

  const startDM = async (uid) => {
    const { data } = await api.post('/chats', { userId: uid })
    setChats(p => p.find(c => c._id === data._id) ? p : [data, ...p])
    openChat(data)
    setOverlay(null)
    setSearchQ('')
    setSearchRes([])
  }

  const sendMsg = async (payload) => {
    if (payload.type === 'text' && !payload.content) return
    if (!active) return
    const currentReply = replyTo
    setReplyTo(null)
    try {
      const { data: msg } = await api.post('/messages', {
        chatId: active._id,
        ...payload,
        ...(currentReply ? { replyTo: currentReply._id } : {}),
      })
      setMessages(p => [...p, msg])
      socket?.emit('message:send', msg)
      setChats(p =>
        p.map(c => c._id === active._id ? { ...c, lastMessage: msg, updatedAt: new Date() } : c)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      )
    } catch {}
  }

  const deleteMsg = async (msg) => {
    await api.delete(`/messages/${msg._id}`, { data: { forEveryone: true } })
    setMessages(p =>
      p.map(m => m._id === msg._id ? { ...m, isDeleted: true, content: 'deleted' } : m)
    )
  }

  const saveProfile = async (payload) => {
    const { data } = await api.put('/users/profile', payload)
    updateUser(data)
  }

  const handleLogout = () => {
    setOverlay(null)
    logout()
  }

  // ── Derived values ─────────────────────
  const other    = active && !active.isGroup ? getOther(active, user._id) : null
  const chatName = active?.isGroup ? active.name : other?.name

  // ── Render ─────────────────────────────
  return (
    <div
      className="flex h-[100dvh] overflow-hidden bg-[var(--bg)] font-[var(--ff)]"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <style>{`
        .msg-menu-btn { opacity: 0 }
        .mr:hover .msg-menu-btn { opacity: 1 !important }
        * { -webkit-tap-highlight-color: transparent }
      `}</style>

      {/* ══ SIDEBAR ══════════════════════════════ */}
      <Sidebar
        show={showSidebar}
        user={user}
        chats={chats}
        tab={tab}
        setTab={setTab}
        searchQ={searchQ}
        setSearchQ={setSearchQ}
        searchRes={searchRes}
        statuses={statuses}
        isOnline={isOnline}
        activeChat={active}
        isDark={isDark}
        onToggleTheme={toggle}
        onOpenChat={openChat}
        onStartDM={startDM}
        onNewChat={() => setOverlay('newchat')}
        onOpenProfile={() => setOverlay('profile')}
        onLogout={handleLogout}
        onStatusView={(gi) => { setStatusView(gi); setOverlay('sv') }}
        onStatusCompose={() => setOverlay('sc')}
      />

      {/* ══ MAIN AREA ════════════════════════════ */}
      <div className={`
        flex-1 flex flex-col bg-[var(--bg)] relative overflow-hidden
        md:static md:translate-x-0
        absolute inset-0 z-20 transition-transform duration-300
        ${!showSidebar ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        {/* Dot pattern bg */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--s3) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Active chat OR empty state */}
        {active ? (
          <ChatWindow
            chat={active}
            other={other}
            chatName={chatName}
            messages={messages}
            loading={loadMsg}
            user={user}
            socket={socket}
            isOnline={isOnline}
            remoteType={remoteType}
            replyTo={replyTo}
            onBack={goBack}
            onSend={sendMsg}
            onReply={setReplyTo}
            onDelete={deleteMsg}
            onClearReply={() => setReplyTo(null)}
          />
        ) : (
          <EmptyState onShowSidebar={() => setShowSidebar(true)} />
        )}

        {/* ══ GLOBAL OVERLAYS ══════════════════ */}

        {overlay === 'profile' && (
          <ProfileOverlay
            user={user}
            onClose={() => setOverlay(null)}
            onSave={saveProfile}
            onLogout={handleLogout}
          />
        )}

        {overlay === 'newchat' && (
          <NewChatOverlay
            allUsers={allUsers}
            isOnline={isOnline}
            api={api}
            onClose={() => setOverlay(null)}
            onStartDM={startDM}
          />
        )}

        {overlay === 'sv' && statuses[statusView] && (
          <StatusViewer
            groups={statuses}
            user={user}
            onClose={() => setOverlay(null)}
          />
        )}

        {overlay === 'sc' && (
          <StatusCompose
            user={user}
            api={api}
            socket={socket}
            onClose={() => setOverlay(null)}
          />
        )}
      </div>
    </div>
  )
}
