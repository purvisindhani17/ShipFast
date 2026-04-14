const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');

const authRouter = require('./auth');
const protect    = authRouter.protect;

const useDB = () => mongoose.connection.readyState === 1;

// ── GET /api/analytics/dashboard ─────────────────────────
// Returns stats computed from the authenticated user's real shipments.
router.get('/dashboard', protect, async (req, res) => {
  try {
    if (!useDB()) {
      // No DB — return empty structure so frontend can compute from its local store
      return res.json({ success: true, source: 'local', data: null });
    }

    const Shipment = require('../models/Shipment');
    const userId   = req.user._id;

    // All shipments for this user
    const all = await Shipment.find({ user: userId }).lean();
    const total = all.length;
    const totalSavings = all.reduce((s, x) => s + (x.savings || 0), 0);
    const avgSaving    = total ? +(totalSavings / total).toFixed(2) : 0;
    const timeSaved    = +(total * 0.5).toFixed(1); // 30 min per shipment

    // Monthly breakdown — last 6 months
    const now   = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = d.toLocaleString('en-IN', { month: 'short' });
      const bucket = all.filter(s => {
        const c = new Date(s.createdAt);
        return c >= d && c < end;
      });
      months.push({
        month:   label,
        count:   bucket.length,
        savings: +bucket.reduce((s, x) => s + (x.savings || 0), 0).toFixed(0),
      });
    }

    // Courier usage
    const courierMap = {};
    all.forEach(s => {
      if (!s.courier) return;
      courierMap[s.courier] = (courierMap[s.courier] || 0) + 1;
    });
    const COLORS = { Delhivery:'#D3232A', BlueDart:'#003087', DTDC:'#FF6B00', Ekart:'#F7A800', XpressBees:'#FF4500', Shiprocket:'#6C00FF', 'Ecom Express':'#009A44', 'FedEx India':'#4D148C' };
    const courierUsage = Object.entries(courierMap)
      .sort((a, b) => b[1] - a[1])
      .map(([courier, count]) => ({ courier, count, color: COLORS[courier] || '#4361ee', percentage: total ? Math.round(count / total * 100) : 0 }));

    // Zone breakdown
    const zoneMap = {};
    all.forEach(s => {
      const z = s.rateSelected?.zone || 'unknown';
      zoneMap[z] = (zoneMap[z] || 0) + 1;
    });
    const ZONE_COLORS = { national:'#a855f7', regional:'#f59e0b', metro:'#3b82f6', local:'#10b981', unknown:'#6b7280' };
    const zoneBreakdown = Object.entries(zoneMap)
      .sort((a, b) => b[1] - a[1])
      .map(([zone, count]) => ({ zone: zone.charAt(0).toUpperCase() + zone.slice(1), count, color: ZONE_COLORS[zone] || '#6b7280' }));

    // Status breakdown
    const statusMap = {};
    all.forEach(s => { statusMap[s.status] = (statusMap[s.status] || 0) + 1; });

    // Recent 5 shipments
    const recent = all
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(s => ({
        id: s.trackingId || s._id,
        courier: s.courier,
        totalCost: s.rateSelected?.totalCost || 0,
        status: s.status,
        createdAt: s.createdAt,
        destination: s.destination?.pincode,
      }));

    res.json({
      success: true,
      source: 'db',
      data: {
        totalShipments: total,
        totalSavings:   +totalSavings.toFixed(0),
        avgSavingPerShipment: avgSaving,
        timeSaved,
        monthlyShipments: months,
        courierUsage,
        zoneBreakdown,
        statusBreakdown: statusMap,
        recentShipments: recent,
      },
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, message: 'Failed to compute analytics.' });
  }
});

module.exports = router;
