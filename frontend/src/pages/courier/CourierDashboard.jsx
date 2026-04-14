import { useState, useEffect, useRef } from 'react';
import { Package, CheckCircle, Clock, Truck, RefreshCw, MapPin } from 'lucide-react';
import { useAuth, companyFetch } from '../../context/AuthContext';
import { useToast } from '../../context/AppContext';

const STATUS_STYLE = {
  pending:    { bg:'rgba(245,158,11,.1)',  border:'rgba(245,158,11,.3)',  text:'#d97706' },
  accepted:   { bg:'rgba(59,130,246,.1)',  border:'rgba(59,130,246,.3)',  text:'#2563eb' },
  picked_up:  { bg:'rgba(168,85,247,.1)', border:'rgba(168,85,247,.3)',  text:'#7c3aed' },
  in_transit: { bg:'rgba(139,92,246,.1)', border:'rgba(139,92,246,.3)',  text:'#6d28d9' },
  delivered:  { bg:'rgba(16,185,129,.1)', border:'rgba(16,185,129,.3)',  text:'#059669' },
  rejected:   { bg:'rgba(239,68,68,.1)',  border:'rgba(239,68,68,.3)',   text:'#dc2626' },
};

function Badge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:999,
      background:s.bg, border:`1px solid ${s.border}`, color:s.text, whiteSpace:'nowrap', textTransform:'capitalize' }}>
      {status?.replace(/_/g,' ')}
    </span>
  );
}

function StatCard({ icon:Icon, label, value, color, bg }) {
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 20px' }}>
      <div style={{ width:34,height:34,borderRadius:9,background:bg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12 }}>
        <Icon size={16} color={color}/>
      </div>
      <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:26, color:'var(--text-primary)', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:6 }}>{label}</div>
    </div>
  );
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';
}

export default function CourierDashboard() {
  const { company } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const loadedRef = useRef(false);

  async function load() {
    setBusy(true);
    try {
      const d = await companyFetch('/bookings');
      setData(d.data);
    } catch (ex) {
      toast.error(ex.message, 'Failed to load');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load();
  }, []);

  const stats  = data?.stats;
  const recent = (data?.bookings || []).slice(0, 6);

  return (
    <div style={{ padding:24, maxWidth:1060, color:'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:24 }}>Dashboard</div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>
            {company?.name} · code:{' '}
            <span style={{ fontFamily:'monospace', color:'#4361ee' }}>{company?.courierCode}</span>
          </div>
        </div>
        <button onClick={load} disabled={busy}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
            background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:9,
            fontSize:12, color:'var(--text-muted)', cursor:'pointer', fontFamily:'inherit' }}>
          <RefreshCw size={13} style={{ animation:busy?'spin .8s linear infinite':undefined }}/> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {busy && !stats ? (
          [...Array(4)].map((_,i) => (
            <div key={i} style={{ height:110,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:14,animation:'pulse 1.4s ease-in-out infinite' }}/>
          ))
        ) : stats ? [
          { icon:Package,     label:'Total',     value:stats.total,     color:'#4361ee', bg:'rgba(67,97,238,.12)' },
          { icon:Clock,       label:'Pending',   value:stats.pending,   color:'#d97706', bg:'rgba(245,158,11,.12)' },
          { icon:Truck,       label:'Active',    value:stats.active,    color:'#7c3aed', bg:'rgba(168,85,247,.12)' },
          { icon:CheckCircle, label:'Delivered', value:stats.delivered, color:'#059669', bg:'rgba(16,185,129,.12)' },
        ].map(c => <StatCard key={c.label} {...c}/>) : null}
      </div>

      {/* Recent bookings */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, paddingBottom:14, borderBottom:'1px solid var(--divider)' }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:600, fontSize:15, color:'var(--text-primary)' }}>Recent Bookings</div>
          <a href="/courier/bookings" style={{ fontSize:12, color:'#4361ee', textDecoration:'none' }}>View all →</a>
        </div>

        {busy && !data ? (
          [...Array(3)].map((_,i) => (
            <div key={i} style={{ height:52,background:'var(--bg-base)',borderRadius:8,marginBottom:8,animation:'pulse 1.4s ease-in-out infinite' }}/>
          ))
        ) : recent.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-dim)', fontSize:13 }}>
            <Truck size={32} style={{ margin:'0 auto 12px', opacity:.3, display:'block' }}/>
            No bookings yet. They appear automatically when ShipFast users book with code{' '}
            <strong style={{ fontFamily:'monospace' }}>{company?.courierCode}</strong>.
          </div>
        ) : (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 140px 140px 90px 110px', gap:10,
              padding:'6px 0', borderBottom:'1px solid var(--divider)', fontSize:10, fontWeight:600,
              color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'.05em' }}>
              <div>Tracking ID</div><div>Route</div><div>Agent</div><div>Cost</div><div>Status</div>
            </div>
            {recent.map((b, i) => {
              const s = b.snapshot || {};
              const trackId = s.trackingId || b.shipment?.trackingId || b._id?.toString().slice(-8).toUpperCase();
              return (
                <div key={b._id} style={{ display:'grid', gridTemplateColumns:'1fr 140px 140px 90px 110px', gap:10,
                  padding:'11px 0', borderBottom:i<recent.length-1?'1px solid var(--divider)':'none', alignItems:'center', fontSize:13 }}>
                  <div>
                    <div style={{ fontFamily:'monospace', fontSize:12, color:'#4361ee', fontWeight:600 }}>{trackId}</div>
                    <div style={{ fontSize:10, color:'var(--text-dim)', marginTop:2 }}>{fmtDate(b.createdAt)}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-muted)' }}>
                    <MapPin size={11}/>{s.originPincode||'?'} → {s.destPincode||'?'}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                    {b.assignedAgent ? b.assignedAgent.name : <span style={{ color:'var(--text-dim)' }}>Unassigned</span>}
                  </div>
                  <div style={{ fontFamily:'monospace', fontWeight:600, color:'var(--text-primary)', fontSize:13 }}>
                    ₹{(s.totalCost||0).toFixed(0)}
                  </div>
                  <Badge status={b.status}/>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
}
