import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { auth } from '../firebase'
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'

const S = {
  page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'var(--bg)', transition:'background .25s' },
  card: { background:'var(--s1)', border:'.5px solid var(--border)', borderRadius:22, width:'100%', maxWidth:400, overflow:'hidden', boxShadow:'var(--shadow)' },
  top:  { padding:'32px 30px 26px', borderBottom:'.5px solid var(--border)' },
  body: { padding:'28px 30px 32px' },
  label:{ display:'block', fontSize:11, fontWeight:700, color:'var(--muted2)', letterSpacing:'.8px', textTransform:'uppercase', marginBottom:7 },
  inp:  { width:'100%', border:'.5px solid var(--border)', borderRadius:11, background:'var(--inp)', padding:'12px 14px', fontSize:14, color:'var(--text)', outline:'none', fontFamily:'inherit', transition:'border-color .15s' },
  pWrap:{ display:'flex', border:'.5px solid var(--border)', borderRadius:11, overflow:'hidden', background:'var(--inp)' },
  cc:   { display:'flex', alignItems:'center', gap:6, padding:'0 13px', borderRight:'.5px solid var(--border)', fontSize:13, fontWeight:700, color:'var(--muted)', whiteSpace:'nowrap', flexShrink:0 },
  pIn:  { flex:1, border:'none', background:'transparent', padding:'13px 13px', fontSize:15, color:'var(--text)', outline:'none', fontFamily:'inherit', letterSpacing:'.5px' },
  btn:  { width:'100%', padding:'13px', borderRadius:12, border:'none', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all .15s' },
  btnA: { background:'linear-gradient(135deg,#16a34a,#22c55e)', color:'#fff', boxShadow:'0 6px 20px rgba(34,197,94,.25)' },
  btnD: { background:'var(--s2)', color:'var(--muted2)', cursor:'not-allowed' },
  err:  { background:'rgba(239,68,68,.08)', border:'.5px solid rgba(239,68,68,.2)', borderRadius:10, padding:'10px 13px', fontSize:13, color:'#f87171', display:'flex', alignItems:'center', gap:8, marginBottom:16 },
  oBox: { width:48, height:56, border:'.5px solid var(--border)', borderRadius:11, fontSize:22, fontWeight:700, textAlign:'center', color:'var(--text)', background:'var(--inp)', outline:'none', fontFamily:'inherit', transition:'all .15s' },
}

function Spin() {
  return <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.25)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .6s linear infinite', flexShrink:0 }}/>
}

