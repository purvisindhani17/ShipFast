import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/AppContext';
import { Eye, EyeOff, Zap, AlertCircle, ArrowRight, Check } from 'lucide-react';

const PERKS = [
  'Compare 8 couriers in under 1 second',
  'Auto zone & volumetric weight detection',
  'Full GST-inclusive price breakdown',
  'Shipment history saved to your account',
];

export default function RegisterPage() {
  const { register } = useAuth();
  const toast        = useToast();
  const navigate     = useNavigate();

  const [form, setForm]       = useState({ name:'', email:'', password:'', company:'', phone:'' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => { setForm(p => ({ ...p, [k]: e.target.value })); setError(''); };

  const strength = !form.password ? null
    : form.password.length < 6 ? { lvl:1, label:'Too short', color:'#ef4444' }
    : form.password.length < 8 ? { lvl:2, label:'Weak',      color:'#f59e0b' }
    : /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) ? { lvl:4, label:'Strong', color:'#10b981' }
    : { lvl:3, label:'Good', color:'#4361ee' };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError('Name, email and password are required.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    try {
      await register(form);
      toast.success('Account created! Welcome to ShipFast.', 'Registered');
      navigate('/compare');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const page  = { minHeight:'100vh', display:'flex', background:'var(--bg-base)', color:'var(--text-primary)' };
  const left  = { display:'flex', flexDirection:'column', justifyContent:'space-between', padding:48, borderRight:'1px solid var(--divider)', background:'var(--bg-surface)', width:380, flexShrink:0 };
  const right = { flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:32, overflowY:'auto' };

  return (
    <div style={page}>
      {/* Left */}
      <div style={left} className="hidden lg:flex">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:11, background:'#4361ee', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Zap style={{ width:20, height:20, color:'white' }} fill="currentColor" />
          </div>
          <div>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color:'var(--text-primary)', lineHeight:1 }}>ShipFast</div>
            <div style={{ fontSize:9, color:'var(--text-dim)', marginTop:2, letterSpacing:'.08em', textTransform:'uppercase' }}>Rate Aggregator</div>
          </div>
        </div>

        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:28, lineHeight:1.3, color:'var(--text-primary)', marginBottom:14 }}>
            Start saving on<br/>every shipment,<br/><span style={{ color:'#4361ee' }}>from day one.</span>
          </div>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:24 }}>Free to get started. No credit card required.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {PERKS.map(p => (
              <div key={p} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                <div style={{ width:20, height:20, borderRadius:'50%', background:'rgba(67,97,238,.15)', border:'1px solid rgba(67,97,238,.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Check style={{ width:11, height:11, color:'#4361ee' }} />
                </div>
                <span style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.5 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:16, display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ textAlign:'center', flexShrink:0 }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:22, color:'#10b981' }}>₹38</div>
            <div style={{ fontSize:10, color:'var(--text-dim)' }}>avg saved</div>
          </div>
          <div style={{ width:1, height:36, background:'var(--divider)' }} />
          <p style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6 }}>per shipment on average vs manually picking a courier without comparison.</p>
        </div>
      </div>

      {/* Right */}
      <div style={right}>
        <div style={{ width:'100%', maxWidth:400, padding:'32px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:28 }} className="lg:hidden">
            <div style={{ width:30, height:30, borderRadius:8, background:'#4361ee', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Zap style={{ width:15, height:15, color:'white' }} fill="currentColor" />
            </div>
            <span style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:16, color:'var(--text-primary)' }}>ShipFast</span>
          </div>

          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:24, color:'var(--text-primary)', marginBottom:6 }}>Create your account</h1>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:24 }}>Free forever. No credit card needed.</p>

          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.25)', borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
              <AlertCircle style={{ width:15, height:15, color:'#ef4444', flexShrink:0 }} />
              <span style={{ fontSize:13, color:'#ef4444' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:500, color:'var(--text-muted)', display:'block', marginBottom:6 }}>Full name *</label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="Rajesh Kumar"
                autoComplete="name" autoFocus className="input-field" />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:500, color:'var(--text-muted)', display:'block', marginBottom:6 }}>Email address *</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@company.com"
                autoComplete="email" className="input-field" />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:500, color:'var(--text-muted)', display:'block', marginBottom:6 }}>Password *</label>
              <div style={{ position:'relative' }}>
                <input type={showPass?'text':'password'} value={form.password} onChange={set('password')}
                  placeholder="Min. 6 characters" autoComplete="new-password" className="input-field" style={{ paddingRight:38 }} />
                <button type="button" onClick={()=>setShowPass(p=>!p)}
                  style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)', display:'flex' }}>
                  {showPass ? <EyeOff style={{ width:15, height:15 }} /> : <Eye style={{ width:15, height:15 }} />}
                </button>
              </div>
              {strength && (
                <div style={{ marginTop:6 }}>
                  <div style={{ display:'flex', gap:3, marginBottom:3 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ height:3, flex:1, borderRadius:2, transition:'background .3s', background: i<=strength.lvl?strength.color:'var(--border)' }} />
                    ))}
                  </div>
                  <span style={{ fontSize:11, color:strength.color }}>{strength.label}</span>
                </div>
              )}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:500, color:'var(--text-muted)', display:'block', marginBottom:6 }}>Company</label>
                <input type="text" value={form.company} onChange={set('company')} placeholder="Optional" className="input-field" />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:500, color:'var(--text-muted)', display:'block', marginBottom:6 }}>Phone</label>
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="Optional" className="input-field" />
              </div>
            </div>
            <p style={{ fontSize:11, color:'var(--text-dim)', lineHeight:1.5 }}>
              By creating an account you agree to our Terms of Service and Privacy Policy.
            </p>
            <button type="submit" disabled={loading}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px 0', background:'#4361ee', color:'white', border:'none', borderRadius:11, fontSize:14, fontWeight:600, cursor:loading?'not-allowed':'pointer', opacity:loading?.7:1, transition:'opacity .2s' }}>
              {loading
                ? <><div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin .8s linear infinite' }} /> Creating account…</>
                : <><ArrowRight style={{ width:16, height:16 }} /> Create free account</>}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:13, color:'var(--text-dim)', marginTop:24 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'#4361ee', fontWeight:500, textDecoration:'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
