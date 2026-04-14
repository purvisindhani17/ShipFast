import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme, useToast } from '../context/AppContext';
import {
  Sun, Moon, User, Bell, Database, Shield, Save,
  Eye, EyeOff, Check, Copy, ExternalLink, ChevronRight,
} from 'lucide-react';

/* ── tiny reusable pieces ────────────────────────────── */
function Section({ title, icon: Icon, children }) {
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'20px 24px', marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, paddingBottom:14, borderBottom:'1px solid var(--divider)' }}>
        <div style={{ width:32, height:32, borderRadius:9, background:'var(--brand-dim)', border:'1px solid rgba(67,97,238,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon style={{ width:15, height:15, color:'#4361ee' }} />
        </div>
        <span style={{ fontFamily:'Syne,sans-serif', fontWeight:600, fontSize:15, color:'var(--text-primary)' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:500, color:'var(--text-muted)', marginBottom:6 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:4 }}>{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type='text', suffix }) {
  return (
    <div style={{ position:'relative' }}>
      <input value={value} onChange={onChange} placeholder={placeholder} type={type}
        className="input-field" style={{ paddingRight: suffix ? 38 : undefined }} />
      {suffix && (
        <div style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)' }}>{suffix}</div>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label, desc }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--divider)' }}>
      <div>
        <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{label}</div>
        {desc && <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>{desc}</div>}
      </div>
      <div onClick={onChange} style={{ width:40, height:22, borderRadius:11, background:checked?'#4361ee':'var(--border)', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0, marginLeft:16 }}>
        <div style={{ position:'absolute', top:3, left:checked?21:3, width:16, height:16, borderRadius:'50%', background:'white', transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.25)' }} />
      </div>
    </div>
  );
}

function SaveBtn({ onClick, loading: spin, label='Save Changes', icon: Icon=Save }) {
  return (
    <button onClick={onClick} disabled={spin}
      style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', background:'#4361ee', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:spin?'not-allowed':'pointer', opacity:spin?.7:1, transition:'opacity .2s', marginTop:4 }}>
      {spin
        ? <><div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin .8s linear infinite' }} /> Saving…</>
        : <><Icon style={{ width:14, height:14 }} />{label}</>}
    </button>
  );
}

/* ── Main component ─────────────────────────────────── */
export default function SettingsPage() {
  const { user, updateProfile, changePassword } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const toast = useToast();

  /* profile */
  const [profile, setProfile] = useState({ name: user?.name||'', email: user?.email||'', company: user?.company||'', phone: user?.phone||'', defaultOriginPincode: user?.defaultOriginPincode||'' });
  const [savingProfile, setSavingProfile] = useState(false);

  /* password */
  const [pw, setPw] = useState({ current:'', next:'', confirm:'' });
  const [showPw, setShowPw] = useState({});
  const [savingPw, setSavingPw] = useState(false);

  /* notifications (local prefs only) */
  const [notifs, setNotifs] = useState({
    bookingConfirm: JSON.parse(localStorage.getItem('sf_notif_booking')||'true'),
    savingsReport:  JSON.parse(localStorage.getItem('sf_notif_savings')||'true'),
    priceAlerts:    JSON.parse(localStorage.getItem('sf_notif_alerts')||'false'),
  });

  const sp = (k) => (v) => setProfile(p => ({ ...p, [k]: v }));

  /* ── handlers ── */
  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      await updateProfile({ name: profile.name, company: profile.company, phone: profile.phone, defaultOriginPincode: profile.defaultOriginPincode });
      toast.success('Profile updated successfully!', 'Saved');
    } catch (err) {
      toast.error(err.message, 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (!pw.current) return toast.error('Enter your current password.');
    if (pw.next.length < 6) return toast.error('New password must be at least 6 characters.');
    if (pw.next !== pw.confirm) return toast.error('Passwords do not match.');
    setSavingPw(true);
    try {
      await changePassword(pw.current, pw.next);
      setPw({ current:'', next:'', confirm:'' });
      toast.success('Password changed successfully!', 'Done');
    } catch (err) {
      toast.error(err.message, 'Failed');
    } finally {
      setSavingPw(false);
    }
  }

  function toggleNotif(key) {
    const next = !notifs[key];
    setNotifs(p => ({ ...p, [key]: next }));
    localStorage.setItem(`sf_notif_${key.replace(/([A-Z])/g,'_$1').toLowerCase().split('_')[1]}`, JSON.stringify(next));
    toast.info(`${next ? 'Enabled' : 'Disabled'}: ${key.replace(/([A-Z])/g,' $1').toLowerCase()}`);
  }

  function copyEnv() {
    navigator.clipboard.writeText(
      'MONGODB_URI=mongodb://127.0.0.1:27017/shipfast\nJWT_SECRET=change_this_secret_in_production\nPORT=5000\nCLIENT_URL=http://localhost:5173'
    );
    toast.info('Copied .env template to clipboard!');
  }

  /* ── pw strength ── */
  const strength = !pw.next ? null : pw.next.length < 6 ? { lvl:1, label:'Too short', color:'#ef4444' }
    : pw.next.length < 8 ? { lvl:2, label:'Weak', color:'#f59e0b' }
    : /[A-Z]/.test(pw.next) && /[0-9]/.test(pw.next) ? { lvl:4, label:'Strong', color:'#10b981' }
    : { lvl:3, label:'Good', color:'#4361ee' };

  return (
    <div style={{ padding:24, maxWidth:740, color:'var(--text-primary)' }}>
      <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:24, marginBottom:4 }}>Settings</div>
      <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:28 }}>Manage your account, theme, and preferences</div>

      {/* ── APPEARANCE ── */}
      <Section title="Appearance" icon={Sun}>
        <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:14 }}>Choose your preferred colour scheme</p>
        <div style={{ display:'flex', gap:12 }}>
          {[
            { key:'dark',  Icon:Moon,  label:'Dark Mode',  preview:'#0f172a', textCol:'#e2e8f0' },
            { key:'light', Icon:Sun,   label:'Light Mode', preview:'#f0f4ff', textCol:'#0f172a' },
          ].map(({ key, Icon, label, preview, textCol }) => {
            const active = isDark ? key==='dark' : key==='light';
            return (
              <div key={key} onClick={() => { if (!active) toggleTheme(); }}
                style={{ flex:1, padding:'16px 18px', borderRadius:14, cursor:active?'default':'pointer', transition:'all .2s',
                  border: active ? '2px solid #4361ee' : '1px solid var(--border)',
                  background: active ? 'var(--brand-dim)' : 'var(--bg-base)',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                {/* mini preview */}
                <div style={{ width:64, height:40, borderRadius:8, background:preview, border:'1px solid rgba(0,0,0,.1)', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                  <div style={{ width:14, height:14, borderRadius:'50%', background: key==='dark'?'rgba(255,255,255,.15)':'rgba(0,0,0,.1)' }} />
                  <div style={{ flex:1, height:6, borderRadius:3, background: key==='dark'?'rgba(255,255,255,.1)':'rgba(0,0,0,.08)', marginRight:8 }} />
                </div>
                <Icon style={{ width:16, height:16, color: active?'#4361ee':'var(--text-muted)' }} />
                <span style={{ fontSize:13, fontWeight:active?600:400, color: active?'#4361ee':'var(--text-muted)' }}>{label}</span>
                {active && (
                  <span style={{ fontSize:11, color:'#4361ee', display:'flex', alignItems:'center', gap:4 }}>
                    <Check style={{ width:11, height:11 }} /> Active
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── PROFILE ── */}
      <Section title="Profile" icon={User}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Full Name *">
            <Input value={profile.name} onChange={e=>sp('name')(e.target.value)} placeholder="Your name" />
          </Field>
          <Field label="Email Address" hint="Email cannot be changed here">
            <Input value={profile.email} placeholder="email@example.com" onChange={()=>{}} />
          </Field>
          <Field label="Company Name">
            <Input value={profile.company} onChange={e=>sp('company')(e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Phone Number">
            <Input value={profile.phone} onChange={e=>sp('phone')(e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Default Origin Pincode" hint="Pre-filled in every comparison">
            <Input value={profile.defaultOriginPincode} onChange={e=>sp('defaultOriginPincode')(e.target.value)} placeholder="e.g. 141001" />
          </Field>
        </div>
        <SaveBtn onClick={handleSaveProfile} loading={savingProfile} />
      </Section>

      {/* ── SECURITY ── */}
      <Section title="Security & Password" icon={Shield}>
        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
          {[
            { key:'current', label:'Current Password', placeholder:'Enter current password' },
            { key:'next',    label:'New Password',     placeholder:'Min. 6 characters' },
            { key:'confirm', label:'Confirm New Password', placeholder:'Re-enter new password' },
          ].map(({ key, label, placeholder }) => (
            <Field key={key} label={label}>
              <Input value={pw[key]} placeholder={placeholder}
                type={showPw[key] ? 'text' : 'password'}
                onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                suffix={
                  <button onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)', display:'flex', padding:0 }}>
                    {showPw[key] ? <EyeOff style={{ width:14, height:14 }} /> : <Eye style={{ width:14, height:14 }} />}
                  </button>
                }
              />
              {key==='next' && strength && (
                <div style={{ marginTop:6 }}>
                  <div style={{ display:'flex', gap:3, marginBottom:3 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ height:3, flex:1, borderRadius:2, transition:'background .3s', background: i<=strength.lvl ? strength.color : 'var(--border)' }} />
                    ))}
                  </div>
                  <span style={{ fontSize:11, color:strength.color }}>{strength.label}</span>
                </div>
              )}
            </Field>
          ))}
        </div>
        <SaveBtn onClick={handleChangePassword} loading={savingPw} label="Change Password" icon={Shield} />
      </Section>

      {/* ── NOTIFICATIONS ── */}
      <Section title="Notifications" icon={Bell}>
        {[
          { key:'bookingConfirm', label:'Booking Confirmations', desc:'Flash message when a shipment is booked' },
          { key:'savingsReport',  label:'Savings Summary',        desc:'Show savings after each comparison' },
          { key:'priceAlerts',    label:'Price Alert Toasts',     desc:'Notify when cheapest courier changes' },
        ].map(n => (
          <Toggle key={n.key} checked={notifs[n.key]} label={n.label} desc={n.desc} onChange={() => toggleNotif(n.key)} />
        ))}
        <div style={{ paddingTop:8 }} />
      </Section>

      {/* ── DATABASE CONNECTION GUIDE ── */}
      

        

      {/* ── ACCOUNT STATS ── */}
      <Section title="Account" icon={User}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[
            ['Plan',     user?.plan ? user.plan.charAt(0).toUpperCase()+user.plan.slice(1)+' Plan' : 'Free'],
            ['Role',     user?.role ? user.role.charAt(0).toUpperCase()+user.role.slice(1) : 'Seller'],
            ['Shipments', String(user?.totalShipments || 0)],
            
          ].map(([k,v]) => (
            <div key={k} style={{ background:'var(--bg-base)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
              <div style={{ fontSize:10, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>{k}</div>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)' }}>{v}</div>
            </div>
          ))}
        </div>
      </Section>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
