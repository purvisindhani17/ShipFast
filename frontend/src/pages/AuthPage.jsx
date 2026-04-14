import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Truck, Eye, EyeOff, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/AppContext';

const COURIER_COLORS = ['#D3232A','#003087','#FF6B00','#F7A800','#FF4500','#6C00FF','#009A44','#4D148C','#4361ee','#0ea5e9'];

// ── tiny shared inputs ────────────────────────────────────
function Input({ label, type='text', value, onChange, placeholder, autoFocus, suffix }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:12, fontWeight:500, color:'var(--text-muted)', marginBottom:5 }}>{label}</label>
      <div style={{ position:'relative' }}>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} autoFocus={autoFocus}
          className="input-field" style={{ paddingRight: suffix ? 38 : undefined }} />
        {suffix && <div style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)' }}>{suffix}</div>}
      </div>
    </div>
  );
}

// ── Role tab ──────────────────────────────────────────────
function RoleTab({ role, current, setRole }) {
  const active = role === current;
  return (
    <button onClick={() => setRole(role)}
      style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'9px 0',
        fontSize:13, fontWeight:active?600:400, cursor:'pointer', fontFamily:'inherit',
        border:'none', transition:'all .18s',
        background: active ? '#4361ee' : 'transparent',
        color: active ? 'white' : 'var(--text-muted)',
        borderRadius: role==='seller' ? '9px 0 0 9px' : '0 9px 9px 0',
      }}>
      {role === 'seller' ? <Zap size={14} fill={active?'white':'none'} color={active?'white':'var(--text-muted)'}/> : <Truck size={14}/>}
      {role === 'seller' ? 'I\'m a Seller' : 'I\'m a Courier Company'}
    </button>
  );
}

