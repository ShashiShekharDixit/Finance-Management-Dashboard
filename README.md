# FinanceFlow — Full Stack Finance Management System

Complete finance management system with GST, Invoices, Expenses, Income,
Clients/Vendors, Construction Estimates, and Dashboard Analytics.

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | Vue 3 + TypeScript + Vite + Pinia       |
| Backend   | Node.js + Express.js                    |
| Database  | MongoDB + Mongoose (lifetime storage)   |
| Auth      | JWT (30-day tokens)                     |
| GST       | CGST + SGST (intra) / IGST (inter)      |
| Currency  | Indian Rupee ₹ — slabs 0/5/12/18/28%   |

## Project Structure

```
finance-app/
├── backend/
│   ├── controllers/        (8 controllers)
│   ├── middleware/auth.js
│   ├── models/             (6 Mongoose models)
│   ├── routes/             (8 route files)
│   ├── server.js
│   ├── .env
│   └── package.json
└── frontend/
    ├── src/
    │   ├── assets/global.css
    │   ├── components/layout/AppLayout.vue
    │   ├── router/index.ts
    │   ├── stores/         (auth, invoice, expense, income, client, dashboard)
    │   ├── types/index.ts
    │   ├── utils/          (api.ts, format.ts)
    │   └── views/          (12 views)
    ├── index.html
    ├── package.json
    └── vite.config.ts
```

## Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)

---

### Step 1 — Backend Setup

```bash
cd finance-app/backend
npm install
```

Edit `.env` file:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/financedb
# OR for Atlas: mongodb+srv://user:pass@cluster.mongodb.net/financedb
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRE=30d
```

Start the backend:
```bash
npm run dev       # development (auto-restart)
npm start         # production
```

Backend runs at: `http://localhost:5000`

---

### Step 2 — Frontend Setup

```bash
cd finance-app/frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

### Step 3 — First Time

1. Open `http://localhost:5173`
2. Click **Create Account**
3. Fill in your name, email, password, business name, GSTIN
4. You're in! Start adding clients and creating invoices.

---

## Features

### Dashboard
- Revenue, Profit, Pending, Expenses summary cards
- Monthly revenue bar chart (last 6 months)
- Expense breakdown by category
- Invoice status overview
- Recent invoices + Overdue alerts

### Invoices
- Create / Edit / Delete invoices
- Line items with HSN codes, quantity, rate, GST rate per item
- Intra-state (CGST + SGST) and Inter-state (IGST) support
- Auto invoice numbering (INV-2025-0001)
- Status: Draft → Sent → Paid / Partial / Overdue / Cancelled
- Record payments with method, date, reference
- Printable invoice view
- Live GST calculation as you type

### GST Reports
- Output GST (collected from clients)
- Input GST Credit (paid on expenses)
- Net GST Payable = Output − Input
- Rate-wise breakdown (0/5/12/18/28%)
- GSTR-1 style invoice register with totals
- Date range filtering
- Printable report

### Expenses
- 14 expense categories
- GST on expenses (input credit)
- Vendor linking
- Payment method tracking
- Category-wise summary

### Income
- 10 income categories
- GST on income
- Client linking
- Category-wise summary

### Clients & Vendors
- Separate client and vendor tabs
- GSTIN, PAN, address fields
- Running totals: Billed / Paid / Balance
- Search by name

### Construction Estimates 🏗️
- 12 project types (Residential, Commercial, Interior, etc.)
- Bill of Quantities (BOQ) with 16 work categories
- Per-item GST (0/5/12/18/28%)
- Auto category breakdown display
- Contingency % allowance
- Overhead % allowance
- Discount
- Grand Total = Base + GST + Contingency + Overhead − Discount
- Status: Draft → Sent → Approved → Rejected → Converted
- **Convert to Invoice** with one click (when Approved)
- Printable estimate

### Profile
- Business name, GSTIN, phone, address
- These appear on all printed invoices

---

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/profile

GET    /api/clients
POST   /api/clients
GET    /api/clients/:id
PUT    /api/clients/:id
DELETE /api/clients/:id

GET    /api/invoices
POST   /api/invoices
GET    /api/invoices/:id
PUT    /api/invoices/:id
DELETE /api/invoices/:id
PATCH  /api/invoices/:id/payment

GET    /api/expenses
POST   /api/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id

GET    /api/income
POST   /api/income
PUT    /api/income/:id
DELETE /api/income/:id

GET    /api/gst/summary
GET    /api/gst/gstr1

GET    /api/dashboard

GET    /api/estimates
POST   /api/estimates
GET    /api/estimates/:id
PUT    /api/estimates/:id
DELETE /api/estimates/:id
POST   /api/estimates/:id/convert
```

---

## Data Persistence

All data is stored in MongoDB permanently until you manually delete it.
Each user's data is isolated — multiple users can use the same system.
JWT tokens expire after 30 days (configurable in .env).

---

## Personalise

| What | Where |
|------|-------|
| GST rates | Already includes 0/5/12/18/28% |
| Business details | Profile page → saved to DB → appears on invoices |
| Invoice terms | Set per invoice or change default in invoiceController.js |
| Port | `.env` → PORT |
| Database | `.env` → MONGO_URI |
| Token expiry | `.env` → JWT_EXPIRE |
