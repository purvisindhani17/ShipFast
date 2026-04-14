import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ShipmentForm from '../components/ShipmentForm';
import { useAuth, userFetch } from '../context/AuthContext';
import { useToast } from '../context/AppContext';
import {
  TrendingDown, Clock, Truck, ArrowUpDown, CheckCircle, X,
  ExternalLink, Zap, Star, Package, MapPin, ChevronDown, ChevronUp,
  Building2, Filter,
} from 'lucide-react';

// ── Zone colours (work in both light + dark) ──────────────
const ZONE = {
  local:    { label:'Local Zone',    color:'#10b981', desc:'Same city' },
  metro:    { label:'Metro Zone',    color:'#3b82f6', desc:'Within metro' },
  regional: { label:'Regional Zone', color:'#f59e0b', desc:'Neighboring states' },
  national: { label:'National Zone', color:'#a855f7', desc:'Pan-India' },
};

// ── RateCard — fully inline-styled, light/dark safe ───────
function RateCard({ rate, isCheapest, isFastest, onBook, bookBusy }) {
  const [open, setOpen] = useState(false);
  const busy = bookBusy === rate.code;

  return (
    <div style={{
      background:'var(--bg-card)', border:`1px solid ${isCheapest?'rgba(67,97,238,.4)':'var(--border)'}`,
      borderRadius:16, padding:18, display:'flex', flexDirection:'column', gap:0,
      boxShadow: isCheapest ? '0 0 0 1px rgba(67,97,238,.15)' : 'none',
    }}>
      {/* Badges row */}
      {(isCheapest || isFastest || rate.isRegistered) && (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
          {isCheapest && (
            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:999,
              background:'rgba(67,97,238,.15)', border:'1px solid rgba(67,97,238,.35)', color:'#4361ee',
              display:'flex', alignItems:'center', gap:4 }}>
              <Zap size={10} fill="#4361ee"/> Cheapest
            </span>
          )}
          {isFastest && (
            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:999,
              background:'rgba(16,185,129,.12)', border:'1px solid rgba(16,185,129,.3)', color:'#059669',
              display:'flex', alignItems:'center', gap:4 }}>
              <Clock size={10}/> Fastest
            </span>
          )}
          {rate.isRegistered && (
            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:999,
              background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', color:'#059669',
              display:'flex', alignItems:'center', gap:4 }}>
              <Building2 size={10}/> Live on ShipFast
            </span>
          )}
        </div>
      )}

      {/* Header row: courier info + price */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0 }}>
          {/* Avatar */}
          <div style={{ width:40, height:40, borderRadius:11, background:`${rate.color}22`,
            border:`1px solid ${rate.color}44`, display:'flex', alignItems:'center', justifyContent:'center',
            color:rate.color, fontWeight:700, fontSize:15, flexShrink:0 }}>
            {rate.courier[0]}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:14, color:'var(--text-primary)', lineHeight:1.2 }}>
              {rate.isRegistered ? rate.registeredName || rate.courier : rate.courier}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3, flexWrap:'wrap' }}>
              <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:11, color:'var(--text-muted)' }}>
                <Star size={10} fill="#f59e0b" color="#f59e0b"/> {rate.rating}
              </span>
              <span style={{ fontSize:11, color:'var(--text-dim)' }}>·</span>
              <span style={{ fontSize:10, fontWeight:600, padding:'1px 7px', borderRadius:999,
                background:`${ZONE[rate.zone]?.color}18`, color:ZONE[rate.zone]?.color }}>
                {ZONE[rate.zone]?.label || rate.zone}
              </span>
            </div>
          </div>
        </div>
        {/* Price */}
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:22,
            color: isCheapest ? '#4361ee' : 'var(--text-primary)', lineHeight:1 }}>
            ₹{rate.totalCost.toFixed(0)}
          </div>
          <div style={{ fontSize:10, color:'var(--text-dim)', marginTop:2 }}>incl. GST</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
        {[
          { icon:<Clock size={11}/>,   val:`${rate.estimatedDays}d`,                           lbl:'Delivery' },
          { icon:<Package size={11}/>, val:`${rate.billableWeight}kg`,                          lbl:'Bill Wt.' },
          { icon:<MapPin size={11}/>,  val:`${((rate.pincodesServed||0)/1000).toFixed(0)}K`,    lbl:'Pincodes' },
        ].map(({ icon, val, lbl }) => (
          <div key={lbl} style={{ background:'var(--bg-base)', border:'1px solid var(--border)', borderRadius:9, padding:'7px 6px', textAlign:'center' }}>
            <div style={{ color:'var(--text-dim)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:3 }}>{icon}</div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{val}</div>
            <div style={{ fontSize:9, color:'var(--text-dim)', marginTop:1 }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Feature pills */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
        {(rate.features||[]).slice(0,4).map(f => (
          <span key={f} style={{ fontSize:9, padding:'2px 7px', borderRadius:999,
            background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--text-muted)' }}>
            {f}
          </span>
        ))}
      </div>

      {/* Breakdown toggle */}
      <button onClick={() => setOpen(p => !p)}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
          paddingTop:10, borderTop:'1px solid var(--divider)', background:'none', border:'none',
          borderTop:'1px solid var(--divider)', cursor:'pointer', color:'var(--text-dim)', fontSize:11, fontFamily:'inherit' }}>
        Price breakdown
        {open ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
      </button>

      {open && (
        <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:5 }}>
          {[
            ['Base Freight',    rate.breakdown?.freight],
            ['Fuel Surcharge',  rate.breakdown?.fuelSurcharge],
            rate.breakdown?.expressCharge > 0 && ['Express Charge', rate.breakdown.expressCharge],
            rate.breakdown?.fragileCharge  > 0 && ['Fragile Handling', rate.breakdown.fragileCharge],
            rate.breakdown?.codCharge      > 0 && ['COD Charge',    rate.breakdown.codCharge],
            ['Subtotal',        rate.breakdown?.subtotal],
            ['GST (18%)',       rate.breakdown?.gst],
          ].filter(Boolean).map(([lbl, val]) => (
            <div key={lbl} style={{ display:'flex', justifyContent:'space-between',
              borderTop: lbl==='Subtotal' ? '1px solid var(--divider)' : 'none',
              paddingTop: lbl==='Subtotal' ? 5 : 0, fontSize:12, fontFamily:'monospace' }}>
              <span style={{ color:'var(--text-muted)' }}>{lbl}</span>
              <span style={{ color:'var(--text-secondary)' }}>₹{(val||0).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid var(--divider)',
            paddingTop:5, fontSize:13, fontWeight:700, fontFamily:'monospace' }}>
            <span style={{ color:'var(--text-primary)' }}>Total</span>
            <span style={{ color:'var(--text-primary)' }}>₹{rate.totalCost.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Book button */}
      <button onClick={() => onBook(rate)} disabled={busy}
        style={{ marginTop:14, width:'100%', padding:'10px 0', background:'#4361ee', color:'white',
          border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:busy?'not-allowed':'pointer',
          opacity:busy?.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          fontFamily:'inherit', transition:'opacity .18s' }}>
        {busy
          ? <><div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>Booking…</>
          : <><CheckCircle size={14}/>Book with {rate.courier}</>}
      </button>
    </div>
  );
}

// ── Summary strip cell ────────────────────────────────────
function SumCell({ label, value, color, sub, last }) {
  return (
    <div style={{ padding:'12px 14px', borderRight: last ? 'none' : '1px solid var(--divider)' }}>
      <div style={{ fontSize:10, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:3 }}>{label}</div>
      <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color }}>{value}</div>
      <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>{sub}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function ComparePage() {
  const { addShipment, user } = useAuth();
  const toast    = useToast();
  const navigate = useNavigate();

  const [rates,      setRates]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [bookBusy,   setBookBusy]   = useState(null); // rate.code being booked
  const [summary,    setSummary]    = useState(null);
  const [sortBy,     setSortBy]     = useState('price');
  const [filterCOD,  setFilterCOD]  = useState(false);
  const [filterLive, setFilterLive] = useState(false);
  const [booked,     setBooked]     = useState(null);
  const [lastParams, setLastParams] = useState(null);

  // ── Compare: call real backend API ──────────────────────
  const handleCompare = useCallback(async (params) => {
    setLoading(true); setRates([]); setSummary(null); setLastParams(params);
    try {
      const d = await userFetch('/rates/compare', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      const results = d.data.rates;
      setRates(results);
      setSummary(d.data.summary);
      toast.info(`Found ${results.length} rates · ${results.filter(r=>r.isRegistered).length} live on ShipFast`, 'Comparison complete');
    } catch(err) {
      toast.error(err.message, 'Comparison failed');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // ── Book: call real backend, persist shipment ───────────
  const handleBook = useCallback(async (rate) => {
    if (!lastParams) return;
    setBookBusy(rate.code);
    try {
      const body = {
        courierCode:   rate.code,
        originPincode: lastParams.originPincode,
        destPincode:   lastParams.destPincode,
        selectedRate:  rate,
        weight:        lastParams.weight,   // top-level fallback for required field
        package: {
          weight:          lastParams.weight,
          length:          lastParams.length,
          breadth:         lastParams.breadth,
          height:          lastParams.height,
          billableWeight:  rate.billableWeight,
          volumetricWeight:rate.volumetricWeight,
        },
        savings:   summary?.potentialSavings || 0,
        isCOD:     lastParams.isCOD,
        codAmount: lastParams.codAmount,
      };
      const d = await userFetch('/shipments/book', { method:'POST', body:JSON.stringify(body) });
      addShipment(d.data);
      setBooked({ ...rate, trackingId: d.data.trackingId || d.data._id });
      toast.success(`Booked with ${rate.courier} · ₹${rate.totalCost.toFixed(0)}`, 'Shipment Booked!');
    } catch(err) {
      toast.error(err.message || 'Booking failed.', 'Booking Failed');
    } finally {
      setBookBusy(null);
    }
  }, [lastParams, summary, addShipment, toast]);

  // ── Sort + filter ────────────────────────────────────────
  const shown = rates
    .filter(r => !filterCOD  || r.supportsCOD)
    .filter(r => !filterLive || r.isRegistered)
    .sort((a, b) => sortBy === 'price' ? a.totalCost - b.totalCost : a.estimatedDays - b.estimatedDays);

  const cheapest = rates[0];
  const fastest  = rates.reduce((f,r) => r.estimatedDays < f.estimatedDays ? r : f, rates[0]);
  const zoneInfo = ZONE[summary?.zone];
  const liveCount = rates.filter(r => r.isRegistered).length;

  // ── Styles ───────────────────────────────────────────────
  const S = {
    page:    { display:'flex', height:'100%' },
    left:    { width:300, flexShrink:0, borderRight:'1px solid var(--divider)', overflowY:'auto', background:'var(--bg-surface)' },
    right:   { flex:1, overflowY:'auto', background:'var(--bg-base)' },
    strip:   { display:'grid', gridTemplateColumns:'repeat(4,1fr)', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', marginBottom:12 },
    toolbar: { display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:14 },
    grid:    { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 },
    empty:   { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:400, gap:12, textAlign:'center' },
    overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 },
    modal:   { background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:18, padding:24, maxWidth:400, width:'100%' },
    sortBtn: (a) => ({ padding:'5px 12px', fontSize:12, fontWeight:a?600:400, border:'none', cursor:'pointer', fontFamily:'inherit',
                       background:a?'#4361ee':'transparent', color:a?'white':'var(--text-muted)', transition:'all .15s' }),
  };

  return (
    <div style={S.page}>
      {/* ── Left: form ─────────────────────────────────── */}
      <div style={S.left}>
        <div style={{ padding:20 }}>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:20, color:'var(--text-primary)' }}>Rate Comparison</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>
              Compare {liveCount > 0 ? `8 couriers · ${liveCount} live on ShipFast` : '8 couriers instantly'}
            </div>
          </div>
          <ShipmentForm onCompare={handleCompare} loading={loading} />
        </div>
      </div>

      {/* ── Right: results ─────────────────────────────── */}
      <div style={S.right}>
        <div style={{ padding:20, paddingBottom:40 }}>

          {/* Summary strip */}
          {summary && (
            <div className="animate-fade-in" style={{ marginBottom:20 }}>
              <div style={S.strip}>
                <SumCell label="Zone"       value={zoneInfo?.label}                        color={zoneInfo?.color} sub={zoneInfo?.desc}    />
                <SumCell label="Cheapest"   value={`₹${summary.cheapestPrice?.toFixed(0)}`} color="#4361ee"        sub={summary.cheapestOption} />
                <SumCell label="Fastest"    value={`${summary.fastestDays}d`}               color="#10b981"        sub={summary.fastestOption} />
                <SumCell label="You Save"   value={`₹${summary.potentialSavings}`}          color="#f59e0b"        sub="vs most expensive" last />
              </div>

              {/* Toolbar */}
              <div style={S.toolbar}>
                <span style={{ fontSize:12, color:'var(--text-dim)' }}>{shown.length} results</span>
                <div style={{ flex:1 }}/>
                {/* COD filter */}
                <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-muted)', cursor:'pointer' }}>
                  <input type="checkbox" checked={filterCOD} onChange={e=>setFilterCOD(e.target.checked)} style={{ accentColor:'#4361ee' }}/>
                  COD only
                </label>
                {/* Live filter — only show if any registered */}
                {liveCount > 0 && (
                  <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-muted)', cursor:'pointer' }}>
                    <input type="checkbox" checked={filterLive} onChange={e=>setFilterLive(e.target.checked)} style={{ accentColor:'#10b981' }}/>
                    Live only
                  </label>
                )}
                {/* Sort */}
                <div style={{ display:'flex', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
                  {[['price','By Price'],['speed','By Speed']].map(([v,l])=>(
                    <button key={v} onClick={()=>setSortBy(v)} style={S.sortBtn(sortBy===v)}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div style={S.grid}>
              {[...Array(6)].map((_,i) => (
                <div key={i} style={{ height:220, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, animation:'pulse 1.4s ease-in-out infinite' }}/>
              ))}
            </div>
          )}

          {/* Rate cards */}
          {!loading && shown.length > 0 && (
            <div style={S.grid}>
              {shown.map((rate, i) => (
                <RateCard key={rate.code} rate={rate}
                  isCheapest={rate.code === cheapest?.code}
                  isFastest={rate.code === fastest?.code && fastest?.estimatedDays < (shown[1]?.estimatedDays || 999)}
                  onBook={handleBook} bookBusy={bookBusy}/>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && rates.length === 0 && (
            <div style={S.empty}>
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, width:56, height:56, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Truck size={26} color="var(--text-dim)"/>
              </div>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--text-muted)' }}>Ready to compare</div>
              <div style={{ fontSize:13, color:'var(--text-dim)', maxWidth:260 }}>Enter shipment details and click Compare to see live rates from 8 couriers.</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Booking success modal ─────────────────────── */}
      {booked && (
        <div style={S.overlay} className="animate-fade-in">
          <div style={S.modal}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <div style={{ width:40, height:40, borderRadius:12, background:'rgba(16,185,129,.15)', border:'1px solid rgba(16,185,129,.3)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
                  <CheckCircle size={20} color="#10b981"/>
                </div>
                <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color:'var(--text-primary)' }}>Shipment Booked!</div>
                <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>Successfully booked with {booked.courier}</div>
              </div>
              <button onClick={()=>setBooked(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)', padding:4 }}>
                <X size={16}/>
              </button>
            </div>

            <div style={{ background:'var(--bg-base)', border:'1px solid var(--border)', borderRadius:12, padding:14, marginBottom:16, display:'flex', flexDirection:'column', gap:10 }}>
              {[
                ['Tracking ID', <span style={{ fontFamily:'monospace', color:'#4361ee', fontSize:13, fontWeight:600 }}>{booked.trackingId}</span>],
                ['Courier',     <span style={{ color:booked.color, fontWeight:600 }}>{booked.courier}</span>],
                ['Zone',        <span style={{ textTransform:'capitalize', color:'var(--text-secondary)' }}>{booked.zone}</span>],
                ['Total Cost',  <strong style={{ color:'var(--text-primary)' }}>₹{booked.totalCost.toFixed(2)}</strong>],
                ['Est. Delivery',<span style={{ color:'var(--text-secondary)' }}>{booked.estimatedDays} business day{booked.estimatedDays>1?'s':''}</span>],
                ...(booked.isRegistered ? [['Status', <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:999, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.3)', color:'#059669' }}>Sent to courier dashboard</span>]] : []),
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13 }}>
                  <span style={{ color:'var(--text-muted)' }}>{k}</span>{v}
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>{ setBooked(null); navigate('/shipments'); }}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px 0',
                  background:'none', border:'1px solid var(--border)', borderRadius:10, fontSize:13,
                  color:'var(--text-muted)', cursor:'pointer', fontFamily:'inherit' }}>
                <ExternalLink size={14}/> View Shipments
              </button>
              <button onClick={()=>setBooked(null)}
                style={{ flex:1, padding:'10px 0', background:'#4361ee', border:'none', borderRadius:10,
                  fontSize:13, fontWeight:600, color:'white', cursor:'pointer', fontFamily:'inherit' }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
}
