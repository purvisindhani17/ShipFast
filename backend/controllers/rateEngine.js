// Rate calculation engine - mimics real courier pricing logic
// In production, these would call live courier APIs

const COURIER_DATA = [
  {
    name: 'Delhivery',
    code: 'DLV',
    color: '#D3232A',
    rating: 4.3,
    avgDeliveryDays: { local: 1, metro: 1, regional: 3, national: 5 },
    volumetricDivisor: 5000,
    maxWeight: 50,
    pincodesServed: 18500,
    features: ['COD', 'Express', 'Fragile', 'Insurance', 'Surface', 'Air'],
    zones: {
      local:    { baseWeight: 0.5, basePrice: 37,  additionalPerKg: 10, fuelSurcharge: 14 },
      metro:    { baseWeight: 0.5, basePrice: 47,  additionalPerKg: 14, fuelSurcharge: 14 },
      regional: { baseWeight: 0.5, basePrice: 58,  additionalPerKg: 18, fuelSurcharge: 14 },
      national: { baseWeight: 0.5, basePrice: 75,  additionalPerKg: 24, fuelSurcharge: 14 },
    },
    codCharge: { type: 'percentage', value: 1.75, min: 30 },
    expressMultiplier: 1.5,
  },
  {
    name: 'BlueDart',
    code: 'BDT',
    color: '#003087',
    rating: 4.6,
    avgDeliveryDays: { local: 1, metro: 1, regional: 2, national: 3 },
    volumetricDivisor: 5000,
    maxWeight: 70,
    pincodesServed: 15000,
    features: ['COD', 'Express', 'Fragile', 'Insurance', 'Temperature-Controlled'],
    zones: {
      local:    { baseWeight: 0.5, basePrice: 55,  additionalPerKg: 20, fuelSurcharge: 18 },
      metro:    { baseWeight: 0.5, basePrice: 72,  additionalPerKg: 28, fuelSurcharge: 18 },
      regional: { baseWeight: 0.5, basePrice: 95,  additionalPerKg: 38, fuelSurcharge: 18 },
      national: { baseWeight: 0.5, basePrice: 130, additionalPerKg: 52, fuelSurcharge: 18 },
    },
    codCharge: { type: 'percentage', value: 2.0, min: 40 },
    expressMultiplier: 1.3,
  },
  {
    name: 'DTDC',
    code: 'DTDC',
    color: '#FF6B00',
    rating: 3.9,
    avgDeliveryDays: { local: 1, metro: 2, regional: 3, national: 6 },
    volumetricDivisor: 5000,
    maxWeight: 50,
    pincodesServed: 17000,
    features: ['COD', 'Express', 'Surface', 'Fragile'],
    zones: {
      local:    { baseWeight: 0.5, basePrice: 32,  additionalPerKg: 8,  fuelSurcharge: 12 },
      metro:    { baseWeight: 0.5, basePrice: 42,  additionalPerKg: 13, fuelSurcharge: 12 },
      regional: { baseWeight: 0.5, basePrice: 52,  additionalPerKg: 17, fuelSurcharge: 12 },
      national: { baseWeight: 0.5, basePrice: 68,  additionalPerKg: 22, fuelSurcharge: 12 },
    },
    codCharge: { type: 'percentage', value: 1.5, min: 25 },
    expressMultiplier: 1.4,
  },
  {
    name: 'Ekart',
    code: 'EKT',
    color: '#F7A800',
    rating: 3.7,
    avgDeliveryDays: { local: 1, metro: 2, regional: 4, national: 7 },
    volumetricDivisor: 5000,
    maxWeight: 40,
    pincodesServed: 12000,
    features: ['COD', 'Surface'],
    zones: {
      local:    { baseWeight: 0.5, basePrice: 29,  additionalPerKg: 7,  fuelSurcharge: 10 },
      metro:    { baseWeight: 0.5, basePrice: 38,  additionalPerKg: 11, fuelSurcharge: 10 },
      regional: { baseWeight: 0.5, basePrice: 48,  additionalPerKg: 15, fuelSurcharge: 10 },
      national: { baseWeight: 0.5, basePrice: 62,  additionalPerKg: 20, fuelSurcharge: 10 },
    },
    codCharge: { type: 'flat', value: 40 },
    expressMultiplier: 1.6,
  },
  {
    name: 'XpressBees',
    code: 'XPB',
    color: '#FF4500',
    rating: 4.1,
    avgDeliveryDays: { local: 1, metro: 1, regional: 3, national: 5 },
    volumetricDivisor: 5000,
    maxWeight: 50,
    pincodesServed: 16000,
    features: ['COD', 'Express', 'Fragile', 'Insurance', 'Air'],
    zones: {
      local:    { baseWeight: 0.5, basePrice: 33,  additionalPerKg: 9,  fuelSurcharge: 13 },
      metro:    { baseWeight: 0.5, basePrice: 44,  additionalPerKg: 13, fuelSurcharge: 13 },
      regional: { baseWeight: 0.5, basePrice: 55,  additionalPerKg: 17, fuelSurcharge: 13 },
      national: { baseWeight: 0.5, basePrice: 72,  additionalPerKg: 23, fuelSurcharge: 13 },
    },
    codCharge: { type: 'percentage', value: 1.6, min: 28 },
    expressMultiplier: 1.45,
  },
  {
    name: 'Shiprocket',
    code: 'SRT',
    color: '#6C00FF',
    rating: 4.0,
    avgDeliveryDays: { local: 1, metro: 2, regional: 3, national: 5 },
    volumetricDivisor: 5000,
    maxWeight: 50,
    pincodesServed: 24000,
    features: ['COD', 'Express', 'Fragile', 'Insurance', 'Air', 'Surface'],
    zones: {
      local:    { baseWeight: 0.5, basePrice: 35,  additionalPerKg: 9,  fuelSurcharge: 13 },
      metro:    { baseWeight: 0.5, basePrice: 45,  additionalPerKg: 13, fuelSurcharge: 13 },
      regional: { baseWeight: 0.5, basePrice: 57,  additionalPerKg: 17, fuelSurcharge: 13 },
      national: { baseWeight: 0.5, basePrice: 74,  additionalPerKg: 22, fuelSurcharge: 13 },
    },
    codCharge: { type: 'percentage', value: 1.8, min: 30 },
    expressMultiplier: 1.4,
  },
  {
    name: 'Ecom Express',
    code: 'ECX',
    color: '#009A44',
    rating: 4.0,
    avgDeliveryDays: { local: 1, metro: 2, regional: 3, national: 6 },
    volumetricDivisor: 5000,
    maxWeight: 50,
    pincodesServed: 27000,
    features: ['COD', 'Express', 'Surface', 'Fragile'],
    zones: {
      local:    { baseWeight: 0.5, basePrice: 31,  additionalPerKg: 8,  fuelSurcharge: 11 },
      metro:    { baseWeight: 0.5, basePrice: 41,  additionalPerKg: 12, fuelSurcharge: 11 },
      regional: { baseWeight: 0.5, basePrice: 51,  additionalPerKg: 16, fuelSurcharge: 11 },
      national: { baseWeight: 0.5, basePrice: 66,  additionalPerKg: 21, fuelSurcharge: 11 },
    },
    codCharge: { type: 'percentage', value: 1.5, min: 25 },
    expressMultiplier: 1.5,
  },
  {
    name: 'FedEx India',
    code: 'FDX',
    color: '#4D148C',
    rating: 4.5,
    avgDeliveryDays: { local: 1, metro: 1, regional: 2, national: 3 },
    volumetricDivisor: 5000,
    maxWeight: 70,
    pincodesServed: 14000,
    features: ['Express', 'Fragile', 'Insurance', 'Temperature-Controlled', 'Air'],
    zones: {
      local:    { baseWeight: 0.5, basePrice: 60,  additionalPerKg: 22, fuelSurcharge: 20 },
      metro:    { baseWeight: 0.5, basePrice: 80,  additionalPerKg: 30, fuelSurcharge: 20 },
      regional: { baseWeight: 0.5, basePrice: 105, additionalPerKg: 42, fuelSurcharge: 20 },
      national: { baseWeight: 0.5, basePrice: 145, additionalPerKg: 58, fuelSurcharge: 20 },
    },
    codCharge: { type: 'flat', value: 0 }, // FedEx doesn't do COD typically
    expressMultiplier: 1.25,
  },
];

