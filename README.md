# 📦 ShipFast — Smart Courier Rate Aggregator

> Instantly compare shipping rates across 8 major Indian couriers. Save 30–60 minutes daily and reduce shipping costs by 15–30%.

---

## 🏗️ Architecture Overview

```
shipfast/
├── backend/                    # Node.js + Express API
│   ├── server.js               # App entry point
│   ├── controllers/
│   │   └── rateEngine.js       # 🧠 Core pricing engine
│   ├── models/
│   │   ├── Courier.js          # Mongoose courier schema
│   │   ├── Shipment.js         # Shipment tracking schema
│   │   └── User.js             # User auth schema
│   └── routes/
│       ├── rates.js            # Rate comparison API
│       ├── auth.js             # JWT auth
│       ├── shipments.js        # Booking & history
│       ├── couriers.js         # Courier directory
│       └── analytics.js        # Dashboard data
│
└── frontend/                   # React + Vite + Tailwind
    └── src/
        ├── App.jsx              # Router
        ├── components/
        │   ├── Layout.jsx       # Sidebar shell
        │   ├── ShipmentForm.jsx # Input form with validation
        │   └── RateCard.jsx     # Per-courier result card
        └── pages/
            ├── ComparePage.jsx  # Main rate comparison
            ├── DashboardPage.jsx# Analytics + charts
            ├── ShipmentsPage.jsx# Booking history
            └── CouriersPage.jsx # Courier comparison table
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend Setup
```bash
cd backend
npm install

# Create .env
echo "PORT=5000
MONGODB_URI=mongodb://localhost:27017/shipfast
JWT_SECRET=your_super_secret_key_here
CLIENT_URL=http://localhost:5173" > .env

npm run dev
# API running at http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# App running at http://localhost:5173
```

---

## 🔌 API Reference

### Rate Comparison
```http
POST /api/rates/compare

Body:
{
  "originPincode": "141001",
  "destPincode":   "400001",
  "weight":         2.5,
  "length":         20,      // optional (cm)
  "breadth":        15,      // optional (cm)
  "height":         10,      // optional (cm)
  "isCOD":          false,
  "codAmount":      0,
  "isExpress":      false,
  "isFragile":      false
}

Response:
{
  "success": true,
  "data": {
    "rates": [
      {
        "courier":        "Delhivery",
        "code":           "DLV",
        "zone":           "national",
        "totalCost":      182.40,
        "billableWeight": 2.5,
        "estimatedDays":  5,
        "breakdown": {
          "freight":       95.00,
          "fuelSurcharge": 13.30,
          "gst":           19.49,
          ...
        }
      }
    ],
    "summary": {
      "zone":            "national",
      "cheapestOption":  "Ekart",
      "cheapestPrice":   134.20,
      "potentialSavings": 87.50
    }
  }
}
```

### Auth
```http
POST /api/auth/register   { name, email, password, company }
POST /api/auth/login      { email, password }
GET  /api/auth/me         Authorization: Bearer <token>
```

### Shipments
```http
GET  /api/shipments       List all shipments
POST /api/shipments/book  Book a shipment
```

---

## 🧠 Rate Engine Logic

### Zone Detection (Pincode-based)
```
Same pincode  →  local     (1-day)
Same metro    →  metro     (1-day)
|prefix diff| ≤ 15 →  regional  (2-4 days)
Otherwise     →  national  (5-7 days)
```

### Billable Weight Formula
```
Volumetric Weight = (L × B × H) / 5000
Billable Weight   = max(Actual Weight, Volumetric Weight, Min 0.5kg)
```

### Price Calculation
```
Base Freight    = Zone Base Price + (Extra kg × Per kg Rate)
Fuel Surcharge  = Base Freight × Fuel% (10–20%)
Express Charge  = Base Freight × (Multiplier - 1)
Fragile Charge  = max(Base × 5%, ₹15)
COD Charge      = max(COD Amount × %,  Min Flat)
GST             = Subtotal × 18%
─────────────────────────────────────────
Total           = Subtotal + GST
```

---

## 📊 Integrated Couriers & Base Rates (per 500g)

| Courier        | Local  | Metro  | Regional | National | COD  | Max Wt |
|----------------|--------|--------|----------|----------|------|--------|
| Delhivery      | ₹37    | ₹47    | ₹58      | ₹75      | ✅   | 50kg   |
| BlueDart       | ₹55    | ₹72    | ₹95      | ₹130     | ✅   | 70kg   |
| DTDC           | ₹32    | ₹42    | ₹52      | ₹68      | ✅   | 50kg   |
| Ekart          | ₹29    | ₹38    | ₹48      | ₹62      | ✅   | 40kg   |
| XpressBees     | ₹33    | ₹44    | ₹55      | ₹72      | ✅   | 50kg   |
| Shiprocket     | ₹35    | ₹45    | ₹57      | ₹74      | ✅   | 50kg   |
| Ecom Express   | ₹31    | ₹41    | ₹51      | ₹66      | ✅   | 50kg   |
| FedEx India    | ₹60    | ₹80    | ₹105     | ₹145     | ❌   | 70kg   |

*All rates excl. GST & fuel surcharge*

---

## 🔮 Production Enhancements (Roadmap)

### Phase 1 — Core (current)
- [x] Rate engine with zone/weight/volumetric logic
- [x] 8 courier integrations
- [x] JWT authentication
- [x] Shipment booking & history
- [x] Analytics dashboard

### Phase 2 — Real Integrations
- [ ] Live courier API webhooks (Delhivery, BlueDart, Shiprocket APIs)
- [ ] India Post pincode database (~30,000 pincodes)
- [ ] Real-time tracking status updates
- [ ] Automated label generation (PDF)

### Phase 3 — Intelligence
- [ ] ML-based courier recommendation (delivery performance + price)
- [ ] Bulk upload via CSV (100+ shipments at once)
- [ ] Rate alerts ("notify me if Ludhiana→Mumbai drops below ₹150")
- [ ] Historical rate trend graphs

### Phase 4 — Scale
- [ ] Redis caching for rate responses (TTL: 15min)
- [ ] Queue-based booking system (Bull/BullMQ)
- [ ] Multi-tenant (agency model)
- [ ] Shopify / WooCommerce plugin

---

## 🛡️ Security
- Helmet.js headers
- Rate limiting (100 req/15min)
- JWT tokens (7-day expiry)
- Input validation on all routes
- Env-based secrets (never hardcoded)

---

## 💡 Problem → Solution Mapping

| Problem | ShipFast Solution |
|---------|------------------|
| Manual rate lookup (5-10 sites) | Single API call returns all 8 couriers |
| Zone confusion | Auto zone detection from pincode prefix |
| Volumetric weight mistakes | Automatic L×B×H / 5000 calculation |
| COD rate surprises | Transparent COD breakdown shown upfront |
| 30-60 min daily wasted | Sub-second comparison, one click booking |
| Choosing expensive couriers | Savings vs most expensive shown clearly |
