// ─────────────────────────────────────────
//  Sidebar.jsx
// ─────────────────────────────────────────
import { Icon, IBtn } from '../Icons'
import Avatar from '../shared/Avatar'
import { fmt, getOther, lastMsgPreview } from '../shared/utils'

// ── Sidebar header ───────────────────────
function SidebarHeader({ theme, isDark, onToggleTheme, onNewChat, onLogout }) {
  return (
    <div className="h-14 px-4 flex items-center justify-between border-b border-[var(--border)] flex-shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-700 to-green-500 flex items-center justify-center flex-shrink-0">
          <Icon.Chat className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-black tracking-tight text-[var(--text)]">
          Chit<span className="text-green-500">Chat</span>
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center border-none bg-transparent cursor-pointer text-[var(--muted)] hover:bg-[var(--hover)]"
          title="Toggle theme"
        >
          {isDark ? <Icon.Sun className="w-5 h-5" /> : <Icon.Moon className="w-5 h-5" />}
        </button>
        <IBtn icon={Icon.Edit} onClick={onNewChat} title="New Chat" />
        <IBtn icon={Icon.More} onClick={onLogout}  title="Logout" />
      </div>
    </div>
  )
}

// ── Profile row ──────────────────────────
function ProfileRow({ user, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-transparent border-none cursor-pointer text-left w-full hover:bg-[var(--hover)] flex-shrink-0"
    >
      <Avatar name={user.name} src={user.avatar} online={true} size={42} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-[var(--text)] truncate">{user.name}</div>
        <div className="text-xs text-[var(--muted)] mt-0.5">{user.phone || 'Tap to edit profile'}</div>
      </div>
      <Icon.Edit className="w-4 h-4 text-[var(--muted2)] flex-shrink-0" />
    </button>
  )
}

