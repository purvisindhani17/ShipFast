import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, Package, Clock, DollarSign, Zap, BarChart3, RefreshCw, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const COURIER_COLORS = {
  Delhivery:'#D3232A', BlueDart:'#003087', DTDC:'#FF6B00',
  Ekart:'#F7A800', XpressBees:'#FF4500', Shiprocket:'#6C00FF',
  'Ecom Express':'#009A44', 'FedEx India':'#4D148C',
};
const ZONE_COLORS = { National:'#a855f7', Regional:'#f59e0b', Metro:'#3b82f6', Local:'#10b981', Unknown:'#6b7280' };
const STATUS_COLORS = { booked:'#a855f7', picked_up:'#f59e0b', in_transit:'#3b82f6', delivered:'#10b981', cancelled:'#ef4444', draft:'#6b7280' };

/* ── Compute all analytics from the shipments array ── */
function useAnalytics(shipments) {
  return useMemo(() => {
    const total   = shipments.length;
    const totalSavings = shipments.reduce((s, x) => s + (x.savings || 0), 0);
    const totalCost    = shipments.reduce((s, x) => s + (x.rateSelected?.totalCost || x.totalCost || 0), 0);
    const avgSaving    = total ? +(totalSavings / total).toFixed(2) : 0;
    const timeSaved    = +(total * 0.5).toFixed(1); // 30 min per shipment

    // Monthly — last 6 months
    const now = new Date();
    const monthly = Array.from({ length: 6 }, (_, i) => {
      const d   = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const end = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1);
      const label = d.toLocaleString('en-IN', { month: 'short' });
      const bucket = shipments.filter(s => { const c = new Date(s.createdAt); return c >= d && c < end; });
      return {
        month:   label,
        count:   bucket.length,
        savings: +bucket.reduce((s, x) => s + (x.savings || 0), 0).toFixed(0),
        cost:    +bucket.reduce((s, x) => s + (x.rateSelected?.totalCost || x.totalCost || 0), 0).toFixed(0),
      };
    });

    // Courier usage
    const courierMap = {};
    shipments.forEach(s => { if (s.courier) courierMap[s.courier] = (courierMap[s.courier] || 0) + 1; });
    const courierUsage = Object.entries(courierMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, color: COURIER_COLORS[name] || '#4361ee', pct: total ? Math.round(value / total * 100) : 0 }));

    // Zone breakdown
    const zoneMap = {};
    shipments.forEach(s => {
      const z = s.rateSelected?.zone || 'unknown';
      const label = z.charAt(0).toUpperCase() + z.slice(1);
      zoneMap[label] = (zoneMap[label] || 0) + 1;
    });
    const zoneBreakdown = Object.entries(zoneMap)
      .sort((a, b) => b[1] - a[1])
      .map(([zone, count]) => ({ zone, count, color: ZONE_COLORS[zone] || '#6b7280' }));

    // Status breakdown
    const statusMap = {};
    shipments.forEach(s => { const k = s.status || 'unknown'; statusMap[k] = (statusMap[k] || 0) + 1; });
    const statusBreakdown = Object.entries(statusMap).map(([status, count]) => ({ status, count, color: STATUS_COLORS[status] || '#6b7280' }));

    // Recent 5
    const recent = [...shipments]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    return { total, totalSavings, totalCost, avgSaving, timeSaved, monthly, courierUsage, zoneBreakdown, statusBreakdown, recent };
  }, [shipments]);
}

/* ── Reusable chart tooltip ── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:10, padding:'8px 12px', fontSize:12 }}>
      <p style={{ color:'var(--text-dim)', marginBottom:4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color || p.fill, fontFamily:'monospace' }}>
          {p.name}: {p.name === 'savings' || p.name === 'cost' ? `₹${Number(p.value).toLocaleString('en-IN')}` : p.value}
        </p>
      ))}
    </div>
  );
}

/* ── Stat card ── */
function StatCard({ icon: Icon, label, value, sub, iconColor, iconBg }) {
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 20px' }}>
      <div style={{ width:34, height:34, borderRadius:10, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
        <Icon style={{ width:16, height:16, color:iconColor }} />
      </div>
      <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:24, color:'var(--text-primary)', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:6 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:3 }}>{sub}</div>}
    </div>
  );
}