// Zone determination based on pincode pairs (simplified logic)
function determineZone(originPin, destPin) {
  const origin = parseInt(originPin.substring(0, 2));
  const dest = parseInt(destPin.substring(0, 2));

  if (originPin === destPin) return 'local';
  
  const diff = Math.abs(origin - dest);
  
  // Metro zones (Delhi-NCR, Mumbai, Bangalore, Chennai, Hyderabad, Kolkata)
  const metroZones = [[11, 12, 13], [40, 41, 42, 43], [56, 56], [60, 61, 62, 63], [50, 50], [70, 71, 72]];
  const isMetro = (code) => metroZones.some(zone => zone.includes(code));
  
  if (isMetro(origin) && isMetro(dest) && diff <= 5) return 'metro';
  if (diff <= 3) return 'regional';
  if (diff <= 15) return 'regional';
  return 'national';
}

// Calculate billable weight
function getBillableWeight(weight, length, breadth, height, divisor) {
  const actualWeight = parseFloat(weight) || 0;
  if (!length || !breadth || !height) return Math.max(actualWeight, 0.5);
  
  const volumetricWeight = (parseFloat(length) * parseFloat(breadth) * parseFloat(height)) / divisor;
  return Math.max(actualWeight, volumetricWeight, 0.5);
}

