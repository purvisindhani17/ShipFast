const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose  = require('mongoose');
require('dotenv').config();

const app = express();

// ── Middleware ────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: "https://ship-fast-pymrjpl0m-purvisindhani17-6957s-projects.vercel.app" || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Rate limiter — high enough for dev use, returns JSON so frontend can parse it
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ success: false, message: 'Too many requests. Please slow down and try again.' });
  },
});
app.use('/api/', limiter);

// ── MongoDB ───────────────────────────────────────────────
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shipfast';

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    console.log('✅  MongoDB connected →', MONGO_URI);

    // ── One-time migration: drop the broken shipmentId_1 unique index ──
    // This index was created with `unique: true` on the `shipment` field alone,
    // which caused duplicate-key errors when shipment was null.
    // We now use a compound (shipment + company) sparse index instead.
    try {
      const db = mongoose.connection.db;
      const indexes = await db.collection('bookings').indexes();
      const badIndex = indexes.find(idx =>
        idx.name === 'shipmentId_1' ||
        (idx.key && idx.key.shipmentId !== undefined && idx.unique) ||
        (idx.key && JSON.stringify(idx.key) === '{"shipment":1}' && idx.unique)
      );
      if (badIndex) {
        await db.collection('bookings').dropIndex(badIndex.name);
        console.log('✅  Dropped bad bookings index:', badIndex.name);
      }
      // Also delete any null-shipment bookings left from previous failed inserts
      const deleted = await db.collection('bookings').deleteMany({ shipment: null });
      if (deleted.deletedCount > 0) {
        console.log(`✅  Cleaned up ${deleted.deletedCount} null-shipment booking(s)`);
      }
    } catch (migErr) {
      // Non-fatal — collection might not exist yet on first run
      if (!migErr.message.includes('ns not found')) {
        console.warn('⚠️   Index migration warning:', migErr.message);
      }
    }
  })
  .catch(err => {
    console.warn('⚠️   MongoDB NOT connected:', err.message);
    console.warn('    Routes will use in-memory fallback until DB is available.');
  });

// expose connection state to routes
app.locals.dbConnected = () => mongoose.connection.readyState === 1;

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/rates',     require('./routes/rates'));
app.use('/api/shipments', require('./routes/shipments'));
app.use('/api/couriers',  require('./routes/couriers'));
app.use('/api/analytics', require('./routes/analytics'));
// Courier company routes (same backend, different role)
app.use('/api/company',   require('./routes/company'));
app.use('/api/bookings',  require('./routes/bookings'));
app.use('/api/agents',    require('./routes/agents'));

// ── Health ────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({
  status: 'OK',
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  timestamp: new Date()
}));

// ── Root status page ──────────────────────────────────────
app.get('/', (_req, res) => res.send(`<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><title>ShipFast API</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px}
.box{max-width:560px;width:100%}.badge{display:inline-flex;align-items:center;gap:6px;background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.3);color:#4ade80;border-radius:20px;padding:4px 12px;font-size:13px;margin-bottom:20px}
.dot{width:8px;height:8px;background:#4ade80;border-radius:50%;animation:p 2s infinite}@keyframes p{0%,100%{opacity:1}50%{opacity:.4}}
h1{font-size:28px;font-weight:700;margin-bottom:8px}h1 span{color:#4361ee}p{color:#94a3b8;margin-bottom:24px;font-size:14px}
.table{background:#1e293b;border:1px solid #334155;border-radius:10px;overflow:hidden}.th{padding:10px 18px;background:#1e293b;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;border-bottom:1px solid #334155}
.row{display:flex;align-items:center;gap:10px;padding:10px 18px;border-bottom:1px solid #0f172a;font-size:13px}.row:last-child{border-bottom:none}
.m{font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px;font-family:monospace}.get{background:rgba(59,130,246,.15);color:#60a5fa}.post{background:rgba(34,197,94,.15);color:#4ade80}.put{background:rgba(245,158,11,.15);color:#fbbf24}
.path{font-family:monospace;flex:1}.desc{color:#64748b;font-size:12px}
.note{margin-top:16px;background:rgba(67,97,238,.1);border:1px solid rgba(67,97,238,.25);border-radius:8px;padding:12px 16px;font-size:12px;color:#818cf8}</style>
</head><body><div class="box">
<div class="badge"><span class="dot"></span> Running on port ${process.env.PORT || 5000}</div>
<h1>ShipFast <span>API</span></h1>
<p>All endpoints are prefixed with <code style="background:#1e293b;padding:2px 6px;border-radius:4px">/api</code></p>
<div class="table">
  <div class="th">Endpoint</div>
  <div class="row"><span class="m post">POST</span><span class="path">/api/auth/register</span><span class="desc">Create account</span></div>
  <div class="row"><span class="m post">POST</span><span class="path">/api/auth/login</span><span class="desc">Login → JWT</span></div>
  <div class="row"><span class="m get">GET</span><span class="path">/api/auth/me</span><span class="desc">Current user (auth)</span></div>
  <div class="row"><span class="m put">PUT</span><span class="path">/api/auth/profile</span><span class="desc">Update profile</span></div>
  <div class="row"><span class="m put">PUT</span><span class="path">/api/auth/password</span><span class="desc">Change password</span></div>
  <div class="row"><span class="m post">POST</span><span class="path">/api/rates/compare</span><span class="desc">Compare courier rates</span></div>
  <div class="row"><span class="m get">GET</span><span class="path">/api/shipments</span><span class="desc">My shipments</span></div>
  <div class="row"><span class="m post">POST</span><span class="path">/api/shipments/book</span><span class="desc">Book a shipment</span></div>
  <div class="row"><span class="m get">GET</span><span class="path">/api/couriers</span><span class="desc">Courier list</span></div>
  <div class="row"><span class="m get">GET</span><span class="path">/api/analytics/dashboard</span><span class="desc">Analytics</span></div>
  <div class="row"><span class="m get">GET</span><span class="path">/api/health</span><span class="desc">DB status + health</span></div>
</div>
<div class="note">Frontend → <a href="http://localhost:5173" style="color:#818cf8">http://localhost:5173</a></div>
</div></body></html>`));

// ── 404 + Error handlers ──────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` }));
app.use((err, _req, res, _next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('');
  console.log('  ⚡ ShipFast API');
  console.log(`  🚀 http://localhost:${PORT}`);
  console.log(`  🌐 Frontend: http://localhost:5173`);
  console.log('');
});

module.exports = app;
