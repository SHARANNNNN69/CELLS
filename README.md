# CELLS — Blood Donation & Emergency Management Network

A full-stack, responsive web application engineered for Software Engineering (SE) and Web Technology (WT).

CELLS coordinates emergency blood requisitions among hospitals, certified regional blood banks, and voluntary blood donors. Built with atomic inventory transactions, quarantine testing workflows, and role-based access control.

---

## 🌟 Key Features

1. **Public Discovery:** Search tested safe blood units by blood group (A+, A-, B+, B-, AB+, AB-, O+, O-), component, and city.
2. **Interactive Blood Bank Map:** Visual Leaflet OpenStreetMap view with verified location markers and an instant list-view fallback.
3. **Voluntary Donor Registry:** Privacy-masked donor leads with 90-day donation interval reminders.
4. **Emergency Requisition Triage:** Urgency classification (Emergency 0-6h, Urgent 24h, Standard) with automated dispatch notifications.
5. **Atomic Stock Issuance:** ACID database transactions with row-level locks preventing race-condition overbooking.
6. **Screening & Quarantine Workflow:** New batches enter quarantine until viral and serological testing is marked safe.
7. **Traceable Audit Log:** Immutable ledger recording every stock delta (+/- units) tied to the responsible officer.
8. **Role-Based Portals:** Dedicated dashboards for Donors, Blood Bank Managers, Hospital Doctors, Requesters, and Super Admins.
9. **Visual Analytics:** Interactive Chart.js telemetry illustrating component shares, blood group distribution, and expiring batches.

---

## 👥 Demo Accounts (One-Click Viva Login Available)

On the **Login** screen, you can click any of the preset persona buttons to automatically fill credentials:

| Persona / Role | Email | Password | What to Test |
|---|---|---|---|
| **Super Administrator** | `admin@cells.org` | `Admin@1234` | Institutional verifications, user suspension, global audit logs |
| **Blood Bank Staff** | `staff@metroblood.org` | `Bank@1234` | Batch quarantine release, adding stock, atomic unit issuance |
| **Hospital Doctor** | `doctor@citycare.org` | `Hosp@1234` | Creating patient requisitions, viewing fulfillment progress |
| **O+ Voluntary Donor** | `donor.rajesh@cells.sample` | `Donor@1234` | Availability toggle, donation history, interval tracker |
| **Emergency Requester**| `requester.amit@cells.sample` | `Req@1234` | Posting emergency request, tracking responses |
| **Public Visitor** | `visitor.demo@cells.sample` | `Visit@1234` | Browsing public stock and certified bank maps |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- MySQL Server (8.0+)

### 2. Database Setup
```bash
# In backend directory
cd backend

# Run migration (creates normalized schema & constraints)
npm run db:migrate

# Seed synthetic demo data
npm run db:seed
```

### 3. Run Backend Server
```bash
cd backend
npm run dev
# Server runs on: http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### 4. Run Frontend Client
```bash
cd frontend
npm run dev
# Frontend runs on: http://localhost:3000
```

### 5. Run Automated Tests
```bash
cd backend
npm test
```

---

## 📁 Project Structure

```text
CELLS/
├── backend/
│   ├── database/       # schema.sql, seed.js, migrate.js
│   ├── src/
│   │   ├── config/     # MySQL connection pool
│   │   ├── controllers/# Auth, Requests, Inventory, Donors, Hospitals, Admin, Analytics
│   │   ├── middleware/ # JWT authentication & RBAC authorization
│   │   ├── routes/     # Express REST endpoints
│   │   ├── utils/      # Response formatters & audit logger
│   │   └── server.js   # Express entry point
│   ├── tests/          # Automated integration test suite
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/ # Navbar, Footer, Map, Modals, StatusBadge, EmergencyBanner
│   │   ├── context/    # AuthContext, NotificationContext
│   │   ├── pages/      # Public, Auth, and 5 Role-based Dashboards
│   │   ├── services/   # API client
│   │   ├── styles/     # CSS variables & theme tokens
│   │   ├── App.jsx     # Router with protected routes
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docs/               # Software Engineering deliverables
│   ├── SRS.md          # Software Requirements Specification
│   ├── ERD.md          # Mermaid Entity-Relationship Diagram & Data Dictionary
│   ├── DFD_AND_WORKFLOWS.md # Context & Level-1 DFD, sequence diagrams
│   ├── TEST_PLAN.md    # Automated test cases & Viva Q&A
│   └── DEPLOYMENT.md   # Hosting architecture & deployment guide
└── README.md
```

---

## ⚖️ Academic & Medical Disclaimer
CELLS is an interdisciplinary demonstration developed for college Software Engineering and Web Technology coursework. All records shown are synthetic sample data. In clinical practice, physical blood grouping, antibody screening, component crossmatching, and blood unit allocation must be conducted by qualified medical transfusion personnel under applicable health laws.
