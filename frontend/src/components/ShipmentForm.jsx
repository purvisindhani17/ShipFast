import { useState } from 'react';
import { MapPin, Package, Weight, DollarSign, Zap, AlertTriangle, RotateCcw } from 'lucide-react';

const INIT = {
  originPincode:'141001', destPincode:'400001',
  weight:'2', length:'', breadth:'', height:'',
  isCOD:false, codAmount:'', isExpress:false, isFragile:false,
};

function Field({ label, error, hint, children }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:11, fontWeight:500, color:'var(--text-muted)', marginBottom:4 }}>{label}</label>
      {children}
      {error && <p style={{ fontSize:11, color:'#ef4444', marginTop:3 }}>{error}</p>}
      {hint && !error && <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:3 }}>{hint}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, label, desc }) {
  return (
    <label style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', padding:'4px 0' }}>
      <div>
        <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{label}</div>
        {desc && <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:1 }}>{desc}</div>}
      </div>
      <div onClick={() => onChange(!checked)}
        style={{ width:36, height:20, borderRadius:10, background:checked?'#4361ee':'var(--border)',
          cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0, marginLeft:12 }}>
        <div style={{ position:'absolute', top:2, left:checked?18:2, width:16, height:16, borderRadius:'50%',
          background:'white', transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }}/>
      </div>
    </label>
  );
}

function Section({ icon:Icon, title, children }) {
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 14px 12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12, paddingBottom:10, borderBottom:'1px solid var(--divider)' }}>
        <Icon size={13} color="#4361ee"/>
        <span style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'.04em' }}>{title}</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>{children}</div>
    </div>
  );
}

export default function ShipmentForm({ onCompare, loading }) {
  const [form, setForm]     = useState(INIT);
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(p=>({...p,[k]:v})); if(errors[k]) setErrors(p=>({...p,[k]:''})); };

  function validate() {
    const e = {};
    if (!/^\d{6}$/.test(form.originPincode)) e.originPincode = 'Enter valid 6-digit pincode';
    if (!/^\d{6}$/.test(form.destPincode))   e.destPincode   = 'Enter valid 6-digit pincode';
    if (!form.weight || parseFloat(form.weight)<=0) e.weight = 'Enter valid weight';
    if (parseFloat(form.weight) > 70)               e.weight = 'Max weight is 70kg';
    if (form.isCOD && (!form.codAmount || parseFloat(form.codAmount)<=0)) e.codAmount = 'Enter COD amount';
    setErrors(e);
    return !Object.keys(e).length;
  }

  function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    onCompare({
      ...form,
      weight:   parseFloat(form.weight),
      length:   form.length  ? parseFloat(form.length)  : null,
      breadth:  form.breadth ? parseFloat(form.breadth) : null,
      height:   form.height  ? parseFloat(form.height)  : null,
      codAmount:parseFloat(form.codAmount)||0,
    });
  }

  const volW = form.length && form.breadth && form.height
    ? (parseFloat(form.length)*parseFloat(form.breadth)*parseFloat(form.height)/5000).toFixed(2)
    : null;

  return (
    <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:12 }}>

      <Section icon={MapPin} title="Route">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <Field label="Origin Pincode" error={errors.originPincode} hint="From city">
            <input value={form.originPincode} onChange={e=>set('originPincode',e.target.value)}
              placeholder="110001" maxLength={6} className="input-field"/>
          </Field>
          <Field label="Destination Pincode" error={errors.destPincode} hint="To city">
            <input value={form.destPincode} onChange={e=>set('destPincode',e.target.value)}
              placeholder="400001" maxLength={6} className="input-field"/>
          </Field>
        </div>
      </Section>

      <Section icon={Package} title="Package">
        <Field label="Dead Weight (kg)" error={errors.weight}>
          <input type="number" value={form.weight} onChange={e=>set('weight',e.target.value)}
            placeholder="2.5" step="0.1" min="0.1" max="70" className="input-field"/>
        </Field>
        <div>
          <label style={{ display:'block', fontSize:11, fontWeight:500, color:'var(--text-muted)', marginBottom:4 }}>
            Dimensions (cm) — optional for volumetric weight
          </label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {['length','breadth','height'].map(dim=>(
              <div key={dim}>
                <input type="number" value={form[dim]} onChange={e=>set(dim,e.target.value)}
                  placeholder={dim[0].toUpperCase()} min="0" className="input-field"
                  style={{ textAlign:'center' }}/>
                <div style={{ fontSize:9, color:'var(--text-dim)', textAlign:'center', marginTop:3, textTransform:'capitalize' }}>{dim}</div>
              </div>
            ))}
          </div>
          {volW && (
            <div style={{ marginTop:6, fontSize:11, color:'#4361ee', fontFamily:'monospace' }}>
              Volumetric wt: {volW} kg · Billable: {Math.max(parseFloat(form.weight)||0, parseFloat(volW), 0.5).toFixed(2)} kg
            </div>
          )}
        </div>
      </Section>

      <Section icon={Zap} title="Options">
        <Toggle checked={form.isCOD}     onChange={v=>set('isCOD',v)}     label="Cash on Delivery (COD)" desc="Collect at delivery"/>
        {form.isCOD && (
          <Field label="COD Amount (₹)" error={errors.codAmount}>
            <input type="number" value={form.codAmount} onChange={e=>set('codAmount',e.target.value)}
              placeholder="1500" min="0" className="input-field"/>
          </Field>
        )}
        <Toggle checked={form.isExpress} onChange={v=>set('isExpress',v)} label="Express Delivery" desc="Faster, 30–60% higher cost"/>
        <Toggle checked={form.isFragile} onChange={v=>set('isFragile',v)} label="Fragile Handling"  desc="Extra care & padding"/>
        {form.isExpress && (
          <div style={{ display:'flex', gap:7, background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.25)', borderRadius:9, padding:'8px 11px' }}>
            <AlertTriangle size={13} color="#d97706" style={{ flexShrink:0, marginTop:1 }}/>
            <p style={{ fontSize:11, color:'#d97706', lineHeight:1.5 }}>Express adds 30–60% to base freight. Not all couriers support it.</p>
          </div>
        )}
      </Section>

      {/* Actions */}
      <div style={{ display:'flex', gap:10 }}>
        <button type="button" onClick={()=>{ setForm(INIT); setErrors({}); }}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'9px 14px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, fontSize:12, color:'var(--text-muted)', cursor:'pointer', fontFamily:'inherit' }}>
          <RotateCcw size={12}/> Reset
        </button>
        <button type="submit" disabled={loading}
          style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7,
            padding:'10px 0', background:'#4361ee', color:'white', border:'none', borderRadius:10,
            fontSize:13, fontWeight:600, cursor:loading?'not-allowed':'pointer', opacity:loading?.7:1,
            fontFamily:'inherit', transition:'opacity .18s' }}>
          {loading
            ? <><div style={{ width:15, height:15, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>Comparing…</>
            : <><Zap size={14} fill="white"/>Compare All Rates</>}
        </button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </form>
  );
}
