import { useState, useEffect } from 'react';
import { Star, MapPin, Package, Check, X, RefreshCw, Building2 } from 'lucide-react';
import { userFetch } from '../context/AuthContext';

const STATIC = [
  { name:'Delhivery',   code:'DLV',  color:'#D3232A', rating:4.3, pins:18500, maxW:50, features:['COD','Express','Fragile','Insurance','Air'],   days:{local:1,metro:1,regional:3,national:5}, base:{local:37,metro:47,regional:58,national:75} },
  { name:'BlueDart',    code:'BDT',  color:'#003087', rating:4.6, pins:15000, maxW:70, features:['COD','Express','Fragile','Insurance'],          days:{local:1,metro:1,regional:2,national:3}, base:{local:55,metro:72,regional:95,national:130} },
  { name:'DTDC',        code:'DTDC', color:'#FF6B00', rating:3.9, pins:17000, maxW:50, features:['COD','Express','Surface','Fragile'],            days:{local:1,metro:2,regional:3,national:6}, base:{local:32,metro:42,regional:52,national:68} },
  { name:'Ekart',       code:'EKT',  color:'#F7A800', rating:3.7, pins:12000, maxW:40, features:['COD','Surface'],                               days:{local:1,metro:2,regional:4,national:7}, base:{local:29,metro:38,regional:48,national:62} },
  { name:'XpressBees',  code:'XPB',  color:'#FF4500', rating:4.1, pins:16000, maxW:50, features:['COD','Express','Fragile','Insurance','Air'],   days:{local:1,metro:1,regional:3,national:5}, base:{local:33,metro:44,regional:55,national:72} },
  { name:'Shiprocket',  code:'SRT',  color:'#6C00FF', rating:4.0, pins:24000, maxW:50, features:['COD','Express','Fragile','Insurance','Air','Surface'], days:{local:1,metro:2,regional:3,national:5}, base:{local:35,metro:45,regional:57,national:74} },
  { name:'Ecom Express',code:'ECX',  color:'#009A44', rating:4.0, pins:27000, maxW:50, features:['COD','Express','Surface','Fragile'],            days:{local:1,metro:2,regional:3,national:6}, base:{local:31,metro:41,regional:51,national:66} },
  { name:'FedEx India', code:'FDX',  color:'#4D148C', rating:4.5, pins:14000, maxW:70, features:['Express','Fragile','Insurance','Air'],          days:{local:1,metro:1,regional:2,national:3}, base:{local:60,metro:80,regional:105,national:145} },
];
const ZONES = ['local','metro','regional','national'];
const ZC = { local:'#10b981', metro:'#3b82f6', regional:'#f59e0b', national:'#a855f7' };
const ALL_FEATS = ['COD','Express','Fragile','Insurance','Air','Surface'];

