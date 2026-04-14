import { useState, useEffect, useCallback, useRef } from 'react';
import { Package, RefreshCw, Check, X, User, ChevronDown, MapPin, Weight, DollarSign } from 'lucide-react';
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

const NEXT_STATUS = {
  accepted:   { next:'picked_up',  label:'Mark Picked Up',  color:'#7c3aed' },
  picked_up:  { next:'in_transit', label:'Mark In Transit', color:'#6d28d9' },
  in_transit: { next:'delivered',  label:'Mark Delivered',  color:'#059669' },
};

function Badge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:999,
      background:s.bg, border:`1px solid ${s.border}`, color:s.text,
      textTransform:'capitalize', whiteSpace:'nowrap' }}>
      {status?.replace(/_/g,' ')}
    </span>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)',
      backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
      <div onClick={e=>e.stopPropagation()}
        style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:16, padding:24, width:'100%', maxWidth:440 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          marginBottom:18, paddingBottom:14, borderBottom:'1px solid var(--divider)' }}>
          <span style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:15, color:'var(--text-primary)' }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)', fontSize:20 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function BookingCard({ b, agents, onAction, busyId }) {
  const [exp, setExp]             = useState(false);
  const [rejectModal, setReject]  = useState(false);
  const [assignModal, setAssign]  = useState(false);
  const [reason, setReason]       = useState('');
  const [agentId, setAgentId]     = useState('');

  const s      = b.snapshot || {};
  const isBusy = busyId === b._id;
  const next   = NEXT_STATUS[b.status];
  const avail  = agents.filter(a => a.isAvailable);

  // Derive tracking id from snapshot or populated shipment
  const trackingId = s.trackingId || b.shipment?.trackingId || b._id?.toString().slice(-8).toUpperCase();

  function ActionBtn({ label, bg = '#4361ee', ghost, onClick, disabled: dis }) {
    return (
      <button onClick={onClick} disabled={isBusy || dis}
        style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px',
          fontSize:12, fontWeight:600, cursor:(isBusy||dis)?'not-allowed':'pointer',
          background:ghost?'var(--bg-card)':bg, color:ghost?'var(--text-muted)':'white',
          border:ghost?'1px solid var(--border)':'none', borderRadius:8,
          opacity:(isBusy||dis)?.6:1, fontFamily:'inherit', transition:'opacity .15s' }}>
        {isBusy && !ghost ? <div style={{ width:12,height:12,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin .7s linear infinite' }}/> : null}
        {label}
      </button>
    );
  }

  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'16px 18px', marginBottom:10 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
            <span style={{ fontFamily:'monospace', fontSize:13, color:'#4361ee', fontWeight:700 }}>{trackingId}</span>
            <Badge status={b.status}/>
            {s.isCOD && (
              <span style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:999,
                background:'rgba(245,158,11,.1)', color:'#d97706', border:'1px solid rgba(245,158,11,.3)' }}>
                COD ₹{s.codAmount || 0}
              </span>
            )}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:14, fontSize:12, color:'var(--text-muted)' }}>
            {s.originPincode && (
              <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                <MapPin size={11}/>{s.originPincode} → {s.destPincode}
              </span>
            )}
            {s.weight > 0 && (
              <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                <Weight size={11}/>{s.weight} kg
              </span>
            )}
            {s.totalCost > 0 && (
              <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                <DollarSign size={11}/>₹{s.totalCost.toFixed(0)}
              </span>
            )}
            {s.zone && (
              <span style={{ color:'var(--text-dim)', textTransform:'capitalize' }}>
                {s.zone} · {s.estimatedDays}d
              </span>
            )}
          </div>
          {b.assignedAgent && (
            <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:20,height:20,borderRadius:'50%',background:'rgba(67,97,238,.12)',
                display:'flex',alignItems:'center',justifyContent:'center' }}>
                <User size={11} color="#4361ee"/>
              </div>
              <span style={{ fontSize:12, color:'var(--text-secondary)' }}>
                Agent: <strong>{b.assignedAgent.name}</strong> · {b.assignedAgent.phone}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
          {b.status === 'pending' && (
            <>
              <ActionBtn label={<><Check size={12} style={{marginRight:3}}/>Accept</>} bg="#059669" onClick={()=>onAction('accept',b._id)}/>
              <ActionBtn label={<><X size={12} style={{marginRight:3}}/>Reject</>} ghost onClick={()=>setReject(true)}/>
            </>
          )}
          {b.status === 'accepted' && (
            <ActionBtn label={<><User size={12} style={{marginRight:3}}/>{b.assignedAgent?'Reassign':'Assign Agent'}</>} ghost onClick={()=>setAssign(true)}/>
          )}
          {next && b.assignedAgent && (
            <ActionBtn label={next.label} bg={next.color} onClick={()=>onAction('status',b._id,next.next)}/>
          )}
          {next && !b.assignedAgent && b.status === 'accepted' && (
            <span style={{ fontSize:11, color:'var(--text-dim)', maxWidth:110, textAlign:'right', lineHeight:1.4 }}>
              Assign an agent first
            </span>
          )}
        </div>
      </div>

      {/* Timeline */}
      {b.statusHistory?.length > 0 && (
        <>
          <button onClick={()=>setExp(p=>!p)}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
              marginTop:12, paddingTop:10, borderTop:'1px solid var(--divider)',
              background:'none', border:'none', borderTop:'1px solid var(--divider)',
              cursor:'pointer', color:'var(--text-dim)', fontSize:12, fontFamily:'inherit' }}>
            <span>Timeline ({b.statusHistory.length} events)</span>
            <ChevronDown size={13} style={{ transform:exp?'rotate(180deg)':'none', transition:'transform .2s' }}/>
          </button>
          {exp && (
            <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:7 }}>
              {[...b.statusHistory].reverse().map((h, i) => (
                <div key={i} style={{ display:'flex', gap:10, fontSize:12 }}>
                  <div style={{ width:6,height:6,borderRadius:'50%',background:'#4361ee',marginTop:5,flexShrink:0 }}/>
                  <div>
                    <span style={{ fontWeight:600, color:'var(--text-secondary)', textTransform:'capitalize' }}>
                      {h.status?.replace(/_/g,' ')}
                    </span>
                    {h.note && <span style={{ color:'var(--text-dim)', marginLeft:6 }}>· {h.note}</span>}
                    <div style={{ color:'var(--text-dim)', fontSize:10, marginTop:1 }}>
                      {h.changedAt ? new Date(h.changedAt).toLocaleString('en-IN') : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Reject modal */}
      <Modal open={rejectModal} onClose={()=>setReject(false)} title="Reject Booking">
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:12, color:'var(--text-muted)', marginBottom:5 }}>Reason (optional)</label>
          <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g. Outside service area"
            className="input-field"/>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>setReject(false)} style={{ flex:1,padding:'9px 0',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:9,cursor:'pointer',fontSize:13,color:'var(--text-muted)',fontFamily:'inherit' }}>Cancel</button>
          <button onClick={()=>{ onAction('reject',b._id,null,reason); setReject(false); }}
            style={{ flex:1,padding:'9px 0',background:'#ef4444',border:'none',borderRadius:9,cursor:'pointer',fontSize:13,fontWeight:600,color:'white',fontFamily:'inherit' }}>Confirm Reject</button>
        </div>
      </Modal>

      {/* Assign agent modal — custom cards, no native <select> */}
      <Modal open={assignModal} onClose={()=>{ setAssign(false); setAgentId(''); }} title="Assign Delivery Agent">
        {avail.length === 0 ? (
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <User size={32} style={{ margin:'0 auto 10px', opacity:.3, display:'block', color:'var(--text-dim)' }}/>
            <p style={{ fontSize:13, color:'var(--text-muted)' }}>No available agents right now.</p>
            <p style={{ fontSize:12, color:'var(--text-dim)', marginTop:4 }}>Add agents from the Agents page first.</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>
              Select an agent to assign to this delivery:
            </p>
            {/* Agent cards — no native select, works in any theme */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:300, overflowY:'auto', marginBottom:16 }}>
              {avail.map(a => {
                const V_ICON = { bike:'🏍️', scooter:'🛵', car:'🚗', van:'🚐', truck:'🚚' };
                const selected = agentId === a._id;
                return (
                  <div key={a._id} onClick={()=>setAgentId(a._id)}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                      borderRadius:11, cursor:'pointer', transition:'all .15s',
                      border: selected ? '2px solid #4361ee' : '1px solid var(--border)',
                      background: selected ? 'rgba(67,97,238,.1)' : 'var(--bg-base)',
                    }}>
                    {/* Avatar */}
                    <div style={{ width:40, height:40, borderRadius:10, flexShrink:0,
                      background: selected ? 'rgba(67,97,238,.18)' : 'var(--bg-card)',
                      border:`1px solid ${selected?'rgba(67,97,238,.4)':'var(--border)'}`,
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                      {V_ICON[a.vehicleType] || '🏍️'}
                    </div>
                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{a.name}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2, display:'flex', gap:8 }}>
                        <span style={{ textTransform:'capitalize' }}>{a.vehicleType}</span>
                        {a.vehicleNumber && <span>· {a.vehicleNumber}</span>}
                        <span>· {a.phone}</span>
                      </div>
                      <div style={{ fontSize:10, marginTop:3, display:'flex', alignItems:'center', gap:4 }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', background:'#10b981' }}/>
                        <span style={{ color:'#10b981', fontWeight:600 }}>Available</span>
                        <span style={{ color:'var(--text-dim)' }}>· {a.totalDeliveries || 0} deliveries</span>
                      </div>
                    </div>
                    {/* Selected check */}
                    {selected && (
                      <div style={{ width:22, height:22, borderRadius:'50%', background:'#4361ee',
                        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Check size={13} color="white"/>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>{ setAssign(false); setAgentId(''); }}
                style={{ flex:1,padding:'10px 0',background:'var(--bg-card)',border:'1px solid var(--border)',
                  borderRadius:9,cursor:'pointer',fontSize:13,color:'var(--text-muted)',fontFamily:'inherit' }}>
                Cancel
              </button>
              <button onClick={()=>{ if(agentId){ onAction('assign',b._id,agentId); setAssign(false); setAgentId(''); } }}
                disabled={!agentId}
                style={{ flex:1,padding:'10px 0',background:'#4361ee',border:'none',borderRadius:9,
                  cursor:agentId?'pointer':'not-allowed',fontSize:13,fontWeight:600,color:'white',
                  fontFamily:'inherit',opacity:agentId?1:.5 }}>
                {agentId ? `Assign ${avail.find(a=>a._id===agentId)?.name || 'Agent'}` : 'Select an agent'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function CourierBookingsPage() {
  const toast           = useToast();
  const { company }     = useAuth();
  const [bookings, setBookings] = useState([]);
  const [agents,   setAgents]   = useState([]);
  const [stats,    setStats]    = useState(null);
  const [busy,     setBusy]     = useState(true);
  const [busyId,   setBusyId]   = useState(null);
  const [filter,   setFilter]   = useState('all');
  const loadedRef = useRef(false);  // prevent double-load on strict mode

  // Single load function — called manually or on mount
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [bd, ad] = await Promise.all([
        companyFetch('/bookings'),
        companyFetch('/agents'),
      ]);
      setBookings(bd.data?.bookings || []);
      setStats(bd.data?.stats || null);
      setAgents(ad.data || []);
    } catch (ex) {
      toast.error(ex.message, 'Failed to load bookings');
    } finally {
      setBusy(false);
    }
  }, []); // no deps — stable reference

  // Load once on mount
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load();
  }, [load]);

  async function onAction(type, id, payload, extra) {
    setBusyId(id);
    try {
      let d;
      if (type === 'accept') d = await companyFetch(`/bookings/${id}/accept`, { method:'PUT' });
      if (type === 'reject') d = await companyFetch(`/bookings/${id}/reject`, { method:'PUT', body:JSON.stringify({ reason: extra || payload || '' }) });
      if (type === 'assign') d = await companyFetch(`/bookings/${id}/assign-agent`, { method:'PUT', body:JSON.stringify({ agentId: payload }) });
      if (type === 'status') d = await companyFetch(`/bookings/${id}/status`, { method:'PUT', body:JSON.stringify({ status: payload }) });

      toast.success(d.message || 'Updated', 'Success');
      // Update this booking in-place without re-fetching everything
      setBookings(prev => prev.map(b => b._id === id ? d.data : b));
      // Only re-fetch agents if we just assigned one (availability changed)
      if (type === 'assign' || type === 'status') {
        const ad = await companyFetch('/agents');
        setAgents(ad.data || []);
      }
    } catch (ex) {
      toast.error(ex.message, 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  const FILTERS = ['all','pending','accepted','picked_up','in_transit','delivered','rejected'];
  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div style={{ padding:24, maxWidth:920, color:'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:24 }}>Bookings</div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:3 }}>
            {stats
              ? `${stats.total} total · ${stats.pending} pending · ${stats.delivered} delivered`
              : busy ? 'Loading…' : 'No bookings yet'}
          </div>
        </div>
        <button onClick={load} disabled={busy}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
            background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:9,
            fontSize:12, color:'var(--text-muted)', cursor:'pointer', fontFamily:'inherit' }}>
          <RefreshCw size={13} style={{ animation:busy?'spin .8s linear infinite':undefined }}/>
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', background:'var(--bg-card)', border:'1px solid var(--border)',
        borderRadius:10, overflow:'hidden', marginBottom:18, flexWrap:'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={()=>setFilter(f)}
            style={{ padding:'8px 14px', fontSize:12, fontWeight:filter===f?600:400, border:'none',
              cursor:'pointer', background:filter===f?'#4361ee':'transparent',
              color:filter===f?'white':'var(--text-muted)', textTransform:'capitalize',
              fontFamily:'inherit', transition:'all .15s' }}>
            {f.replace(/_/g,' ')}
            {stats && f !== 'all' && stats[f] !== undefined ? ` (${stats[f]})` : ''}
          </button>
        ))}
      </div>

      {/* Content */}
      {busy && bookings.length === 0 ? (
        [...Array(3)].map((_,i) => (
          <div key={i} style={{ height:100, background:'var(--bg-card)', border:'1px solid var(--border)',
            borderRadius:14, marginBottom:10, animation:'pulse 1.4s ease-in-out infinite' }}/>
        ))
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-dim)', fontSize:13 }}>
          <Package size={36} style={{ margin:'0 auto 14px', opacity:.3, display:'block' }}/>
          {bookings.length === 0
            ? <>No bookings yet.<br/>They appear here automatically when ShipFast users book with courier code <strong style={{ fontFamily:'monospace' }}>{company?.courierCode}</strong>.</>
            : 'No bookings match this filter.'}
        </div>
      ) : (
        filtered.map(b => (
          <BookingCard key={b._id} b={b} agents={agents} onAction={onAction} busyId={busyId}/>
        ))
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }
      `}</style>
    </div>
  );
}