// ── Strength bar ──────────────────────────────────────────
function StrengthBar({ pw }) {
  if (!pw) return null;
  const s = pw.length < 6 ? { lvl:1, label:'Too short', color:'#ef4444' }
    : pw.length < 8       ? { lvl:2, label:'Weak',      color:'#f59e0b' }
    : /[A-Z]/.test(pw) && /\d/.test(pw) ? { lvl:4, label:'Strong', color:'#10b981' }
    : { lvl:3, label:'Good', color:'#4361ee' };
  return (
    <div style={{ marginTop:5 }}>
      <div style={{ display:'flex', gap:3, marginBottom:3 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height:3, flex:1, borderRadius:2, background: i<=s.lvl?s.color:'var(--border)', transition:'background .3s' }}/>)}
      </div>
      <span style={{ fontSize:11, color:s.color }}>{s.label}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const navigate = useNavigate();
  const { loginUser, registerUser, loginCompany, registerCompany } = useAuth();
  const toast = useToast();

  const [role,    setRole]    = useState('seller');  // 'seller' | 'courier'
  const [showPw,  setShowPw]  = useState(false);
  const [err,     setErr]     = useState('');
  const [busy,    setBusy]    = useState(false);

  // Shared fields
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  // Seller-only
  const [name,     setName]     = useState('');
  const [phone,    setPhone]    = useState('');
  const [bizName,  setBizName]  = useState('');
  // Courier-only
  const [coName,   setCoName]   = useState('');
  const [coPhone,  setCoPhone]  = useState('');
  const [coAddr,   setCoAddr]   = useState('');
  const [code,     setCode]     = useState('');
  const [logoColor,setLogoColor]= useState('#4361ee');

  const clear = () => setErr('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      if (isLogin) {
        if (!email || !password) { setErr('Email and password are required.'); return; }
        if (role === 'seller') {
          const d = await loginUser(email, password);
          toast.success(d.message || 'Welcome back!', 'Signed in');
          navigate('/compare');
        } else {
          const d = await loginCompany(email, password);
          toast.success(d.message || 'Welcome back!', 'Signed in');
          navigate('/');
        }
      } else {
        // Register
        if (role === 'seller') {
          if (!name || !email || !password) { setErr('Name, email and password are required.'); return; }
          if (password.length < 6) { setErr('Password must be at least 6 characters.'); return; }
          const d = await registerUser({ name, email, password, phone, company: bizName });
          toast.success('Account created!', 'Welcome to ShipFast');
          navigate('/compare');
        } else {
          if (!coName || !email || !password || !code) { setErr('Company name, email, password and courier code are required.'); return; }
          if (password.length < 6) { setErr('Password must be at least 6 characters.'); return; }
          const d = await registerCompany({ name: coName, email, password, phone: coPhone, address: coAddr, courierCode: code, logoColor });
          toast.success('Company registered!', 'Welcome to ShipFast');
          navigate('/');
        }
      }
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  const page = { minHeight:'100vh', display:'flex', background:'var(--bg-base)', color:'var(--text-primary)' };

  // ── Left branding panel ───────────────────────────────────
  const leftPanel = (
    <div style={{ width:400, flexShrink:0, display:'flex', flexDirection:'column', justifyContent:'flex-start',
    gap:24,  padding:48, borderRight:'1px solid var(--divider)', background:'var(--bg-surface)' }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:'#4361ee', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Zap size={20} color="white" fill="white"/>
        </div>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color:'var(--text-primary)', lineHeight:1 }}>ShipFast</div>
          <div style={{ fontSize:9, color:'var(--text-dim)', marginTop:2, letterSpacing:'.08em', textTransform:'uppercase' }}>
            {role === 'seller' ? 'Rate Aggregator' : 'Courier Portal'}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div>
        {role === 'seller' ? (
          <>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:30, lineHeight:1.25, color:'var(--text-primary)', marginBottom:14 }}>
              Compare rates.<br/>Save money.<br/><span style={{ color:'#4361ee' }}>Ship smarter.</span>
            </div>
            <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.7, marginBottom:24 }}>
              Compare 8 couriers instantly. Real-time delivery tracking. One platform for all your shipments.
            </p>
            {['Compare 8 couriers in &lt;1 second','Real-time booking status updates','Full GST-inclusive breakdown','Analytics on every shipment'].map(t => (
              <div key={t} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:18, height:18, borderRadius:'50%', background:'var(--brand-dim)', border:'1px solid rgba(67,97,238,.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Check size={10} color="#4361ee"/>
                </div>
                <span style={{ fontSize:13, color:'var(--text-muted)' }} dangerouslySetInnerHTML={{__html:t}}/>
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:30, lineHeight:1.25, color:'var(--text-primary)', marginBottom:14 }}>
              Receive bookings.<br/>Dispatch faster.<br/><span style={{ color:'#4361ee' }}>Deliver better.</span>
            </div>
            <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.7, marginBottom:24 }}>
              Get bookings from ShipFast users automatically when they select your courier code. Manage agents and track every delivery.
            </p>
            {['Auto-receive bookings from ShipFast','Assign agents to deliveries','Update status — syncs to customer in real time','Manage your full delivery fleet'].map(t => (
              <div key={t} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:18, height:18, borderRadius:'50%', background:'rgba(16,185,129,.12)', border:'1px solid rgba(16,185,129,.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Check size={10} color="#10b981"/>
                </div>
                <span style={{ fontSize:13, color:'var(--text-muted)' }}>{t}</span>
              </div>
            ))}
          </>
        )}
      </div>

      
    </div>
  );

  // ── Right form panel ──────────────────────────────────────
  return (
    <div style={page}>
      {/* Left — hidden on small screens */}
      <div className="hidden lg:flex lg:flex-col" style={{ width:400, flexShrink:0, flexDirection:'column', justifyContent:'flex-start',gap:40, padding:48, borderRight:'1px solid var(--divider)', background:'var(--bg-surface)' }}>
        {leftPanel.props.children}
      </div>

      {/* Right */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:32, overflowY:'auto' }}>
        <div style={{ width:'100%', maxWidth:420, paddingTop:16, paddingBottom:32 }}>
          {/* Role tabs */}
          <div style={{ display:'flex', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:11, overflow:'hidden', marginBottom:28 }}>
            <RoleTab role="seller"  current={role} setRole={r=>{ setRole(r); clear(); }}/>
            <RoleTab role="courier" current={role} setRole={r=>{ setRole(r); clear(); }}/>
          </div>

          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:22, color:'var(--text-primary)', marginBottom:4 }}>
            {isLogin ? (role==='seller' ? 'Sign in to ShipFast' : 'Sign in to your company') : (role==='seller' ? 'Create your account' : 'Register your company')}
          </h1>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:22 }}>
            {isLogin ? 'Enter your credentials to continue' : 'Free to get started · No credit card needed'}
          </p>

          

          {/* Error */}
          {err && (
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.25)', borderRadius:10, padding:'10px 13px', marginBottom:16 }}>
              <AlertCircle size={14} color="#ef4444" style={{ flexShrink:0 }}/>
              <span style={{ fontSize:13, color:'#ef4444' }}>{err}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>

            {/* ── Seller register ── */}
            {!isLogin && role === 'seller' && (
              <>
                <Input label="Full name *" value={name} onChange={e=>{setName(e.target.value);clear();}} placeholder="Rajesh Kumar" autoFocus/>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <Input label="Company / shop name" value={bizName} onChange={e=>setBizName(e.target.value)} placeholder="Optional"/>
                  <Input label="Phone" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Optional"/>
                </div>
              </>
            )}

            {/* ── Courier register ── */}
            {!isLogin && role === 'courier' && (
              <>
                <Input label="Company name *" value={coName} onChange={e=>{setCoName(e.target.value);clear();}} placeholder="FastWing Logistics" autoFocus/>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <Input label="Phone" value={coPhone} onChange={e=>setCoPhone(e.target.value)} placeholder="9876543210"/>
                  <Input label="City / Address" value={coAddr} onChange={e=>setCoAddr(e.target.value)} placeholder="Mumbai"/>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:500, color:'var(--text-muted)', marginBottom:5 }}>
                    Courier code * <span style={{ color:'var(--text-dim)', fontWeight:400 }}>— must match ShipFast rate engine (e.g. DLV, XPB, DTDC)</span>
                  </label>
                  <input value={code} onChange={e=>{setCode(e.target.value.toUpperCase());clear();}} placeholder="DLV" maxLength={6}
                    className="input-field" style={{ textTransform:'uppercase', fontFamily:'monospace', letterSpacing:'.05em' }}/>
                  <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:4 }}>Valid codes: DLV · BDT · DTDC · EKT · XPB · SRT · ECX · FDX</p>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:500, color:'var(--text-muted)', marginBottom:6 }}>Brand colour</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                    {COURIER_COLORS.map(c => (
                      <div key={c} onClick={()=>setLogoColor(c)}
                        style={{ width:26, height:26, borderRadius:'50%', background:c, cursor:'pointer',
                          outline: logoColor===c ? `3px solid ${c}` : '3px solid transparent',
                          outlineOffset:2, transition:'outline .15s' }}/>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Shared: email + password */}
            <Input label="Email address *" type="email" value={email}
              onChange={e=>{setEmail(e.target.value);clear();}} placeholder={role==='seller'?'you@example.com':'ops@company.com'}
              autoFocus={isLogin}/>

            <div>
              <Input label="Password *" type={showPw?'text':'password'} value={password}
                onChange={e=>{setPassword(e.target.value);clear();}} placeholder="••••••••"
                suffix={
                  <button type="button" onClick={()=>setShowPw(p=>!p)}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)', display:'flex', padding:0 }}>
                    {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                }/>
              {!isLogin && <StrengthBar pw={password}/>}
            </div>

            <button type="submit" disabled={busy}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px 0', marginTop:4,
                background:'#4361ee', color:'white', border:'none', borderRadius:11, fontSize:14, fontWeight:600,
                cursor:busy?'not-allowed':'pointer', opacity:busy?.7:1, transition:'opacity .2s', fontFamily:'inherit', width:'100%' }}>
              {busy
                ? <><div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin .8s linear infinite' }}/>{isLogin?'Signing in…':'Creating…'}</>
                : <><ArrowRight size={16}/>{isLogin?(role==='seller'?'Sign in':'Sign in as company'):(role==='seller'?'Create account':'Register company')}</>}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:13, color:'var(--text-dim)', marginTop:22 }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Link to={isLogin?'/register':'/login'} style={{ color:'#4361ee', fontWeight:500, textDecoration:'none' }}>
              {isLogin ? 'Create one' : 'Sign in'}
            </Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
