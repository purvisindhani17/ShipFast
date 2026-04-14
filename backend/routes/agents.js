const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const { protect } = require('./company');

const memAgents = [];
const useDB = () => mongoose.connection.readyState === 1;

router.get('/', protect, async (req, res) => {
  try {
    if (useDB()) {
      const agents = await require('../models/DeliveryAgent').find({ company: req.company._id }).sort({ createdAt: -1 });
      return res.json({ success: true, data: agents });
    }
    res.json({ success: true, data: memAgents.filter(a => String(a.companyId) === String(req.company._id)) });
  } catch(err) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const { name, phone, email, vehicleType, vehicleNumber } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone required.' });
    if (useDB()) {
      const agent = await require('../models/DeliveryAgent').create({ company: req.company._id, name, phone, email, vehicleType, vehicleNumber });
      return res.status(201).json({ success: true, message: 'Agent added!', data: agent });
    }
    const agent = { _id: 'ma_'+Date.now(), companyId: String(req.company._id), name, phone, email: email||'', vehicleType: vehicleType||'bike', vehicleNumber: vehicleNumber||'', isAvailable: true, totalDeliveries: 0, createdAt: new Date() };
    memAgents.push(agent);
    res.status(201).json({ success: true, message: 'Agent added!', data: agent });
  } catch(err) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const { name, phone, email, vehicleType, vehicleNumber, isAvailable } = req.body;
    if (useDB()) {
      const agent = await require('../models/DeliveryAgent').findOneAndUpdate(
        { _id: req.params.id, company: req.company._id },
        { name, phone, email, vehicleType, vehicleNumber, isAvailable }, { new: true }
      );
      if (!agent) return res.status(404).json({ success: false, message: 'Agent not found.' });
      return res.json({ success: true, data: agent });
    }
    const a = memAgents.find(a => a._id === req.params.id);
    if (a) Object.assign(a, { name, phone, email, vehicleType, vehicleNumber, isAvailable });
    res.json({ success: true, data: a });
  } catch(err) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    if (useDB()) {
      await require('../models/DeliveryAgent').findOneAndDelete({ _id: req.params.id, company: req.company._id });
      return res.json({ success: true, message: 'Agent removed.' });
    }
    const i = memAgents.findIndex(a => a._id === req.params.id);
    if (i > -1) memAgents.splice(i, 1);
    res.json({ success: true, message: 'Agent removed.' });
  } catch(err) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

module.exports = router;
