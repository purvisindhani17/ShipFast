import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Pencil, Trash2, RefreshCw, Phone, Truck, CheckCircle, XCircle, Package } from 'lucide-react';
import { useToast } from '../../context/AppContext';
import { companyFetch } from '../../context/AuthContext';

const VEHICLES = ['bike','scooter','car','van','truck'];
const V_ICON = { bike:'🏍️', scooter:'🛵', car:'🚗', van:'🚐', truck:'🚚' };
const EMPTY = { name:'', phone:'', email:'', vehicleType:'bike', vehicleNumber:'' };

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:16, padding:24, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, paddingBottom:14, borderBottom:'1px solid var(--divider)' }}>
          <span style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:15, color:'var(--text-primary)' }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)', fontSize:18 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AgentForm({ form, setForm, onSubmit, onCancel, saving, isEdit }) {
  const s = k => e => setForm(p=>({...p,[k]:e.target.value}));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div>
          <label style={{ display:'block', fontSize:12, color:'var(--text-muted)', marginBottom:5 }}>Name *</label>
          <input value={form.name} onChange={s('name')} placeholder="Rahul Sharma" className="input-field" autoFocus/>
        </div>
        <div>
          <label style={{ display:'block', fontSize:12, color:'var(--text-muted)', marginBottom:5 }}>Phone *</label>
          <input value={form.phone} onChange={s('phone')} placeholder="9876543210" className="input-field"/>
        </div>
        <div>
          <label style={{ display:'block', fontSize:12, color:'var(--text-muted)', marginBottom:5 }}>Email</label>
          <input type="email" value={form.email} onChange={s('email')} placeholder="Optional" className="input-field"/>
        </div>
        <div>
          <label style={{ display:'block', fontSize:12, color:'var(--text-muted)', marginBottom:5 }}>Vehicle Number</label>
          <input value={form.vehicleNumber} onChange={s('vehicleNumber')} placeholder="DL 1A 1234" className="input-field" style={{ textTransform:'uppercase' }}/>
        </div>
      </div>
      <div>
        <label style={{ display:'block', fontSize:12, color:'var(--text-muted)', marginBottom:5 }}>Vehicle Type</label>
        <select value={form.vehicleType} onChange={s('vehicleType')} className="input-field">
          {VEHICLES.map(v => <option key={v} value={v}>{V_ICON[v]} {v.charAt(0).toUpperCase()+v.slice(1)}</option>)}
        </select>
      </div>
      <div style={{ display:'flex', gap:8, marginTop:4 }}>
        <button onClick={onCancel} style={{ flex:1, padding:'9px 0', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:9, cursor:'pointer', fontSize:13, color:'var(--text-muted)', fontFamily:'inherit' }}>Cancel</button>
        <button onClick={onSubmit} disabled={saving}
          style={{ flex:1, padding:'9px 0', background:'#4361ee', border:'none', borderRadius:9, cursor:saving?'not-allowed':'pointer', fontSize:13, fontWeight:600, color:'white', fontFamily:'inherit', opacity:saving?.7:1 }}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Agent'}
        </button>
      </div>
    </div>
  );
}