// ── Tab bar ──────────────────────────────
function TabBar({ tab, setTab }) {
  return (
    <div className="flex border-b border-[var(--border)] flex-shrink-0">
      {['chats', 'status', 'calls'].map(t => (
        <button key={t} onClick={() => setTab(t)}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-none cursor-pointer relative transition-colors
            ${tab === t ? 'text-green-500 bg-transparent' : 'text-[var(--muted)] bg-transparent hover:bg-[var(--hover)]'}`}>
          {t}
          {tab === t && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-green-500 rounded-t" />}
        </button>
      ))}
    </div>
  )
}

// ── Search bar ───────────────────────────
function SearchBar({ value, onChange, onClear }) {
  return (
    <div className="px-3 py-2 border-b border-[var(--border)] flex-shrink-0">
      <div className="bg-[var(--s2)] rounded-xl flex items-center gap-2 px-3 py-2.5 border border-[var(--border)]">
        <Icon.Search className="w-4 h-4 text-[var(--muted2)] flex-shrink-0" />
        <input
          value={value}
          onChange={onChange}
          placeholder="Search or start new chat"
          className="bg-transparent border-none outline-none text-sm text-[var(--text)] flex-1 min-w-0"
        />
        {value && (
          <button onClick={onClear} className="border-none bg-transparent cursor-pointer text-[var(--muted)] text-base leading-none">✕</button>
        )}
      </div>
    </div>
  )
}

// ── Chat list item ───────────────────────
function ChatItem({ chat, user, isActive, isOnline, onClick }) {
  const o    = chat.isGroup ? null : getOther(chat, user._id)
  const name = chat.isGroup ? chat.name : o?.name || 'Unknown'
  const last = chat.lastMessage

  return (
    <div onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-[var(--border)] relative transition-colors
        ${isActive ? 'bg-[var(--hover)]' : 'hover:bg-[var(--hover)]'}`}>
      {isActive && <div className="absolute left-0 top-[20%] bottom-[20%] w-0.5 bg-green-500 rounded-r" />}
      <Avatar
        name={name}
        src={chat.isGroup ? chat.groupAvatar : o?.avatar}
        online={!chat.isGroup ? isOnline(o?._id) : undefined}
        size={46}
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-sm font-semibold text-[var(--text)] truncate max-w-[60%]">{name}</span>
          <span className="text-[10px] text-[var(--muted)] font-medium flex-shrink-0">
            {fmt(last?.createdAt || chat.updatedAt)}
          </span>
        </div>
        <p className="text-xs text-[var(--muted)] truncate">{lastMsgPreview(last)}</p>
      </div>
    </div>
  )
}

// ── Main Sidebar export ──────────────────
export default function Sidebar({
  show, user, chats, tab, setTab,
  searchQ, setSearchQ, searchRes,
  statuses, isOnline, activeChat,
  isDark, onToggleTheme,
  onOpenChat, onStartDM, onNewChat,
  onOpenProfile, onLogout,
  onStatusView, onStatusCompose,
}) {
  return (
    <div className={`
      flex flex-col bg-[var(--s1)] border-r border-[var(--border)] flex-shrink-0
      md:relative md:w-[340px] md:translate-x-0
      absolute inset-y-0 left-0 z-30 w-full
      transition-transform duration-300
      ${show ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <SidebarHeader
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onNewChat={onNewChat}
        onLogout={onLogout}
      />

      <ProfileRow user={user} onClick={onOpenProfile} />

      <TabBar tab={tab} setTab={setTab} />

      {tab === 'chats' && (
        <SearchBar
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          onClear={() => { setSearchQ(''); }}
        />
      )}

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto">

        {/* Search results */}
        {tab === 'chats' && searchQ && searchRes.map(u => (
          <div key={u._id} onClick={() => onStartDM(u._id)}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-[var(--border)] hover:bg-[var(--hover)]">
            <Avatar name={u.name} src={u.avatar} online={isOnline(u._id)} size={46} />
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">{u.name}</div>
              <div className="text-xs text-[var(--muted)] mt-0.5">{u.phone || u.email}</div>
            </div>
          </div>
        ))}

        {/* Chat list */}
        {tab === 'chats' && !searchQ && (
          chats.length === 0
            ? <div className="text-center py-12 px-6 text-[var(--muted)]">
                <Icon.Chat className="w-10 h-10 mx-auto mb-3 text-[var(--muted2)]" />
                <p className="text-sm font-semibold">No chats yet</p>
                <p className="text-xs mt-1">Search for users to start chatting</p>
              </div>
            : chats.map(chat => (
                <ChatItem
                  key={chat._id}
                  chat={chat}
                  user={user}
                  isActive={activeChat?._id === chat._id}
                  isOnline={isOnline}
                  onClick={() => onOpenChat(chat)}
                />
              ))
        )}

        {/* Status tab */}
        {tab === 'status' && <>
          <div onClick={onStatusCompose}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-[var(--border)] hover:bg-[var(--hover)]">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-[var(--muted2)] p-0.5">
                <Avatar name={user.name} src={user.avatar} size={40} />
              </div>
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-[var(--s1)]">
                <Icon.Plus className="w-2 h-2 text-white" />
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">My Status</div>
              <div className="text-xs text-[var(--muted)] mt-0.5">Tap to add update</div>
            </div>
          </div>
          {statuses.map((g, gi) => (
            <div key={gi} onClick={() => onStatusView(gi)}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-[var(--border)] hover:bg-[var(--hover)]">
              <div className="w-12 h-12 rounded-full p-0.5 flex-shrink-0" style={{ background: 'conic-gradient(#22c55e,#10b981,#22c55e)' }}>
                <Avatar name={g.user.name} src={g.user.avatar} size={43} className="border-2 border-[var(--s1)] rounded-full" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text)]">{g.user._id === user._id ? 'My Status' : g.user.name}</div>
                <div className="text-xs text-[var(--muted)] mt-0.5">{g.statuses.length} update{g.statuses.length > 1 ? 's' : ''}</div>
              </div>
            </div>
          ))}
        </>}

        {/* Calls tab */}
        {tab === 'calls' && chats.filter(c => !c.isGroup).slice(0, 5).map(chat => {
          const o = getOther(chat, user._id)
          return (
            <div key={chat._id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
              <Avatar name={o.name} src={o.avatar} online={isOnline(o._id)} size={46} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[var(--text)]">{o.name}</div>
                <div className="text-xs text-green-500 mt-0.5">📞 Incoming · Today</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onOpenChat(chat)} className="w-9 h-9 rounded-full bg-[var(--s2)] border-none cursor-pointer flex items-center justify-center">
                  <Icon.Call className="w-4 h-4 text-green-500" />
                </button>
                <button onClick={() => onOpenChat(chat)} className="w-9 h-9 rounded-full bg-[var(--s2)] border-none cursor-pointer flex items-center justify-center">
                  <Icon.Video className="w-4 h-4 text-green-500" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
