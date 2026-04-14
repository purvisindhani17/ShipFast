import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Package, BarChart3, Truck, GitCompare, Zap, Settings, ChevronRight, LogOut, Shield, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/AppContext';

const navItems = [
  { to: '/compare',   icon: GitCompare, label: 'Compare Rates' },
  { to: '/dashboard', icon: BarChart3,  label: 'Analytics'     },
  { to: '/shipments', icon: Package,    label: 'Shipments'     },
  { to: '/couriers',  icon: Truck,      label: 'Couriers'      },
  { to: '/settings',  icon: Settings,   label: 'Settings'      },
];

const planBadge = { free: { label: 'Free', color: 'var(--text-dim)' }, pro: { label: 'Pro', color: '#4361ee' }, enterprise: { label: 'Enterprise', color: '#f59e0b' } };

export default function Layout() {
  const { user, logoutUser, shipments } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => { logoutUser(); navigate('/login'); };
  const initials = user?.name ? user.name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() : '?';
  const plan = planBadge[user?.plan] || planBadge.free;
  const newCount = shipments.filter(s => s.status === 'booked').length;

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside style={{ width:240, flexShrink:0, display:'flex', flexDirection:'column', background:'var(--sidebar-bg)', borderRight:'1px solid var(--divider)', backdropFilter:'blur(20px)' }}>

        {/* Logo */}
        <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid var(--divider)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'#4361ee', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Zap style={{ width:18, height:18, color:'white' }} fill="currentColor" />
            </div>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:17, color:'var(--text-primary)', lineHeight:1 }}>ShipFast</div>
              <div style={{ fontSize:9, color:'var(--text-dim)', marginTop:2, letterSpacing:'0.08em', textTransform:'uppercase' }}>Rate Aggregator</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:2 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={{ textDecoration:'none' }}>
              {({ isActive }) => (
                <div style={{
                  display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10,
                  fontSize:13, fontWeight:500, cursor:'pointer', transition:'all 0.15s',
                  background: isActive ? 'var(--brand-dim)' : 'transparent',
                  color: isActive ? '#4361ee' : 'var(--text-muted)',
                  border: isActive ? '1px solid rgba(67,97,238,0.2)' : '1px solid transparent',
                }}>
                  <Icon style={{ width:15, height:15, flexShrink:0 }} />
                  <span style={{ flex:1 }}>{label}</span>
                  {label === 'Shipments' && newCount > 0 && (
                    <span style={{ background:'#4361ee', color:'white', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:999 }}>{newCount}</span>
                  )}
                  {isActive && <ChevronRight style={{ width:12, height:12, opacity:0.4 }} />}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding:'10px 10px 16px', borderTop:'1px solid var(--divider)', display:'flex', flexDirection:'column', gap:4 }}>
          {/* Theme toggle */}
          <button onClick={toggle} style={{
            display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:10,
            fontSize:13, fontWeight:500, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', width:'100%', transition:'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
            {isDark ? <Sun style={{ width:15, height:15 }} /> : <Moon style={{ width:15, height:15 }} />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>

          <button onClick={handleLogout} style={{
            display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:10,
            fontSize:13, fontWeight:500, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', width:'100%', transition:'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
            <LogOut style={{ width:15, height:15 }} />
            Sign out
          </button>

          {/* User card */}
          {user && (
            <div style={{ marginTop:6, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:'rgba(67,97,238,0.15)', border:'1px solid rgba(67,97,238,0.25)', display:'flex', alignItems:'center', justifyContent:'center', color:'#4361ee', fontWeight:700, fontSize:13, flexShrink:0 }}>
                {initials}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.name}</div>
                <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                  <Shield style={{ width:9, height:9, color:'var(--text-dim)' }} />
                  <span style={{ fontSize:10, color: plan.color }}>{plan.label} Plan</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, overflowY:'auto', background:'var(--bg-base)' }}>
        <Outlet />
      </main>
    </div>
  );
}
