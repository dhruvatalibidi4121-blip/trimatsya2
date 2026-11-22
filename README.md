# TRI-MATSYA

> **Direct and inclusive market access for small-scale fishers, zero-waste utilization, and transparent fisheries commerce.**

TRI-MATSYA is a blue economy digital platform designed to empower traditional coastal fishers and small-scale fishing communities across coastal India (starting with coastal Karnataka, Mangaluru, and the Arabian Sea coast). It connects fishermen directly with restaurants, hotels, commercial buyers, and fish processing units while providing fair market pricing, cold chain logistics tracking, bycatch/waste-to-wealth conversion, and multilingual access.

---

## Key Features

- **Direct Fisherman-to-Buyer Marketplace**: Real-time catch listings with transparent price benchmarks, eliminating predatory intermediaries.
- **Waste-to-Wealth & Circular Economy**: Non-food-grade fish, processing offal, and bycatch redirection for fishmeal, fish oil, chitin/chitosan, and organic liquid bio-fertilizers.
- **Cold Chain & Logistics Management**: Request refrigerated pickups, real-time dispatch tracking, and temperature compliance indicators.
- **Multilingual Support**: First-class local language interfaces in English, Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), Tamil (தமிழ்), and Hindi (हिन्दी).
- **Interactive Harbours & Supply Map**: Leaflet-based geospatial view of landing centres, cold storage hubs, processing clusters, and logistics routes.
- **WhatsApp & n8n Integration Ready**: Webhook interfaces for trade alerts, OTP verification, and conversational catch logging via WhatsApp Business API.
- **Role-Based Access Control**: Tailored dashboards for Fishermen, Business Buyers, Processing Partners, and Platform Admins.

---

## Tech Stack

### Primary Stack (Node.js & Express)
- **Runtime**: Node.js (>=22, tested on v24)
- **Server**: Express.js
- **Database**: Embedded SQLite via Node's native `node:sqlite` (DatabaseSync with WAL mode enabled)
- **Frontend**: Clean vanilla JavaScript SPA (ES modules), responsive CSS custom design system, Leaflet maps, SVG iconography
- **Security**: Scrypt password hashing, HTTP-only secure session cookies, input sanitation

### Alternative Backend (`backend/`)
- **Framework**: Python FastAPI
- **ORM / DB**: SQLAlchemy with PostgreSQL or SQLite fallback
- **Integrations**: Pydantic v2 schemas, JWT authentication, and WhatsApp/n8n webhooks

---

## Getting Started

### Prerequisites
- Node.js >= 22 (Node 24 recommended)
- npm >= 10

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dhruvatalibidi4121-blip/tri-matsya.git
   cd tri-matsya
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables (optional)**:
   ```bash
   cp .env.example .env
   # Customize PORT, SESSION_SECRET, WHATSAPP_* tokens if required
   ```

4. **Start the application**:
   ```bash
   # Development mode with auto-reload:
   npm run dev

   # Production mode:
   npm start
   ```

5. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## Pre-seeded Demo Accounts

The local database is automatically initialized and seeded with demo accounts on first launch:

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@trimatsya.in` | `admin123` | Full platform control & analytics |
| **Fisherman** | `ravi@trimatsya.in` | `fisher123` | Catch listings, harvest logging, payouts |
| **Buyer** | `buyer@trimatsya.in` | `buyer123` | Orders, fresh catch purchasing, delivery tracking |
| **Processor** | `processor@trimatsya.in` | `partner123` | Bycatch & offal intake, waste-to-wealth batching |

---

## Project Structure

```
trimatsya/
├── server.js               # Express application, routes, and SQLite database setup
├── package.json            # Node.js dependencies and scripts
├── .env.example            # Environment configuration template
├── public/                 # Frontend SPA assets
│   ├── index.html          # Main application shell
│   ├── css/styles.css      # Custom UI design system
│   ├── js/app.js           # Client SPA application logic
│   ├── js/i18n.js          # Multilingual translations (EN, KN, ML, TA, HI)
│   ├── images/             # Harbor and species photography
│   └── uploads/            # Uploaded listing photos
├── data/                   # SQLite database directory (auto-created)
└── backend/                # Production-oriented Python FastAPI service
    ├── app/                # FastAPI modules (auth, catches, orders, waste, logistics)
    ├── requirements.txt    # Python dependencies
    └── README.md           # FastAPI documentation
```

---

## License

ISC License. Developed for coastal fisheries and sustainable blue economy communities.
