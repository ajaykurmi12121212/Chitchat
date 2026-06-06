// ─────────────────────────────────────────
//  Avatar.jsx  — shared avatar component
// ─────────────────────────────────────────
const GRADS = [
  'linear-gradient(135deg,#6d1b7b,#e91e8c)',
  'linear-gradient(135deg,#1a6b3c,#22c55e)',
  'linear-gradient(135deg,#1565c0,#42a5f5)',
  'linear-gradient(135deg,#0f5132,#20c997)',
  'linear-gradient(135deg,#7c3f00,#ff9800)',
  'linear-gradient(135deg,#1a1a3a,#818cf8)',
]

export const gradFor  = (name = '') => GRADS[name.charCodeAt(0) % GRADS.length]
export const initials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

export default function Avatar({ name = '?', src, size = 44, online, className = '' }) {
  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      {src
        ? <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
        : <div
            className="w-full h-full rounded-full flex items-center justify-center font-extrabold text-white"
            style={{ background: gradFor(name), fontSize: size * 0.32 }}
          >
            {initials(name)}
          </div>
      }
      {online !== undefined && (
        <span
          className={`absolute bottom-0.5 right-0.5 rounded-full border-2 border-[var(--s1)] ${online ? 'bg-green-500' : 'bg-[var(--s3)]'}`}
          style={{ width: size * 0.27, height: size * 0.27 }}
        />
      )}
    </div>
  )
}
