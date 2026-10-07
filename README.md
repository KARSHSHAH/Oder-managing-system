# Undergarments Wholesale — Order Management System (Phase 1)

A complete MERN-stack B2B Order Management System designed specifically for wholesale undergarments distribution with 3 distinct role-based panels:
- **Admin Panel**: Product catalog with dynamic multi-attribute variants, retail party management with auto-generated credentials, dispatch order management, ledger & collections, and business analytics with profit margin analysis.
- **Order-Booking Panel (Staff)**: Route-assigned retailer directory, live inventory catalog, order booking with credit limit warnings, payment collection.
- **Retail Party Panel (Customer)**: Self-service catalog with applicable wholesale pricing, cart checkout, visual order tracking, PDF invoices, and personal running account ledger.

---

## Getting Started

### 1. Database Configuration
Open [`backend/.env`](file:///c:/Users/KARSH/Desktop/oder/backend/.env) and set your MongoDB connection string:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/undergarments_oms # Or your MongoDB Atlas connection string
JWT_SECRET=wholesale_secret_key_undergarments_2026_super_secure
CLIENT_URL=http://localhost:5173
```

### 2. Seed Database (Optional / Recommended)
To populate sample undergarments (Lux Cozi, Amul Macho, Jockey, Rupa), test retail stores, admin, staff, sample orders and ledgers:
```bash
cd backend
npm run seed
```

#### Demo Logins Included:
- **Admin**: `admin@wholesale.com` / `admin123`
- **Sales Staff**: `rajesh@wholesale.com` / `staff123` (Assigned: Central Market, North Zone)
- **Retailer 1**: `RP1001` / `retail123` (Gupta Hosiery & Garments)
- **Retailer 2**: `RP1002` / `retail123` (Vikas Lingerie House)

*(Note: The Login screen includes 1-click demo account switcher buttons for instant access!)*

### 3. Running Development Servers

#### Terminal 1 — Backend:
```bash
cd backend
npm run dev
```
Backend runs at: `http://localhost:5000`

#### Terminal 2 — Frontend:
```bash
cd frontend
npm run dev
```
Frontend runs at: `http://localhost:5173`

---

## Features Implemented in Phase 1

1. **Authentication & RBAC**: Single login portal with role-based redirection to `/admin/dashboard`, `/staff/dashboard`, or `/retailer/dashboard`.
2. **Product Catalog with Flexible Multi-Attribute Variants**: Supports size-only, size+color, or standard items. Sensitive `costPrice` is hidden from staff and retailers, visible only to admin.
3. **Retail Party Management**: Admin CRUD with auto-generated unique `loginId` and temporary passwords.
4. **Order Booking & Credit Checks**: Live inventory check, atomic stock deduction, debit ledger billing, and instant credit limit warnings.
5. **Running Balance Ledger**: Chronological debit/credit audit trail with running balances.
6. **Automated PDF Invoices**: Generated using PDFKit upon order confirmation, available for instant streaming and download.
7. **Admin Analytics Dashboard**: Recharts-powered sales trends, top-selling products, client rankings, stock alerts, staff performance, and profit margin analysis.
8. **In-App Notifications**: Alerts triggered on order placement and lifecycle updates with header bell badge and unread drawer.
