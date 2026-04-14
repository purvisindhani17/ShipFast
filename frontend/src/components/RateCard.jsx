import { Clock, Star, MapPin, Package, ChevronDown, ChevronUp, Check, Zap } from 'lucide-react';
import { useState } from 'react';

const ZONE_LABELS = { local: 'Local', metro: 'Metro', regional: 'Regional', national: 'National' };
const ZONE_COLORS = { local: 'text-emerald-400 bg-emerald-400/10', metro: 'text-blue-400 bg-blue-400/10', regional: 'text-amber-400 bg-amber-400/10', national: 'text-purple-400 bg-purple-400/10' };

export default function RateCard({ rate, rank, isCheapest, isFastest, onBook }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`card glass-hover rate-card-enter cursor-pointer transition-all duration-200 
      ${isCheapest ? 'border-brand-500/40 bg-brand-500/[0.06]' : ''}
      ${rank === 0 ? 'ring-1 ring-brand-500/30' : ''}`}>

      {/* Badges */}
      {(isCheapest || isFastest) && (
        <div className="flex gap-2 mb-3">
          {isCheapest && (
            <span className="badge bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3" fill="currentColor" /> Cheapest
            </span>
          )}
          {isFastest && (
            <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Fastest
            </span>
          )}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        {/* Courier info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/10 text-lg font-bold"
            style={{ backgroundColor: rate.color + '22', color: rate.color }}>
            {rate.courier[0]}
          </div>
          <div className="min-w-0">
            <div className="font-display font-semibold text-base">{rate.courier}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-amber-400" fill="currentColor" />
                <span className="text-xs text-white/50">{rate.rating}</span>
              </div>
              <span className="text-white/20">·</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${ZONE_COLORS[rate.zone]}`}>
                {ZONE_LABELS[rate.zone]}
              </span>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="text-right flex-shrink-0">
          <div className="font-display font-bold text-2xl" style={{ color: isCheapest ? '#60a5fa' : 'white' }}>
            ₹{rate.totalCost.toFixed(0)}
          </div>
          <div className="text-xs text-white/30 mt-0.5">incl. GST</div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="bg-white/[0.03] rounded-lg px-2.5 py-2 text-center">
          <div className="flex items-center justify-center gap-1 text-white/40 mb-1">
            <Clock className="w-3 h-3" />
          </div>
          <div className="text-sm font-semibold">{rate.estimatedDays}d</div>
          <div className="text-[10px] text-white/30">Delivery</div>
        </div>
        <div className="bg-white/[0.03] rounded-lg px-2.5 py-2 text-center">
          <div className="flex items-center justify-center gap-1 text-white/40 mb-1">
            <Package className="w-3 h-3" />
          </div>
          <div className="text-sm font-semibold">{rate.billableWeight}kg</div>
          <div className="text-[10px] text-white/30">Bill Wt.</div>
        </div>
        <div className="bg-white/[0.03] rounded-lg px-2.5 py-2 text-center">
          <div className="flex items-center justify-center gap-1 text-white/40 mb-1">
            <MapPin className="w-3 h-3" />
          </div>
          <div className="text-sm font-semibold">{(rate.pincodesServed / 1000).toFixed(0)}K</div>
          <div className="text-[10px] text-white/30">Pincodes</div>
        </div>
      </div>

      {/* Features */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {rate.features.slice(0, 4).map(f => (
          <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-white/40 border border-white/[0.06]">
            {f}
          </span>
        ))}
      </div>

      {/* Expand breakdown */}
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06] text-xs text-white/40 hover:text-white/70 transition-colors">
        <span>Price breakdown</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-1.5 text-xs font-mono animate-fade-in">
          {[
            ['Base Freight', rate.breakdown.freight],
            ['Fuel Surcharge', rate.breakdown.fuelSurcharge],
            rate.breakdown.expressCharge > 0 && ['Express Charge', rate.breakdown.expressCharge],
            rate.breakdown.fragileCharge > 0 && ['Fragile Handling', rate.breakdown.fragileCharge],
            rate.breakdown.codCharge > 0 && ['COD Charge', rate.breakdown.codCharge],
            ['Subtotal', rate.breakdown.subtotal],
            ['GST (18%)', rate.breakdown.gst],
          ].filter(Boolean).map(([label, value]) => (
            <div key={label} className={`flex justify-between ${label === 'Subtotal' ? 'border-t border-white/[0.06] pt-1.5 mt-1' : ''}`}>
              <span className="text-white/40">{label}</span>
              <span className={label === 'Subtotal' || label === 'GST (18%)' ? 'text-white/70' : 'text-white/50'}>₹{value.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-white/[0.06] pt-1.5 mt-1 font-bold text-sm text-white">
            <span>Total</span>
            <span>₹{rate.totalCost.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Book button */}
      <button onClick={() => onBook(rate)}
        className="mt-4 w-full btn-primary flex items-center justify-center gap-2 text-sm">
        <Check className="w-4 h-4" />
        Book with {rate.courier}
      </button>
    </div>
  );
}