function AgentCard({ agent, onEdit, onDelete, onToggle, busyId }) {
  const busy = busyId===agent._id;
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'14px 18px', display:'flex', alignItems:'center', gap:14 }}>
      <div style={{ width:44, height:44, borderRadius:12, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
        background: agent.isAvailable?'rgba(16,185,129,.1)':'rgba(239,68,68,.07)',
        border: `1px solid ${agent.isAvailable?'rgba(16,185,129,.25)':'rgba(239,68,68,.18)'}` }}>
        {V_ICON[agent.vehicleType]||'🏍️'}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <span style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{agent.name}</span>
          <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:999,
            background: agent.isAvailable?'rgba(16,185,129,.1)':'rgba(239,68,68,.08)',
            border: `1px solid ${agent.isAvailable?'rgba(16,185,129,.3)':'rgba(239,68,68,.2)'}`,
            color: agent.isAvailable?'#059669':'#dc2626' }}>
            {agent.isAvailable?'Available':'On Delivery'}
          </span>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:12, fontSize:12, color:'var(--text-muted)' }}>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><Phone size={11}/>{agent.phone}</span>
          <span style={{ display:'flex', alignItems:'center', gap:4, textTransform:'capitalize' }}><Truck size={11}/>{agent.vehicleType}{agent.vehicleNumber?` · ${agent.vehicleNumber}`:''}</span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><Package size={11}/>{agent.totalDeliveries} deliveries</span>
        </div>
      </div>
      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
        {[
          { icon: agent.isAvailable?XCircle:CheckCircle, color: agent.isAvailable?'#ef4444':'#10b981', onClick:()=>onToggle(agent), title: agent.isAvailable?'Mark unavailable':'Mark available' },
          { icon:Pencil,  color:'var(--text-muted)', onClick:()=>onEdit(agent),   title:'Edit' },
          { icon:Trash2,  color:'#ef4444',           onClick:()=>onDelete(agent), title:'Remove', danger:true },
        ].map(({ icon:Icon, color, onClick, title, danger }) => (
          <button key={title} onClick={onClick} disabled={busy} title={title}
            style={{ width:32, height:32, borderRadius:8, border:`1px solid ${danger?'rgba(239,68,68,.2)':'var(--border)'}`,
              background: danger?'rgba(239,68,68,.04)':'var(--bg-card)', cursor:busy?'not-allowed':'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=danger?'rgba(239,68,68,.45)':'var(--border-hover)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=danger?'rgba(239,68,68,.2)':'var(--border)'; }}>
            {busy && !danger ? <div style={{ width:13, height:13, border:'2px solid rgba(100,100,100,.3)', borderTopColor:'#4361ee', borderRadius:'50%', animation:'spin .7s linear infinite' }}/> : <Icon size={13} color={color}/>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CourierAgentsPage() {
  const toast = useToast();
  const [agents,    setAgents]    = useState([]);
  const [busy,      setBusy]      = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [busyId,    setBusyId]    = useState(null);
  const [addOpen,   setAddOpen]   = useState(false);
  const [editAgent, setEditAgent] = useState(null);
  const [delAgent,  setDelAgent]  = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [filter,    setFilter]    = useState('all');

  const load = useCallback(async () => {
    setBusy(true);
    try { const d = await companyFetch('/agents'); setAgents(d.data||[]); }
    catch(ex) { toast.error(ex.message,'Failed'); }
    finally { setBusy(false); }
  }, [toast]);

  useEffect(()=>{ load(); },[load]);

  async function handleAdd() {
    if (!form.name||!form.phone) { toast.warning('Name and phone required.'); return; }
    setSaving(true);
    try {
      const d = await companyFetch('/agents', { method:'POST', body:JSON.stringify(form) });
      setAgents(p=>[d.data,...p]); setAddOpen(false); toast.success(`${d.data.name} added!`,'Agent Added');
    } catch(ex) { toast.error(ex.message); }
    finally { setSaving(false); }
  }

  async function handleEdit() {
    if (!form.name||!form.phone) { toast.warning('Name and phone required.'); return; }
    setSaving(true);
    try {
      const d = await companyFetch(`/agents/${editAgent._id}`, { method:'PUT', body:JSON.stringify(form) });
      setAgents(p=>p.map(a=>a._id===editAgent._id?d.data:a)); setEditAgent(null); toast.success('Agent updated.','Saved');
    } catch(ex) { toast.error(ex.message); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await companyFetch(`/agents/${delAgent._id}`, { method:'DELETE' });
      setAgents(p=>p.filter(a=>a._id!==delAgent._id)); setDelAgent(null); toast.success('Agent removed.');
    } catch(ex) { toast.error(ex.message); }
    finally { setSaving(false); }
  }

  async function handleToggle(agent) {
    setBusyId(agent._id);
    try {
      const d = await companyFetch(`/agents/${agent._id}`, { method:'PUT', body:JSON.stringify({...agent, isAvailable:!agent.isAvailable}) });
      setAgents(p=>p.map(a=>a._id===agent._id?d.data:a));
      toast.info(`${agent.name} marked as ${!agent.isAvailable?'available':'unavailable'}.`);
    } catch(ex) { toast.error(ex.message); }
    finally { setBusyId(null); }
  }

  const filtered = agents.filter(a => filter==='all'||( filter==='available'?a.isAvailable:!a.isAvailable));
  const avail = agents.filter(a=>a.isAvailable).length;

  return (
    <div style={{ padding:24, maxWidth:900, color:'var(--text-primary)' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:24 }}>Delivery Agents</div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>{agents.length} total · {avail} available · {agents.length-avail} on delivery</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={load} disabled={busy}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:9, fontSize:12, color:'var(--text-muted)', cursor:'pointer', fontFamily:'inherit' }}>
            <RefreshCw size={13} style={{ animation:busy?'spin .8s linear infinite':undefined }}/> Refresh
          </button>
          <button onClick={()=>{ setForm(EMPTY); setAddOpen(true); }}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'#4361ee', border:'none', borderRadius:9, fontSize:13, fontWeight:600, color:'white', cursor:'pointer', fontFamily:'inherit' }}>
            <Plus size={14}/> Add Agent
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {[['Total Fleet',agents.length,'#4361ee','rgba(67,97,238,.1)'],['Available',avail,'#059669','rgba(16,185,129,.1)'],['On Delivery',agents.length-avail,'#7c3aed','rgba(168,85,247,.1)']].map(([l,v,c,bg])=>(
          <div key={l} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 16px', textAlign:'center' }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:26, color:c }}>{v}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display:'flex', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', width:'fit-content', marginBottom:18 }}>
        {[['all','All'],['available','Available'],['busy','On Delivery']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)}
            style={{ padding:'7px 16px', fontSize:12, fontWeight:filter===v?600:400, border:'none', cursor:'pointer',
              background:filter===v?'#4361ee':'transparent', color:filter===v?'white':'var(--text-muted)', fontFamily:'inherit', transition:'all .15s' }}>
            {l}
          </button>
        ))}
      </div>

      {busy && agents.length===0 ? [...Array(3)].map((_,i)=>(
        <div key={i} style={{ height:82, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, marginBottom:10, animation:'pulse 1.4s ease-in-out infinite' }}/>
      )) : filtered.length===0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-dim)', fontSize:13 }}>
          <Users size={36} style={{ margin:'0 auto 14px', opacity:.3, display:'block' }}/>
          {agents.length===0?'Add your first delivery agent to start assigning shipments.':'No agents match this filter.'}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(a => <AgentCard key={a._id} agent={a} onEdit={ag=>{ setForm({name:ag.name,phone:ag.phone,email:ag.email||'',vehicleType:ag.vehicleType,vehicleNumber:ag.vehicleNumber||''}); setEditAgent(ag); }} onDelete={setDelAgent} onToggle={handleToggle} busyId={busyId}/>)}
        </div>
      )}

      <Modal open={addOpen}    onClose={()=>setAddOpen(false)}   title="Add Delivery Agent"><AgentForm form={form} setForm={setForm} onSubmit={handleAdd}  onCancel={()=>setAddOpen(false)}   saving={saving} isEdit={false}/></Modal>
      <Modal open={!!editAgent} onClose={()=>setEditAgent(null)} title="Edit Agent">          <AgentForm form={form} setForm={setForm} onSubmit={handleEdit} onCancel={()=>setEditAgent(null)} saving={saving} isEdit/></Modal>
      <Modal open={!!delAgent}  onClose={()=>setDelAgent(null)}  title="Remove Agent">
        <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:20, lineHeight:1.6 }}>Remove <strong style={{ color:'var(--text-primary)' }}>{delAgent?.name}</strong> from your fleet? This cannot be undone.</p>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>setDelAgent(null)} style={{ flex:1, padding:'9px 0', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:9, cursor:'pointer', fontSize:13, color:'var(--text-muted)', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={handleDelete} disabled={saving} style={{ flex:1, padding:'9px 0', background:'#ef4444', border:'none', borderRadius:9, cursor:saving?'not-allowed':'pointer', fontSize:13, fontWeight:600, color:'white', fontFamily:'inherit' }}>{saving?'Removing…':'Yes, Remove'}</button>
        </div>
      </Modal>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
}