/* ── Section card ── */
function Card({ children, title, sub, icon: Icon, style: extraStyle = {} }) {
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 20px', ...extraStyle }}>
      {title && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:600, fontSize:14, color:'var(--text-primary)' }}>{title}</div>
            {sub && <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>{sub}</div>}
          </div>
          {Icon && <Icon style={{ width:15, height:15, color:'var(--text-dim)' }} />}
        </div>
      )}
      {children}
    </div>
  );
}

/* ── Main ── */
export default function DashboardPage() {
  const { shipments, refreshShipments } = useAuth();
  const stats = useAnalytics(shipments);

  const axisStyle = { fill:'var(--text-dim)', fontSize:11 };
  const gridStyle = { stroke:'var(--divider)', strokeDasharray:'3 3' };

  const fmt = (n) => n >= 1000 ? `₹${(n/1000).toFixed(1)}K` : `₹${n}`;

  return (
    <div style={{ padding:24, maxWidth:1100, color:'var(--text-primary)' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:24 }}>Analytics</div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>
            Live stats computed from your {stats.total} real shipment{stats.total !== 1 ? 's' : ''}
          </div>
        </div>
        <button onClick={refreshShipments}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:9, fontSize:12, color:'var(--text-muted)', cursor:'pointer', fontWeight:500 }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      {/* Empty state */}
      {stats.total === 0 && (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'60px 24px', textAlign:'center', marginBottom:24 }}>
          <Truck style={{ width:40, height:40, color:'var(--text-dim)', margin:'0 auto 14px' }} />
          <div style={{ fontSize:16, fontWeight:600, color:'var(--text-muted)', marginBottom:6 }}>No shipments yet</div>
          <div style={{ fontSize:13, color:'var(--text-dim)' }}>Book your first shipment from the Compare page — stats will appear here instantly.</div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:18 }}>
        <StatCard icon={Package}    label="Total Shipments"       value={stats.total.toLocaleString('en-IN')}                 sub={stats.total > 0 ? 'Your real shipments' : 'Book one to start'}  iconColor="#4361ee" iconBg="rgba(67,97,238,.12)" />
        <StatCard icon={DollarSign} label="Total Saved"           value={fmt(stats.totalSavings)}                              sub="vs most expensive rate"           iconColor="#10b981" iconBg="rgba(16,185,129,.12)" />
        <StatCard icon={Clock}      label="Time Saved"            value={`${stats.timeSaved}h`}                               sub="~30 min/shipment"                 iconColor="#f59e0b" iconBg="rgba(245,158,11,.12)" />
        <StatCard icon={Zap}        label="Avg Saving/Shipment"   value={stats.avgSaving > 0 ? `₹${stats.avgSaving}` : '—'}  sub="across all couriers"              iconColor="#a855f7" iconBg="rgba(168,85,247,.12)" />
      </div>

      {/* Row 1: Monthly bar + Courier pie */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14, marginBottom:14 }}>

        {/* Monthly shipments & savings */}
        <Card title="Monthly Volume & Savings" sub="Last 6 months — live from your bookings" icon={BarChart3}>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={stats.monthly} barSize={13} barGap={3}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="count"   name="Shipments" fill="#4361ee"             radius={[4,4,0,0]} />
              <Bar dataKey="savings" name="savings"   fill="rgba(16,185,129,.5)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', gap:16, marginTop:8 }}>
            {[['#4361ee','Shipments'],['rgba(16,185,129,.8)','Savings (₹)']].map(([c,l]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text-dim)' }}>
                <div style={{ width:10, height:10, borderRadius:2, background:c }} />{l}
              </div>
            ))}
          </div>
        </Card>

        {/* Courier usage donut */}
        <Card title="Courier Usage" sub="Shipments by courier">
          {stats.courierUsage.length === 0 ? (
            <div style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-dim)', fontSize:13 }}>No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={stats.courierUsage} dataKey="value" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3}>
                    {stats.courierUsage.map((e, i) => <Cell key={i} fill={e.color} opacity={0.9} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:10, fontSize:12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
                {stats.courierUsage.map(c => (
                  <div key={c.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:c.color }} />
                      <span style={{ color:'var(--text-muted)' }}>{c.name}</span>
                    </div>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <span style={{ fontFamily:'monospace', color:'var(--text-secondary)' }}>{c.value}</span>
                      <span style={{ fontSize:10, color:'var(--text-dim)' }}>{c.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Row 2: Savings trend + Zone + Status */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:14, marginBottom:14 }}>

        {/* Savings trend line chart */}
        <Card title="Savings Trend" sub="Monthly savings in ₹" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={stats.monthly}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${v/1000}K` : v} />
              <Tooltip content={<ChartTip />} />
              <Line type="monotone" dataKey="savings" name="savings" stroke="#10b981" strokeWidth={2.5} dot={{ fill:'#10b981', r:4 }} activeDot={{ r:6 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Zone breakdown bars */}
        <Card title="Zones" sub="By delivery zone">
          {stats.zoneBreakdown.length === 0 ? (
            <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-dim)', fontSize:13 }}>No data</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12, paddingTop:4 }}>
              {stats.zoneBreakdown.map(z => (
                <div key={z.zone}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                    <span style={{ color:'var(--text-muted)' }}>{z.zone}</span>
                    <span style={{ fontFamily:'monospace', color:'var(--text-secondary)', fontWeight:600 }}>{z.count}</span>
                  </div>
                  <div style={{ height:5, background:'var(--bg-base)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:3, background:z.color, width:`${stats.total ? Math.round(z.count/stats.total*100) : 0}%`, transition:'width .6s ease' }} />
                  </div>
                </div>
              ))}
              <div style={{ paddingTop:8, borderTop:'1px solid var(--divider)', fontSize:11, color:'var(--text-dim)' }}>
                Total: {stats.total} shipments
              </div>
            </div>
          )}
        </Card>

        {/* Status breakdown */}
        <Card title="Status" sub="Shipment statuses">
          {stats.statusBreakdown.length === 0 ? (
            <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-dim)', fontSize:13 }}>No data</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10, paddingTop:4 }}>
              {stats.statusBreakdown.map(s => (
                <div key={s.status} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:s.color }} />
                    <span style={{ fontSize:12, color:'var(--text-muted)', textTransform:'capitalize' }}>{s.status.replace('_',' ')}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:50, height:4, background:'var(--bg-base)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:'100%', background:s.color, width:`${stats.total ? Math.round(s.count/stats.total*100) : 0}%`, borderRadius:2 }} />
                    </div>
                    <span style={{ fontSize:12, fontFamily:'monospace', color:'var(--text-secondary)', minWidth:20, textAlign:'right' }}>{s.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent shipments table */}
      {stats.recent.length > 0 && (
        <Card title="Recent Shipments" sub="Last 5 bookings">
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 140px 100px 100px 110px', gap:12, padding:'8px 0', borderBottom:'1px solid var(--divider)', fontSize:10, fontWeight:600, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'.05em' }}>
              <div>Tracking ID</div><div>Courier</div><div>Destination</div><div>Cost</div><div>Status</div>
            </div>
            {stats.recent.map((s, i) => {
              const sid = s.trackingId || s.id || s._id || `#${i}`;
              const statusColor = STATUS_COLORS[s.status] || '#6b7280';
              return (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 140px 100px 100px 110px', gap:12, padding:'11px 0', borderBottom: i < stats.recent.length-1 ? '1px solid var(--divider)' : 'none', alignItems:'center', fontSize:13 }}>
                  <div style={{ fontFamily:'monospace', fontSize:12, color:'#4361ee', fontWeight:600 }}>{sid}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background: COURIER_COLORS[s.courier] || '#888', flexShrink:0 }} />
                    <span style={{ color:'var(--text-secondary)', fontSize:12 }}>{s.courier}</span>
                  </div>
                  <div style={{ fontFamily:'monospace', fontSize:12, color:'var(--text-muted)' }}>{s.destination?.pincode || s.destination || '—'}</div>
                  <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>
                    ₹{(s.rateSelected?.totalCost || s.totalCost || 0).toFixed(0)}
                  </div>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:999, background:`${statusColor}18`, border:`1px solid ${statusColor}40`, fontSize:11, fontWeight:600, color:statusColor, width:'fit-content', textTransform:'capitalize' }}>
                    {(s.status || 'unknown').replace('_',' ')}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

    </div>
  );
}
