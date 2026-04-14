import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, CheckCircle, Truck, AlertCircle, Search, RefreshCw, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/AppContext';

const STATUS = {
  delivered:  { label:'Delivered',  bg:'rgba(16,185,129,0.1)', border:'rgba(16,185,129,0.25)', text:'#10b981', icon: CheckCircle },
  in_transit: { label:'In Transit', bg:'rgba(59,130,246,0.1)', border:'rgba(59,130,246,0.25)', text:'#3b82f6', icon: Truck },
  picked_up:  { label:'Picked Up',  bg:'rgba(245,158,11,0.1)', border:'rgba(245,158,11,0.25)', text:'#f59e0b', icon: Package },
  booked:     { label:'Booked',     bg:'rgba(168,85,247,0.1)', border:'rgba(168,85,247,0.25)', text:'#a855f7', icon: Clock },
  cancelled:  { label:'Cancelled',  bg:'rgba(239,68,68,0.1)',  border:'rgba(239,68,68,0.25)',  text:'#ef4444', icon: AlertCircle },
};
const COLORS = { Delhivery:'#D3232A', BlueDart:'#003087', DTDC:'#FF6B00', XpressBees:'#FF4500', Shiprocket:'#6C00FF', 'Ecom Express':'#009A44', Ekart:'#F7A800', 'FedEx India':'#4D148C' };

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

