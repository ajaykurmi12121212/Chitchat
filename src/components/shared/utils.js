// ─────────────────────────────────────────
//  utils.js  — shared helpers
// ─────────────────────────────────────────

export const fmt = (d) => {
  if (!d) return ''
  const dt = new Date(d), now = new Date(), diff = now - dt
  if (diff < 60000)    return 'just now'
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return dt.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

export const timeOnly = (d) =>
  d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''

export const getOther = (chat, uid) =>
  chat.members?.find(m => (m._id || m) !== uid) || {}

export const lastMsgPreview = (last) => {
  if (!last) return 'Start a conversation'
  if (last.isDeleted) return '🚫 Deleted'
  if (last.type === 'image')    return '📷 Photo'
  if (last.type === 'video')    return '🎬 Video'
  if (last.type === 'document') return `📄 ${last.fileName || 'Doc'}`
  if (last.type === 'audio' || last.type === 'voice') return '🎵 Audio'
  if (last.type === 'location') return '📍 Location'
  return (last.content?.slice(0, 40) || '') + (last.content?.length > 40 ? '…' : '')
}

export const BACKEND = 'https://chitchat-backend-production-1f6e.up.railway.app'
