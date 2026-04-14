import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/AppContext';
import { Eye, EyeOff, Zap, AlertCircle, ArrowRight, Package, BarChart3, Clock } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const toast      = useToast();
  const navigate   = useNavigate();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => { setForm(p => ({ ...p, [k]: e.target.value })); setError(''); };
  const fillDemo = () => setForm({ email: 'demo@shipfast.com', password: 'demo123' });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true); setError('');
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!', 'Signed in');
      navigate('/compare');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const page = { minHeight:'100vh', display:'flex', background:'var(--bg-base)', color:'var(--text-primary)' };
  const left = { display:'flex', flexDirection:'column', justifyContent:'space-between', padding:48, borderRight:'1px solid var(--divider)', background:'var(--bg-surface)', width:420, flexShrink:0 };
  const right = { flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:32 };

  return (
    <div style={page}>
      {/* Left branding panel */}
      <div style={left} className="hidden lg:flex" >
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:11, background:'#4361ee', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Zap style={{ width:20, height:20, color:'white' }} fill="currentColor" />
          </div>
          <div>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color:'var(--text-primary)', lineHeight:1 }}>ShipFast</div>
            <div style={{ fontSize:9, color:'var(--text-dim)', marginTop:2, letterSpacing:'.08em', textTransform:'uppercase' }}>Rate Aggregator</div>
          </div>
        </div>

        {/* Hero */}
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:32, lineHeight:1.25, color:'var(--text-primary)', marginBottom:14 }}>
            Stop wasting time<br/>comparing rates<br/><span style={{ color:'#4361ee' }}>manually.</span>
          </div>
          <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.7, maxWidth:300 }}>
            Compare rates across 8 major couriers in under a second. Save up to ₹48,000 a year on shipping.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:28 }}>
            {[
              { Icon:Package,    val:'8',     label:'Couriers'      },
              { Icon:Clock,      val:'< 1s',  label:'Comparison'    },
              { Icon:BarChart3,  val:'₹48K',  label:'Avg saving/yr' },
            ].map(({ Icon, val, label }) => (
              <div key={label} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 10px', textAlign:'center' }}>
                <Icon style={{ width:16, height:16, color:'#4361ee', margin:'0 auto 6px' }} />
                <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:16, color:'var(--text-primary)' }}>{val}</div>
                <div style={{ fontSize:10, color:'var(--text-dim)', marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:18 }}>
          <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.65, fontStyle:'italic' }}>
            "ShipFast saves our team 45 minutes every single day. We always book at the cheapest rate now."
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:12 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(67,97,238,.15)', border:'1px solid rgba(67,97,238,.25)', display:'flex', alignItems:'center', justifyContent:'center', color:'#4361ee', fontWeight:700, fontSize:12 }}>R</div>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>Rajesh Gupta</div>
              <div style={{ fontSize:11, color:'var(--text-dim)' }}>Operations Head, Mumbai Textiles</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={right}>
        <div style={{ width:'100%', maxWidth:400 }}>
          {/* Mobile logo */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:32 }} className="lg:hidden">
            <div style={{ width:32, height:32, borderRadius:9, background:'#4361ee', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Zap style={{ width:16, height:16, color:'white' }} fill="currentColor" />
            </div>
            <span style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:17, color:'var(--text-primary)' }}>ShipFast</span>
          </div>

          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:24, color:'var(--text-primary)', marginBottom:6 }}>Welcome back</h1>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:24 }}>Sign in to your account to continue</p>

          {/* Demo shortcut */}
          <button onClick={fillDemo} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, cursor:'pointer', marginBottom:20, transition:'border-color .2s' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(67,97,238,.4)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
            <div style={{ textAlign:'left' }}>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--text-secondary)' }}>Try the demo account</div>
              <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>demo@shipfast.com · demo123</div>
            </div>
            <ArrowRight style={{ width:15, height:15, color:'var(--text-dim)' }} />
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <div style={{ flex:1, height:1, background:'var(--divider)' }} />
            <span style={{ fontSize:11, color:'var(--text-dim)' }}>or continue with email</span>
            <div style={{ flex:1, height:1, background:'var(--divider)' }} />
          </div>

          {/* Error */}
          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.25)', borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
              <AlertCircle style={{ width:15, height:15, color:'#ef4444', flexShrink:0 }} />
              <span style={{ fontSize:13, color:'#ef4444' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:500, color:'var(--text-muted)', display:'block', marginBottom:6 }}>Email address</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@company.com"
                autoComplete="email" autoFocus className="input-field" />
            </div>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <label style={{ fontSize:12, fontWeight:500, color:'var(--text-muted)' }}>Password</label>
              </div>
              <div style={{ position:'relative' }}>
                <input type={showPass?'text':'password'} value={form.password} onChange={set('password')} placeholder="••••••••"
                  autoComplete="current-password" className="input-field" style={{ paddingRight:38 }} />
                <button type="button" onClick={()=>setShowPass(p=>!p)}
                  style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)', display:'flex' }}>
                  {showPass ? <EyeOff style={{ width:15, height:15 }} /> : <Eye style={{ width:15, height:15 }} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px 0', background:'#4361ee', color:'white', border:'none', borderRadius:11, fontSize:14, fontWeight:600, cursor:loading?'not-allowed':'pointer', opacity:loading?.7:1, transition:'opacity .2s', marginTop:4 }}>
              {loading
                ? <><div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin .8s linear infinite' }} /> Signing in…</>
                : <><ArrowRight style={{ width:16, height:16 }} /> Sign in</>}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:13, color:'var(--text-dim)', marginTop:24 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'#4361ee', fontWeight:500, textDecoration:'none' }}>Create one free</Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