export default function CouriersPage() {
  const [companies, setCompanies] = useState([]);  // registered on ShipFast
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    userFetch('/company/list')
      .then(d => setCompanies(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Merge: mark static couriers as "registered" if a company with matching code exists
  const registeredCodes = new Set(companies.map(c => c.courierCode));

  return (
    <div style={{ padding:24, maxWidth:1200, color:'var(--text-primary)' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:24 }}>Courier Network</div>
        <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>8 integrated couriers · {companies.length} registered on ShipFast</div>
      </div>

      {/* Registered companies banner */}
      {companies.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
            <Building2 size={13}/> REGISTERED COURIER PARTNERS
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {companies.map(c => (
              <div key={c._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--bg-card)', border:`1px solid ${c.logoColor}44`, borderRadius:12 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:c.logoColor+'22', display:'flex', alignItems:'center', justifyContent:'center', color:c.logoColor, fontWeight:700, fontSize:13 }}>{c.name[0]}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{c.name}</div>
                  <div style={{ fontSize:10, color:'var(--text-dim)', fontFamily:'monospace' }}>{c.courierCode} · Active</div>
                </div>
                <div style={{ width:7, height:7, borderRadius:'50%', background:'#10b981', marginLeft:4 }}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {[['8 Couriers','Integrated partners'],['27K+ Pincodes','Total coverage'],['₹29 Starting','Rate per 500g']].map(([v,l])=>(
          <div key={l} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px', textAlign:'center' }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:20, color:'var(--text-primary)' }}>{v}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, overflow:'auto' }}>
        <table style={{ width:'100%', fontSize:12, borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--divider)' }}>
              <th style={{ textAlign:'left', padding:'10px 16px', color:'var(--text-dim)', fontWeight:600, fontSize:10, textTransform:'uppercase', letterSpacing:'.05em', whiteSpace:'nowrap' }}>Courier</th>
              <th style={{ textAlign:'left', padding:'10px 10px', color:'var(--text-dim)', fontWeight:600, fontSize:10, textTransform:'uppercase', letterSpacing:'.05em' }}>Rating</th>
              <th style={{ textAlign:'left', padding:'10px 10px', color:'var(--text-dim)', fontWeight:600, fontSize:10, textTransform:'uppercase', letterSpacing:'.05em' }}>Pincodes</th>
              <th style={{ textAlign:'left', padding:'10px 10px', color:'var(--text-dim)', fontWeight:600, fontSize:10, textTransform:'uppercase', letterSpacing:'.05em' }}>Max Wt</th>
              {ZONES.map(z => <th key={z} style={{ textAlign:'center', padding:'10px 8px', color:ZC[z], fontWeight:600, fontSize:10, textTransform:'uppercase', letterSpacing:'.05em' }}>{z}</th>)}
              {ALL_FEATS.map(f => <th key={f} style={{ textAlign:'center', padding:'10px 5px', color:'var(--text-dim)', fontWeight:600, fontSize:9, writingMode:'vertical-lr', transform:'rotate(180deg)', height:64 }}>{f}</th>)}
              <th style={{ textAlign:'center', padding:'10px 10px', color:'var(--text-dim)', fontWeight:600, fontSize:10, textTransform:'uppercase' }}>On ShipFast</th>
            </tr>
          </thead>
          <tbody>
            {STATIC.map((c, i) => {
              const isReg = registeredCodes.has(c.code);
              return (
                <tr key={c.code} style={{ borderBottom: i<STATIC.length-1?'1px solid var(--divider)':'none' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg-base)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:30, height:30, borderRadius:8, background:c.color+'22', display:'flex', alignItems:'center', justifyContent:'center', color:c.color, fontWeight:700, fontSize:12 }}>{c.name[0]}</div>
                      <div>
                        <div style={{ fontWeight:600, color:'var(--text-primary)' }}>{c.name}</div>
                        <div style={{ fontSize:10, fontFamily:'monospace', color:'var(--text-dim)' }}>{c.code}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'12px 10px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <Star size={12} color="#f59e0b" fill="#f59e0b"/>
                      <span style={{ fontFamily:'monospace', color:'var(--text-secondary)' }}>{c.rating}</span>
                    </div>
                  </td>
                  <td style={{ padding:'12px 10px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:4, color:'var(--text-muted)' }}>
                      <MapPin size={11}/><span style={{ fontFamily:'monospace' }}>{(c.pins/1000).toFixed(0)}K</span>
                    </div>
                  </td>
                  <td style={{ padding:'12px 10px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:4, color:'var(--text-muted)' }}>
                      <Package size={11}/><span style={{ fontFamily:'monospace' }}>{c.maxW}kg</span>
                    </div>
                  </td>
                  {ZONES.map(z => (
                    <td key={z} style={{ padding:'12px 8px', textAlign:'center' }}>
                      <div style={{ fontSize:12, fontFamily:'monospace', fontWeight:600, color:ZC[z] }}>₹{c.base[z]}</div>
                      <div style={{ fontSize:10, color:'var(--text-dim)', marginTop:1 }}>{c.days[z]}d</div>
                    </td>
                  ))}
                  {ALL_FEATS.map(f => (
                    <td key={f} style={{ padding:'12px 5px', textAlign:'center' }}>
                      {c.features.includes(f) ? <Check size={13} color="#10b981"/> : <X size={13} color="var(--text-dim)" opacity={0.4}/>}
                    </td>
                  ))}
                  <td style={{ padding:'12px 10px', textAlign:'center' }}>
                    {isReg ? (
                      <span style={{ fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:999, background:'rgba(16,185,129,.12)', border:'1px solid rgba(16,185,129,.3)', color:'#059669', display:'inline-flex', alignItems:'center', gap:4 }}>
                        <div style={{ width:5, height:5, borderRadius:'50%', background:'#10b981' }}/> Live
                      </span>
                    ) : (
                      <span style={{ fontSize:10, color:'var(--text-dim)' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:10 }}>* Base prices for 500g shipment excl. GST &amp; fuel surcharge. "Live" = company registered and actively receiving bookings on ShipFast.</p>
    </div>
  );
}
