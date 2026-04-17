#  ShipFast — Smart Courier Rate Aggregator

> Instantly compare shipping rates across 8 major Indian couriers. Save 30–60 minutes daily and reduce shipping costs by 15–30%.

---

## Architecture Overview

```
shipfast/
├── backend/                    # Node.js + Express API
│   ├── server.js               # App entry point
│   ├── controllers/
│   │   └── rateEngine.js       # Core pricing engine
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

# Solution 
| Manual rate lookup (5-10 sites) | Single API call returns all 8 couriers |
| Zone confusion | Auto zone detection from pincode prefix |
| Volumetric weight mistakes | Automatic L×B×H / 5000 calculation |
| COD rate surprises | Transparent COD breakdown shown upfront |
| 30-60 min daily wasted | Sub-second comparison, one click booking |
| Choosing expensive couriers | Savings vs most expensive shown clearly |