export default function AuthPage() {
  const { phoneLogin } = useAuth()
  const { theme, toggle } = useTheme()
  const [screen,       setScreen]       = useState('phone')
  const [name,         setName]         = useState('')
  const [phone,        setPhone]        = useState('')
  const [otp,          setOtp]          = useState(['','','','','',''])
  const [timer,        setTimer]        = useState(0)
  const [load,         setLoad]         = useState(false)
  const [error,        setError]        = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const timerRef = useRef(null)
  const boxRefs  = useRef([])

  useEffect(() => () => clearInterval(timerRef.current), [])

  const startTimer = () => {
    clearInterval(timerRef.current)
    setTimer(30)
    timerRef.current = setInterval(() =>
      setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0 } return t - 1 }), 1000)
  }

  const setupRecaptcha = () => {
  // Pehle purana destroy karo
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear()
    } catch(e) {}
    window.recaptchaVerifier = null
  }
  
  window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
    callback: () => {},
  })
  return window.recaptchaVerifier
}

  const sendOTP = async (e) => {
    e?.preventDefault()
    if (!name.trim()) return setError('Please enter your name')
    if (phone.length !== 10) return setError('Enter valid 10-digit number')
    setError(''); setLoad(true)
    try {
      const verifier = setupRecaptcha()
      const result   = await signInWithPhoneNumber(auth, `+91${phone}`, verifier)
      setConfirmation(result)
      setScreen('otp')
      startTimer()
      setTimeout(() => boxRefs.current[0]?.focus(), 100)
    } catch (err) {
      console.error(err)
      window.recaptchaVerifier = null
      setError(err.message || 'OTP bhejne mein error. Dobara try karo.')
    } finally {
      setLoad(false)
    }
  }

  const verifyOTP = async () => {
    const code = otp.join('')
    if (code.length !== 6 || !confirmation) return
    setError(''); setLoad(true)
    try {
      await confirmation.confirm(code)
      await phoneLogin(phone, name)
      setScreen('success')
    } catch (err) {
      setError('Galat OTP. Dobara try karo.')
      setOtp(['','','','','',''])
      setTimeout(() => boxRefs.current[0]?.focus(), 100)
    } finally {
      setLoad(false)
    }
  }

  const handleOtp = (val, i) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[i] = val; setOtp(next)
    if (val && i < 5) boxRefs.current[i+1]?.focus()
    if (next.every(d => d)) setTimeout(verifyOTP, 80)
  }

  const handleKey = (e, i) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      boxRefs.current[i-1]?.focus()
      const next = [...otp]; next[i-1] = ''; setOtp(next)
    }
  }

  const handlePaste = (e) => {
    const d = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6)
    if (d.length === 6) { setOtp(d.split('')); setTimeout(verifyOTP, 80) }
    e.preventDefault()
  }

  const isDark = theme === 'dark'

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fade { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        .fade { animation: fade .25s ease }
        input:focus { border-color: rgba(34,197,94,.5) !important; }
        .otp-inp:focus { border-color:#22c55e !important; box-shadow:0 0 0 3px rgba(34,197,94,.15) !important; background:rgba(34,197,94,.06) !important; }
        .hover-btn:hover { background:var(--hover) !important; color:var(--text) !important; }
      `}</style>

      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container" />

      {/* Theme toggle */}
      <button onClick={toggle} className="hover-btn" style={{ position:'fixed', top:18, right:18, width:40, height:40, borderRadius:12, background:'var(--s1)', border:'.5px solid var(--border)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', transition:'all .2s', zIndex:99 }}>
        {isDark ? '☀️' : '🌙'}
      </button>

      <div style={S.card}>

        {/* ── PHONE SCREEN ── */}
        {screen === 'phone' && (
          <div className="fade">
            <div style={S.top}>
              <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:26 }}>
                <div style={{ width:40, height:40, borderRadius:11, background:'linear-gradient(135deg,#16a34a,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, boxShadow:'0 5px 14px rgba(34,197,94,.28)', flexShrink:0 }}>💬</div>
                <div>
                  <div style={{ fontSize:18, fontWeight:800, letterSpacing:'-.5px', color:'var(--text)' }}>Chit<span style={{ color:'#22c55e' }}>Chat</span></div>
                  <div style={{ fontSize:11, color:'var(--muted2)', fontWeight:600 }}>Simple · Reliable · Private</div>
                </div>
              </div>
              <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text)', letterSpacing:'-.5px', marginBottom:7 }}>Enter your number</h1>
              <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.6 }}>We'll send a one-time code to verify your identity.</p>
            </div>

            <div style={S.body}>
              <form onSubmit={sendOTP} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div>
                  <label style={S.label}>Your Name</label>
                  <input value={name} onChange={e => { setName(e.target.value); setError('') }}
                    placeholder="Rahul Sharma" autoFocus style={S.inp}/>
                </div>
                <div>
                  <label style={S.label}>Mobile Number</label>
                  <div style={{ ...S.pWrap, ...(phone.length===10 ? { borderColor:'rgba(34,197,94,.4)' } : {}) }}>
                    <div style={S.cc}>🇮🇳 +91</div>
                    <input type="tel" inputMode="numeric" maxLength={10}
                      value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g,'').slice(0,10)); setError('') }}
                      placeholder="98765 43210" style={S.pIn}/>
                    {phone.length===10 && <div style={{ display:'flex', alignItems:'center', paddingRight:13, color:'#22c55e', fontSize:18 }}>✓</div>}
                  </div>
                </div>

                {error && <div style={S.err}><span>⚠</span>{error}</div>}

                <button type="submit" disabled={load || phone.length!==10 || !name.trim()}
                  style={{ ...S.btn, ...(load || phone.length!==10 || !name.trim() ? S.btnD : S.btnA) }}>
                  {load ? <><Spin/>Sending OTP...</> : 'Get OTP →'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── OTP SCREEN ── */}
        {screen === 'otp' && (
          <div className="fade">
            <div style={S.top}>
              <button onClick={() => {
                setScreen('phone')
                setOtp(['','','','','',''])
                setError('')
                clearInterval(timerRef.current)
                setConfirmation(null)
                window.recaptchaVerifier = null
              }}
                style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:'var(--muted)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', marginBottom:22, padding:0, fontWeight:600 }}>
                ← Change Number
              </button>
              <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text)', letterSpacing:'-.5px', marginBottom:7 }}>Verify OTP</h1>
              <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.6 }}>
                Code sent to <strong style={{ color:'var(--text)' }}>+91 {phone.slice(0,5)} {phone.slice(5)}</strong>
              </p>
            </div>

            <div style={S.body}>
              <div style={{ display:'flex', gap:9, justifyContent:'center', marginBottom:22 }} onPaste={handlePaste}>
                {otp.map((d, i) => (
                  <input key={i} ref={el => boxRefs.current[i] = el}
                    type="text" inputMode="numeric" maxLength={1} value={d}
                    onChange={e => handleOtp(e.target.value, i)} onKeyDown={e => handleKey(e, i)}
                    className="otp-inp"
                    style={{ ...S.oBox, ...(d ? { borderColor:'#22c55e', background:'rgba(34,197,94,.06)' } : {}) }}/>
                ))}
              </div>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <span style={{ fontSize:13, color:'var(--muted)', fontWeight:500 }}>Didn't receive it?</span>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <button onClick={sendOTP} disabled={timer > 0}
                    style={{ fontSize:13, fontWeight:700, color: timer > 0 ? 'var(--muted2)' : '#22c55e', background:'none', border:'none', cursor: timer > 0 ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
                    Resend OTP
                  </button>
                  {timer > 0 && <span style={{ fontSize:13, fontWeight:700, color:'var(--muted2)' }}>0:{String(timer).padStart(2,'0')}</span>}
                </div>
              </div>

              {error && <div style={S.err}><span>⚠</span>{error}</div>}

              <button onClick={verifyOTP} disabled={load || otp.some(d => !d)}
                style={{ ...S.btn, ...(load || otp.some(d => !d) ? S.btnD : S.btnA) }}>
                {load ? <><Spin/>Verifying...</> : 'Verify & Continue ✓'}
              </button>
            </div>
          </div>
        )}

        {/* ── SUCCESS SCREEN ── */}
        {screen === 'success' && (
          <div className="fade" style={S.body}>
            <div style={{ textAlign:'center', padding:'16px 0' }}>
              <div style={{ width:68, height:68, borderRadius:'50%', background:'rgba(34,197,94,.1)', border:'.5px solid rgba(34,197,94,.25)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', fontSize:32 }}>✓</div>
              <h2 style={{ fontSize:21, fontWeight:800, color:'var(--text)', marginBottom:7 }}>Welcome, {name}! 👋</h2>
              <p style={{ fontSize:14, color:'var(--muted)', marginBottom:24 }}>Verified. Setting up your account...</p>
              <div style={{ width:28, height:28, border:'2.5px solid rgba(34,197,94,.2)', borderTopColor:'#22c55e', borderRadius:'50%', animation:'spin .7s linear infinite', margin:'0 auto' }}/>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
