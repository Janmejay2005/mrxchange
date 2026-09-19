# MR.X.Change — Staff Mobile Exchange & Inventory Application

A staff-facing, responsive web application for mobile phone exchange, repair tracking, and inventory management built with React, Node.js/Express, and MySQL.

---

## 📁 Project Structure

```text
staff/
├── backend/                  # Node.js + Express + MySQL API
│   ├── src/
│   │   ├── config/db.js      # MySQL connection pool & automatic table schema creation
│   │   ├── controllers/      # auth, device, repair, rejection, sale, stats controllers
│   │   ├── middleware/       # JWT Auth, RBAC, Multer file upload
│   │   ├── models/seed.js    # Demo seed script for users, devices, repairs & rejections
│   │   ├── routes/api.js     # API route endpoints
│   │   └── server.js         # Express app entry point
│   ├── uploads/              # Device image uploads
│   └── package.json
│
└── frontend/                 # Modern React application (Vite)
    ├── src/
    │   ├── components/
    │   │   ├── layout/       # Sidebar (Navy theme), Topbar (Search & Avatar), Shell
    │   │   ├── common/       # KPI cards, Status badges, Currency formatters
    │   │   └── modals/       # AddMobileModal (Webcam capture + file upload), StatusActionModal
    │   ├── pages/
    │   │   ├── Dashboard.jsx # Live 5 KPI cards, Doughnut distribution, 7-day trend, Recently added table
    │   │   ├── OldInventory.jsx # Intake master list, filter tabs, Add Mobile modal, row actions
    │   │   ├── InHandStock.jsx  # Sellable stock view, 4 live aggregates, Sell action modal
    │   │   ├── RepairStock.jsx  # Under-repair tracking, technician costs, completion routing
    │   │   ├── RejectedStock.jsx# Defect reason tracking (Motherboard dead, Liquid damage, etc.)
    │   │   ├── Reports.jsx      # Analytics, brand-wise bar chart, multi-format export (XML/CSV/PDF/PPT)
    │   │   └── Login.jsx        # Staff & Admin authentication
    │   ├── context/AuthContext.jsx
    │   ├── services/api.js
    │   ├── index.css
    │   └── App.jsx
    ├── package.json
    └── vite.config.js
```

---

## 🚀 How to Run

### 1. Backend Setup
```bash
cd staff/backend
npm install
npm run seed     # Seeds demo admin & staff users + initial inventory
npm run dev      # Runs API server on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd staff/frontend
npm install
npm run dev      # Runs React app on http://localhost:3000
```

---

## 🔑 Demo Credentials
- **Staff User:** `staff@mrx.com` / `staff123`
- **Admin User:** `admin@mrx.com` / `admin123`
