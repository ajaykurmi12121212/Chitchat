import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

function Spinner() {
  return (
    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
  )
}

export default function LoginPage() {
  const { sendOTP, verifyOTP } = useAuth()
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  const [screen, setScreen] = useState('phone')
  const [name,   setName]   = useState('')
  const [phone,  setPhone]  = useState('')
  const [otp,    setOtp]    = useState(['', '', '', '', '', ''])
  const [timer,  setTimer]  = useState(0)
  const [load,   setLoad]   = useState(false)
  const [error,  setError]  = useState('')

  const timerRef = useRef(null)
  const boxRefs  = useRef([])

  useEffect(() => () => clearInterval(timerRef.current), [])

  const startTimer = () => {
    clearInterval(timerRef.current)
    setTimer(30)
    timerRef.current = setInterval(() =>
      setTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0 }
        return t - 1
      }), 1000)
  }

  const handleSendOTP = async (e) => {
    e?.preventDefault()
    if (!name.trim()) return setError('Please enter your name')
    if (phone.length !== 10) return setError('Enter valid 10-digit number')
    setError('')
    setLoad(true)
    try {
      await sendOTP(phone)
      setScreen('otp')
      startTimer()
      setTimeout(() => boxRefs.current[0]?.focus(), 100)
    } catch (err) {
      setError(err.response?.data?.message || 'OTP bhejne mein error. Dobara try karo.')
    } finally {
      setLoad(false)
    }
  }

  const handleVerifyOTP = async () => {
    const code = otp.join('')
    if (code.length !== 6) return
    setError('')
    setLoad(true)
    try {
      await verifyOTP(phone, code, name)
      setScreen('success')
    } catch (err) {
      setError(err.response?.data?.message || 'Galat OTP. Dobara try karo.')
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => boxRefs.current[0]?.focus(), 100)
    } finally {
      setLoad(false)
    }
  }

  const handleOtpChange = (val, i) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) boxRefs.current[i + 1]?.focus()
    if (next.every(d => d)) setTimeout(handleVerifyOTP, 80)
  }

  const handleOtpKey = (e, i) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      boxRefs.current[i - 1]?.focus()
      const next = [...otp]
      next[i - 1] = ''
      setOtp(next)
    }
  }

  const handlePaste = (e) => {
    const d = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (d.length === 6) {
      setOtp(d.split(''))
      setTimeout(handleVerifyOTP, 80)
    }
    e.preventDefault()
  }

  const goBack = () => {
    setScreen('phone')
    setOtp(['', '', '', '', '', ''])
    setError('')
    clearInterval(timerRef.current)
    setTimer(0)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-[var(--bg)] transition-colors duration-300">

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        .fade-up { animation: fadeUp 0.25s ease forwards }
      `}</style>

      {/* Theme Toggle */}
      <button
        onClick={toggle}
        className="fixed top-4 right-4 w-10 h-10 rounded-xl bg-[var(--s1)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:bg-[var(--hover)] transition-all z-50"
      >
        {isDark ? '☀️' : '🌙'}
      </button>

      {/* Card */}
      <div className="w-full max-w-sm bg-[var(--s1)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-[var(--shadow)]">

        {/* ── PHONE SCREEN ── */}
        {screen === 'phone' && (
          <div className="fade-up">
            {/* Header */}
            <div className="px-7 pt-8 pb-6 border-b border-[var(--border)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-700 to-green-500 flex items-center justify-center text-xl shadow-lg shadow-green-500/25 flex-shrink-0">
                  💬
                </div>
                <div>
                  <div className="text-lg font-black tracking-tight text-[var(--text)]">
                    Chit<span className="text-green-500">Chat</span>
                  </div>
                  <div className="text-[10px] font-semibold text-[var(--muted2)] tracking-wide">
                    Simple · Reliable · Private
                  </div>
                </div>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-[var(--text)] mb-2">
                Enter your number
              </h1>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                We'll send a one-time code to verify your identity.
              </p>
            </div>

            {/* Body */}
            <div className="px-7 py-7">
              <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-bold text-[var(--muted2)] uppercase tracking-[0.8px] mb-1.5">
                    Your Name
                  </label>
                  <input
                    value={name}
                    onChange={e => { setName(e.target.value); setError('') }}
                    placeholder="Rahul Sharma"
                    autoFocus
                    className="w-full bg-[var(--inp)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--muted2)] outline-none focus:border-green-500/50 transition-colors"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-bold text-[var(--muted2)] uppercase tracking-[0.8px] mb-1.5">
                    Mobile Number
                  </label>
                  <div className={`flex border rounded-xl overflow-hidden bg-[var(--inp)] transition-colors ${phone.length === 10 ? 'border-green-500/40' : 'border-[var(--border)]'}`}>
                    <div className="flex items-center gap-1.5 px-3 border-r border-[var(--border)] text-sm font-bold text-[var(--muted)] whitespace-nowrap flex-shrink-0">
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
                      placeholder="98765 43210"
                      className="flex-1 bg-transparent border-none outline-none px-3 py-3 text-[15px] text-[var(--text)] placeholder-[var(--muted2)] tracking-wide"
                    />
                    {phone.length === 10 && (
                      <div className="flex items-center pr-3 text-green-500 text-lg">✓</div>
                    )}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2.5 text-sm text-red-400">
                    <span>⚠</span><span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={load || phone.length !== 10 || !name.trim()}
                  className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    load || phone.length !== 10 || !name.trim()
                      ? 'bg-[var(--s2)] text-[var(--muted2)] cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-700 to-green-500 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-[1.01] active:scale-[0.99]'
                  }`}
                >
                  {load ? <><Spinner />Sending OTP...</> : 'Get OTP →'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── OTP SCREEN ── */}
        {screen === 'otp' && (
          <div className="fade-up">
            {/* Header */}
            <div className="px-7 pt-7 pb-6 border-b border-[var(--border)]">
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 text-sm text-[var(--muted)] font-semibold bg-none border-none cursor-pointer mb-5 hover:text-[var(--text)] transition-colors"
              >
                ← Change Number
              </button>
              <h1 className="text-2xl font-black tracking-tight text-[var(--text)] mb-2">
                Verify OTP
              </h1>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Code sent to{' '}
                <strong className="text-[var(--text)]">
                  +91 {phone.slice(0, 5)} {phone.slice(5)}
                </strong>
              </p>
            </div>

            {/* Body */}
            <div className="px-7 py-7">
              {/* OTP Boxes */}
              <div
                className="flex gap-2.5 justify-center mb-6"
                onPaste={handlePaste}
              >
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={el => boxRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleOtpChange(e.target.value, i)}
                    onKeyDown={e => handleOtpKey(e, i)}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-xl border outline-none transition-all text-[var(--text)] bg-[var(--inp)]
                      ${d
                        ? 'border-green-500 bg-green-500/5 shadow-sm shadow-green-500/20'
                        : 'border-[var(--border)] focus:border-green-500/50 focus:shadow-sm focus:shadow-green-500/15'
                      }`}
                  />
                ))}
              </div>

              {/* Resend */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-sm text-[var(--muted)] font-medium">Didn't receive it?</span>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleSendOTP}
                    disabled={timer > 0}
                    className={`text-sm font-bold transition-colors ${
                      timer > 0
                        ? 'text-[var(--muted2)] cursor-not-allowed'
                        : 'text-green-500 hover:text-green-400 cursor-pointer'
                    }`}
                  >
                    Resend OTP
                  </button>
                  {timer > 0 && (
                    <span className="text-sm font-bold text-[var(--muted2)]">
                      0:{String(timer).padStart(2, '0')}
                    </span>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2.5 text-sm text-red-400 mb-4">
                  <span>⚠</span><span>{error}</span>
                </div>
              )}

              {/* Verify Button */}
              <button
                onClick={handleVerifyOTP}
                disabled={load || otp.some(d => !d)}
                className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  load || otp.some(d => !d)
                    ? 'bg-[var(--s2)] text-[var(--muted2)] cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-700 to-green-500 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                {load ? <><Spinner />Verifying...</> : 'Verify & Continue ✓'}
              </button>
            </div>
          </div>
        )}

        {/* ── SUCCESS SCREEN ── */}
        {screen === 'success' && (
          <div className="fade-up px-7 py-10">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center mx-auto mb-5 text-3xl">
                ✓
              </div>
              <h2 className="text-xl font-black text-[var(--text)] mb-2">
                Welcome, {name}! 👋
              </h2>
              <p className="text-sm text-[var(--muted)] mb-6">
                Verified. Setting up your account...
              </p>
              <div className="w-7 h-7 border-[2.5px] border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
