// ─────────────────────────────────────────
//  ChatWindow.jsx
//  — Shown when a chat is active
//  — Composes: ChatHeader + MessagesList + MessageInput
//  — Manages local overlays: call, contact info
// ─────────────────────────────────────────
import ChatHeader          from './ChatHeader'
import MessagesList        from './MessagesList'
import MessageInput        from './MessageInput'
import ContactInfoOverlay  from '../overlays/ContactInfoOverlay'
import { CallOverlay }     from '../overlays/CallStatusOverlays'
import { useState }        from 'react'

export default function ChatWindow({
  chat,
  other,
  chatName,
  messages,
  loading,
  user,
  socket,
  isOnline,
  remoteType,
  replyTo,
  onBack,
  onSend,
  onReply,
  onDelete,
  onClearReply,
}) {
  // Local overlay: 'voice' | 'video' | 'contact' | null
  const [localOverlay, setLocalOverlay] = useState(null)

  return (
    <div className="flex flex-col flex-1 min-h-0 relative">
      {/* Header */}
      <ChatHeader
        chat={chat}
        other={other}
        chatName={chatName}
        isOnline={isOnline}
        remoteType={remoteType}
        onBack={onBack}
        onCall={() => setLocalOverlay('voice')}
        onVideo={() => setLocalOverlay('video')}
        onViewProfile={() => setLocalOverlay('contact')}
      />

      {/* Scrollable messages */}
      <MessagesList
        messages={messages}
        loading={loading}
        user={user}
        chat={chat}
        chatName={chatName}
        remoteType={remoteType}
        onReply={onReply}
        onDelete={onDelete}
      />

      {/* Input bar + reply bar */}
      <MessageInput
        replyTo={replyTo}
        onClearReply={onClearReply}
        onSend={onSend}
        socket={socket}
        active={chat}
        user={user}
      />

      {/* Voice / video call overlay */}
      {(localOverlay === 'voice' || localOverlay === 'video') && (
        <CallOverlay
          type={localOverlay}
          chat={chat}
          user={user}
          isOnline={isOnline}
          onEnd={() => setLocalOverlay(null)}
        />
      )}

      {/* Contact info overlay */}
      {localOverlay === 'contact' && (
        <ContactInfoOverlay
          contact={other}
          isOnline={isOnline}
          onClose={() => setLocalOverlay(null)}
        />
      )}
    </div>
  )
}
