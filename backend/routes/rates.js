const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const { calculateRate, determineZone, COURIER_DATA } = require('../controllers/rateEngine');

const useDB = () => mongoose.connection.readyState === 1;

// ── POST /api/rates/compare ───────────────────────────────
router.post('/compare', async (req, res) => {
  try {
    const { originPincode, destPincode, weight, length, breadth, height,
            isCOD, codAmount, isExpress, isFragile } = req.body;

    // Validation
    if (!originPincode || !destPincode || !weight)
      return res.status(400).json({ success:false, message:'Origin pincode, destination pincode and weight are required.' });
    if (!/^\d{6}$/.test(originPincode) || !/^\d{6}$/.test(destPincode))
      return res.status(400).json({ success:false, message:'Pincodes must be 6 digits.' });
    if (parseFloat(weight) <= 0 || parseFloat(weight) > 70)
      return res.status(400).json({ success:false, message:'Weight must be between 0.1 and 70 kg.' });

    const params = {
      originPincode, destPincode,
      weight:    parseFloat(weight),
      length:    length  ? parseFloat(length)  : null,
      breadth:   breadth ? parseFloat(breadth) : null,
      height:    height  ? parseFloat(height)  : null,
      isCOD:     Boolean(isCOD),
      codAmount: parseFloat(codAmount) || 0,
      isExpress: Boolean(isExpress),
      isFragile: Boolean(isFragile),
    };

    // ── Fetch registered courier companies ───────────────
    // Build a map of courierCode → company info so we can overlay it on the rates
    const registeredMap = {};
    if (useDB()) {
      try {
        // Make sure the model is registered before querying
        const CourierCompany = require('../models/CourierCompany');
        const companies = await CourierCompany.find({ isActive: true })
          .select('name courierCode logoColor phone address totalDelivered');
        console.log(`✅ Found ${companies.length} registered companies:`, companies.map(c => c.courierCode));
        companies.forEach(c => {
          registeredMap[c.courierCode.toUpperCase().trim()] = c;
        });
      } catch (dbErr) {
        console.error('⚠️  Could not load registered companies:', dbErr.message);
      }
    } else {
      console.warn('⚠️  DB not connected — no registered companies will appear');
    }

    // ── Calculate rates + overlay registered data ────────
    const rates = COURIER_DATA.map(courier => {
      const r   = calculateRate(courier, params);
      const reg = registeredMap[courier.code.toUpperCase()];
      if (reg) {
        r.isRegistered   = true;
        r.registeredName = reg.name;
        r.color          = reg.logoColor || courier.color;
        r.totalDelivered = reg.totalDelivered || 0;
      } else {
        r.isRegistered = false;
      }
      return r;
    })
    .filter(r => r.isAvailable)
    .sort((a, b) => a.totalCost - b.totalCost);

    const zone     = determineZone(originPincode, destPincode);
    const cheapest = rates[0];
    const priciest = rates[rates.length - 1];
    const fastest  = rates.reduce((f, r) => r.estimatedDays < f.estimatedDays ? r : f, rates[0]);

    res.json({
      success: true,
      data: {
        rates,
        registeredCount: Object.keys(registeredMap).length,
        summary: {
          zone,
          totalCouriers:    rates.length,
          registeredCount:  rates.filter(r => r.isRegistered).length,
          cheapestOption:   cheapest?.courier,
          cheapestPrice:    cheapest?.totalCost,
          fastestOption:    fastest?.courier,
          fastestDays:      fastest?.estimatedDays,
          potentialSavings: priciest ? +(priciest.totalCost - cheapest.totalCost).toFixed(2) : 0,
        },
      },
    });
  } catch (err) {
    console.error('Rate comparison error:', err);
    res.status(500).json({ success:false, message:'Rate calculation failed: ' + err.message });
  }
});

// GET /api/rates/zones
router.get('/zones', (_req, res) => {
  res.json({ success:true, data:{ zones:['local','metro','regional','national'] } });
});

// GET /api/rates/pincode-info/:pincode
router.get('/pincode-info/:pincode', (req, res) => {
  const MAP = {
    '110001':{city:'New Delhi',state:'Delhi'}, '400001':{city:'Mumbai',state:'Maharashtra'},
    '560001':{city:'Bangalore',state:'Karnataka'}, '600001':{city:'Chennai',state:'Tamil Nadu'},
    '700001':{city:'Kolkata',state:'West Bengal'}, '500001':{city:'Hyderabad',state:'Telangana'},
    '141001':{city:'Ludhiana',state:'Punjab'}, '302001':{city:'Jaipur',state:'Rajasthan'},
  };
  res.json({ success:true, data: MAP[req.params.pincode] || { city:'Unknown City', state:'Unknown State' } });
});

module.exports = router;