// Main rate calculation for one courier
function calculateRate(courier, params) {
  const { originPincode, destPincode, weight, length, breadth, height, isCOD, codAmount, isExpress, isFragile } = params;
  
  const zone = determineZone(originPincode, destPincode);
  const zoneData = courier.zones[zone];
  const billableWeight = getBillableWeight(weight, length, breadth, height, courier.volumetricDivisor);
  const volumetricWeight = (length && breadth && height) ? (length * breadth * height) / courier.volumetricDivisor : null;
  
  // Base freight calculation
  let freight = zoneData.basePrice;
  const extraWeight = Math.max(0, billableWeight - zoneData.baseWeight);
  freight += extraWeight * zoneData.additionalPerKg;
  
  // Fuel surcharge
  const fuelSurcharge = (freight * zoneData.fuelSurcharge) / 100;
  
  // Express surcharge
  let expressCharge = 0;
  if (isExpress) {
    expressCharge = freight * (courier.expressMultiplier - 1);
  }
  
  // Fragile surcharge
  const fragileCharge = isFragile ? Math.max(freight * 0.05, 15) : 0;
  
  // COD charge
  let codCharge = 0;
  if (isCOD && courier.features.includes('COD')) {
    if (courier.codCharge.type === 'percentage') {
      codCharge = Math.max((codAmount * courier.codCharge.value) / 100, courier.codCharge.min);
    } else {
      codCharge = courier.codCharge.value;
    }
  }
  
  const subtotal = freight + fuelSurcharge + expressCharge + fragileCharge + codCharge;
  const gst = subtotal * 0.18;
  const totalCost = subtotal + gst;
  
  return {
    courier: courier.name,
    code: courier.code,
    color: courier.color,
    rating: courier.rating,
    zone,
    actualWeight: parseFloat(weight),
    volumetricWeight: volumetricWeight ? parseFloat(volumetricWeight.toFixed(2)) : null,
    billableWeight: parseFloat(billableWeight.toFixed(2)),
    estimatedDays: isExpress ? Math.max(1, courier.avgDeliveryDays[zone] - 1) : courier.avgDeliveryDays[zone],
    pincodesServed: courier.pincodesServed,
    features: courier.features,
    supportsCOD: courier.features.includes('COD'),
    breakdown: {
      freight: parseFloat(freight.toFixed(2)),
      fuelSurcharge: parseFloat(fuelSurcharge.toFixed(2)),
      expressCharge: parseFloat(expressCharge.toFixed(2)),
      fragileCharge: parseFloat(fragileCharge.toFixed(2)),
      codCharge: parseFloat(codCharge.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      gst: parseFloat(gst.toFixed(2)),
    },
    totalCost: parseFloat(totalCost.toFixed(2)),
    isAvailable: !isCOD || courier.features.includes('COD'),
  };
}

function getAllRates(params) {
  return COURIER_DATA.map(courier => calculateRate(courier, params))
    .filter(r => r.isAvailable)
    .sort((a, b) => a.totalCost - b.totalCost);
}

function getCourierList() {
  return COURIER_DATA.map(c => ({
    name: c.name, code: c.code, color: c.color, rating: c.rating,
    features: c.features, pincodesServed: c.pincodesServed, maxWeight: c.maxWeight
  }));
}

module.exports = { getAllRates, calculateRate, determineZone, getCourierList, COURIER_DATA };
