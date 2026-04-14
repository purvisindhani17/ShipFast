import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Truck, LayoutDashboard, Package, Users, LogOut, Sun, Moon, ChevronRight, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/AppContext';

const NAV = [
  { to:'/',                 icon:LayoutDashboard, label:'Dashboard', end:true },
  { to:'/courier/bookings', icon:Package,         label:'Bookings'            },
  { to:'/courier/agents',   icon:Users,           label:'Agents'              },
];

export default function CourierLayout() {
  const { company, logoutCompany } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  const initials = company?.name?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() || '?';
  const color    = company?.logoColor || '#4361ee';

  function Btn({ onClick, icon:Icon, label, danger }) {
    return (
      <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 11px', borderRadius:9,
        fontSize:13, fontWeight:500, cursor:'pointer', width:'100%', background:'none', border:'none',
        color:'var(--text-muted)', transition:'all .15s', fontFamily:'inherit' }}
        onMouseEnter={e=>{ e.currentTarget.style.background=danger?'rgba(239,68,68,.07)':'var(--bg-card)'; e.currentTarget.style.color=danger?'#ef4444':'var(--text-primary)'; }}
        onMouseLeave={e=>{ e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--text-muted)'; }}>
        <Icon size={15}/>{label}
      </button>
    );
  }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg-base)' }}>
      <aside style={{ width:236, flexShrink:0, display:'flex', flexDirection:'column', background:'var(--sidebar-bg)', borderRight:'1px solid var(--divider)' }}>
        {/* Logo */}
        <div style={{ padding:'18px 16px 14px', borderBottom:'1px solid var(--divider)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Truck size={18} color="white"/>
          </div>
          <div>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:15, color:'var(--text-primary)', lineHeight:1 }}>{company?.name || 'Courier Portal'}</div>
            <div style={{ fontSize:9, color:'var(--text-dim)', marginTop:2, letterSpacing:'.07em', textTransform:'uppercase' }}>Code: {company?.courierCode}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'10px 8px', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV.map(({ to, icon:Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} style={{ textDecoration:'none' }}>
              {({ isActive }) => (
                <div style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 11px', borderRadius:9,
                  fontSize:13, fontWeight:500, cursor:'pointer', transition:'all .15s',
                  background: isActive ? 'var(--brand-dim)' : 'transparent',
                  color:      isActive ? '#4361ee' : 'var(--text-muted)',
                  border:     isActive ? '1px solid rgba(67,97,238,.2)' : '1px solid transparent' }}>
                  <Icon size={15} style={{ flexShrink:0 }}/><span style={{ flex:1 }}>{label}</span>
                  {isActive && <ChevronRight size={12} style={{ opacity:.4 }}/>}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding:'8px 8px 14px', borderTop:'1px solid var(--divider)', display:'flex', flexDirection:'column', gap:2 }}>
          <Btn icon={isDark?Sun:Moon} label={isDark?'Light Mode':'Dark Mode'} onClick={toggle}/>
          <Btn icon={LogOut} label="Sign out" danger onClick={() => { logoutCompany(); navigate('/login'); }}/>
          <div style={{ marginTop:6, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:11, padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:color+'22', border:`1px solid ${color}44`, display:'flex', alignItems:'center', justifyContent:'center', color, fontWeight:700, fontSize:12, flexShrink:0 }}>{initials}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{company?.name}</div>
              <div style={{ fontSize:10, color:'var(--text-dim)', marginTop:1 }}>Courier Partner</div>
            </div>
          </div>
        </div>
      </aside>
      <main style={{ flex:1, overflowY:'auto', background:'var(--bg-base)' }}><Outlet/></main>
    </div>
  );
}