export default function ShipmentsPage() {
  const { shipments, refreshShipments } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [refreshing, setRefreshing]   = useState(false);

  // Auto-refresh every 30 s so status changes from courier show up
  useEffect(() => {
    const id = setInterval(() => refreshShipments(), 30000);
    return () => clearInterval(id);
  }, [refreshShipments]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshShipments();
    setRefreshing(false);
    toast.success('Shipments refreshed', '');
  };

  const filtered = shipments.filter(s => {
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const term = search.toLowerCase();
    const matchSearch = !term ||
      (s.id||'').toLowerCase().includes(term) ||
      (s.courier||'').toLowerCase().includes(term) ||
      (s.destination?.city||'').toLowerCase().includes(term) ||
      (s.destination?.pincode||'').includes(term) ||
      (s.origin?.city||'').toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  const totalSaved = shipments.reduce((acc, s) => acc + (s.savings || 0), 0);

  const S = {
    page: { padding:24, maxWidth:1100 },
    toprow: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 },
    h1: { fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:24, color:'var(--text-primary)' },
    sub: { fontSize:13, color:'var(--text-muted)', marginTop:4 },
    savingsCard: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'10px 16px', textAlign:'right' },
    filterRow: { display:'flex', gap:10, marginBottom:18, flexWrap:'wrap', alignItems:'center' },
    searchWrap: { position:'relative', flex:'1', maxWidth:280 },
    table: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' },
    thead: { display:'grid', gridTemplateColumns:'180px 1fr 140px 80px 110px 120px', gap:12, padding:'10px 20px', borderBottom:'1px solid var(--divider)', fontSize:11, fontWeight:600, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.05em' },
    row: { display:'grid', gridTemplateColumns:'180px 1fr 140px 80px 110px 120px', gap:12, padding:'13px 20px', borderBottom:'1px solid var(--divider)', alignItems:'center', transition:'background 0.15s' },
    emptyState: { padding:'60px 0', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:10 },
    refreshBtn: { display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:9, fontSize:12, color:'var(--text-muted)', cursor:'pointer', fontWeight:500 },
    filterGroup: { display:'flex', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:9, overflow:'hidden' },
    filterBtn: (active) => ({ padding:'7px 12px', fontSize:12, fontWeight: active?600:400, border:'none', cursor:'pointer', background: active?'#4361ee':'transparent', color: active?'white':'var(--text-muted)', textTransform:'capitalize', transition:'all 0.15s' }),
  };

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.toprow}>
        <div>
          <div style={S.h1}>Shipments</div>
          <div style={S.sub}>{shipments.length} total · Live from backend</div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button onClick={handleRefresh} style={S.refreshBtn} disabled={refreshing}>
            <RefreshCw style={{ width:13, height:13, animation: refreshing?'spin 1s linear infinite':undefined }} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <div style={S.savingsCard}>
            <div style={{ fontSize:10, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Total Saved</div>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:20, color:'#10b981' }}>₹{totalSaved.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={S.filterRow}>
        <div style={S.searchWrap}>
          <Search style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', width:13, height:13, color:'var(--text-dim)' }} />
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search ID, courier, city…" className="input-field" style={{ paddingLeft:32 }} />
        </div>
        <div style={S.filterGroup}>
          {['all','booked','picked_up','in_transit','delivered','cancelled'].map(s=>(
            <button key={s} onClick={()=>setFilterStatus(s)} style={S.filterBtn(filterStatus===s)}>
              {s.replace('_',' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {shipments.length === 0 ? (
        <div style={S.emptyState}>
          <div className="card" style={{ width:56, height:56, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:16 }}>
            <Package style={{ width:26, height:26, color:'var(--text-dim)' }} />
          </div>
          <div style={{ fontSize:15, fontWeight:600, color:'var(--text-muted)' }}>No shipments yet</div>
          <div style={{ fontSize:13, color:'var(--text-dim)' }}>Book your first shipment from the Compare page</div>
          <button onClick={()=>navigate('/compare')} className="btn-primary" style={{ border:'none', cursor:'pointer', marginTop:4, fontSize:13 }}>
            Compare Rates
          </button>
        </div>
      ) : (
        <div style={S.table}>
          <div style={S.thead}>
            <div>Shipment</div><div>Route</div><div>Courier</div><div>Weight</div><div>Cost</div><div>Status</div>
          </div>
          <div>
            {filtered.length === 0 ? (
              <div style={{ padding:'32px 0', textAlign:'center', color:'var(--text-dim)', fontSize:13 }}>
                No shipments match your filters
              </div>
            ) : filtered.map((s, idx) => {
              const st = STATUS[s.status] || STATUS.booked;
              const Icon = st.icon;
              return (
                <div key={s.id || idx} style={{ ...S.row, borderBottom: idx===filtered.length-1?'none':'1px solid var(--divider)' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg-input)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>

                  {/* ID + date */}
                  <div>
                    <div style={{ fontFamily:'monospace', fontSize:12, color:'#4361ee', fontWeight:600 }}>{s.id}</div>
                    <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>{fmtDate(s.createdAt)}</div>
                  </div>

                  {/* Route */}
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>{s.origin?.city || s.origin?.pincode}</div>
                      <div style={{ fontSize:10, fontFamily:'monospace', color:'var(--text-dim)' }}>{s.origin?.pincode}</div>
                    </div>
                    <MapPin style={{ width:12, height:12, color:'var(--text-dim)', flexShrink:0 }} />
                    <div>
                      <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{s.destination?.city || s.destination?.pincode}</div>
                      <div style={{ fontSize:10, fontFamily:'monospace', color:'var(--text-dim)' }}>{s.destination?.pincode}</div>
                    </div>
                  </div>

                  {/* Courier */}
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background: COLORS[s.courier]||'#888', flexShrink:0 }} />
                    <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{s.courier}</span>
                  </div>

                  {/* Weight */}
                  <div style={{ fontSize:12, fontFamily:'monospace', color:'var(--text-muted)' }}>
                    {s.package?.billableWeight || s.package?.weight || s.weight || '—'}kg
                  </div>

                  {/* Cost */}
                  <div>
                    <div style={{ fontSize:13, fontFamily:'monospace', fontWeight:600, color:'var(--text-primary)' }}>
                      ₹{typeof s.totalCost==='number' ? s.totalCost.toFixed(2) : s.totalCost}
                    </div>
                    {s.savings > 0 && <div style={{ fontSize:10, color:'#10b981' }}>−₹{s.savings} saved</div>}
                  </div>

                  {/* Status badge */}
                  <div style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:999, border:`1px solid ${st.border}`, background:st.bg }}>
                    <Icon style={{ width:11, height:11, color:st.text }} />
                    <span style={{ fontSize:11, fontWeight:600, color:st.text }}>{st.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
