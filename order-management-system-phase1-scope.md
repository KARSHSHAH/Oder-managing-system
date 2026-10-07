# Undergarments Wholesale — Order Management System
### Phase 1 — Scope Document & Antigravity Prompts

**Stack:** MERN (MongoDB, Express, React, Node) — Plain JavaScript only, no TypeScript.

---

## 1. Panels Overview

| Panel | Used By | Purpose |
|---|---|---|
| **Admin Panel** | Business owner | Full control + business analytics |
| **Order-Booking Panel** | Staff/salesperson | Book orders on behalf of retail parties + collect payment |
| **Retail Party Panel** | Retail customers | Place their own orders, view history, dues |

Single login system, role field (`admin` / `staff` / `retailer`) decides which dashboard loads after login.

---

## 2. Feature Breakdown by Panel

### 2.1 Admin Panel
- Manage staff accounts (add/edit/deactivate)
- Manage retail parties (add/edit/block)
- Manage product catalog (add products + variants)
- View/manage all orders (approve, edit, change status, cancel)
- View/manage all payments & ledgers
- **Business Analytics Dashboard:**
  - Sales revenue trend (daily/weekly/monthly)
  - Top-selling products/sizes/brands
  - Retail-party-wise sales ranking
  - Outstanding dues report (party-wise)
  - Stock alerts (low stock / dead stock)
  - Staff performance (orders booked, payments collected)
  - Profit margin analysis (wholesale rate vs cost price)
- Invoice management (view/reprint/download PDF)
- Export reports (Excel/PDF)

### 2.2 Order-Booking Panel (Staff)
- Login, see assigned retail parties (by area/route)
- Browse product catalog, check live stock
- Create order on behalf of a retail party
- Select payment mode at order time: Cash / UPI / Cheque / Credit
- Record partial payment (amount received vs balance due)
- View own collection history (today/week/month)
- View own order-booking history
- See retail party's current outstanding balance before booking (credit limit warning)

### 2.3 Retail Party Panel (Customer)
- Login (credentials given by admin)
- Browse product catalog with **their applicable rate**
- Place own order (cart-based)
- View order status (Pending → Confirmed → Packed → Dispatched → Delivered)
- View invoice/bill PDF for each order
- View own ledger (total purchased, total paid, balance due)
- View own profile/address

---

## 3. Common Modules (used across all 3 panels)

- **Auth**: JWT-based, role-based route protection
- **Product Catalog**: shared product data, rate visibility differs by role
- **Order Module**: shared order lifecycle & status
- **Notifications**: new order / status change alerts
- **Invoice Generation**: auto PDF on order confirmation
- **Ledger/Payment Tracking**: shared collections, filtered view by role
- **Address Book**: shipping/billing address per retail party

---

## 4. Database Schema (MongoDB / Mongoose — rough structure)

### 4.1 User (common for Admin & Staff)
```js
{
  name: String,
  email: String,
  phone: String,
  password: String, // hashed
  role: { type: String, enum: ["admin", "staff"] },
  areaAssigned: [String], // for staff
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  createdAt: Date
}
```

### 4.2 RetailParty
```js
{
  partyName: String,
  ownerName: String,
  shopAddress: String,
  contactNo: String,
  altContactNo: String,
  email: String,
  gstNo: String,
  panNo: String,
  areaRoute: String,
  creditLimit: Number,
  openingBalance: Number,
  currentBalance: Number, // updated on every order/payment
  status: { type: String, enum: ["active", "inactive", "blocked"], default: "active" },
  loginId: String,
  password: String, // hashed
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: Date
}
```

### 4.3 Product (flexible variants — supports size-only, size+color, or no variant)
```js
{
  name: String,
  brand: String,
  category: String, // e.g. Bra, Brief, Vest, Trunk
  description: String,
  variants: [
    {
      size: String,      // optional
      color: String,     // optional
      sku: String,
      stockQty: Number,
      wholesaleRate: Number,
      mrp: Number,
      costPrice: Number  // for profit margin analysis
    }
  ],
  isActive: { type: Boolean, default: true },
  createdAt: Date
}
```
> Since each category can have different variant combos (e.g. Bra = size+color, Vest = size only), `variants` stays a flexible array — no fixed size/color fields at product level.

### 4.4 Order
```js
{
  orderNo: String,
  retailParty: { type: mongoose.Schema.Types.ObjectId, ref: "RetailParty" },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // staff or "self" if retailer
  bookedByRole: { type: String, enum: ["staff", "retailer", "admin"] },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      variantSku: String,
      qty: Number,
      rate: Number,
      amount: Number
    }
  ],
  totalAmount: Number,
  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Packed", "Dispatched", "Delivered", "Cancelled"],
    default: "Pending"
  },
  createdAt: Date
}
```

### 4.5 Payment / Ledger
```js
{
  retailParty: { type: mongoose.Schema.Types.ObjectId, ref: "RetailParty" },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }, // optional, can be standalone payment
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: Number,
  mode: { type: String, enum: ["Cash", "UPI", "Cheque", "Credit"] },
  type: { type: String, enum: ["Credit", "Debit"] }, // Debit = order value added, Credit = payment received
  createdAt: Date
}
```

---

## 5. Rough API Route Structure

```
/api/auth/login
/api/auth/register-staff        (admin only)

/api/retail-parties             GET, POST
/api/retail-parties/:id         GET, PUT, DELETE

/api/products                   GET, POST
/api/products/:id               GET, PUT, DELETE

/api/orders                     GET, POST
/api/orders/:id                 GET, PUT (status update)

/api/payments                   GET, POST
/api/payments/party/:partyId    GET (ledger for one party)

/api/analytics/sales-trend
/api/analytics/top-products
/api/analytics/party-ranking
/api/analytics/outstanding-dues
/api/analytics/stock-alerts
/api/analytics/staff-performance
/api/analytics/profit-margin
```

---

## 6. Antigravity — Ready-to-Use Prompts (Step by Step)

Copy each prompt one at a time, let it complete, then move to the next.

### Prompt 1 — Project Setup
```
Create a MERN stack project (plain JavaScript, no TypeScript) named "undergarments-order-system".
Structure: /backend (Node + Express + Mongoose) and /frontend (React with plain JS, using Vite).
Set up:
- Backend: Express server, MongoDB connection via Mongoose, dotenv config, CORS, basic folder structure (models, routes, controllers, middleware).
- Frontend: React app with React Router set up, folder structure for pages/admin, pages/staff, pages/retailer, and shared components.
Add a basic health-check API route "/api/health".
```

### Prompt 2 — Auth & User Roles
```
In the backend, create a User model with fields: name, email, phone, password (hashed with bcrypt), role (enum: admin, staff), areaAssigned (array of strings), status (active/inactive), createdAt.
Create a separate RetailParty model with fields: partyName, ownerName, shopAddress, contactNo, altContactNo, email, gstNo, panNo, areaRoute, creditLimit, openingBalance, currentBalance, status (active/inactive/blocked), loginId, password (hashed), createdBy (ref User), createdAt.
Create JWT-based auth: POST /api/auth/login (accepts loginId/email + password, checks both User and RetailParty collections, returns JWT with role embedded).
Create middleware "authMiddleware" to verify JWT and "roleMiddleware(allowedRoles)" to restrict routes by role.
On the frontend, create a Login page and role-based redirect logic (admin -> /admin/dashboard, staff -> /staff/dashboard, retailer -> /retailer/dashboard). Store JWT in localStorage and attach it to axios requests via an interceptor.
```

### Prompt 3 — Retail Party Management (Admin)
```
Create full CRUD API routes for RetailParty (protected, admin-only for create/update/delete, staff/admin can view list filtered by their assigned area).
Fields to support: partyName, ownerName, shopAddress, contactNo, altContactNo, email, gstNo, panNo, areaRoute, creditLimit, openingBalance, status.
On creation, auto-generate a loginId and temporary password, hash the password, and set currentBalance = openingBalance.
On the frontend Admin panel, create a "Retail Parties" page with a table listing all parties, an "Add Retail Party" form with all the above fields, and edit/block actions.
```

### Prompt 4 — Product Catalog with Flexible Variants
```
Create a Product model with fields: name, brand, category, description, isActive, createdAt, and a "variants" array where each variant has: size (optional string), color (optional string), sku (unique string), stockQty (number), wholesaleRate (number), mrp (number), costPrice (number).
Create CRUD API routes for products (admin can create/edit, all roles can view — but retailers/staff should NOT see costPrice in the response).
On the Admin frontend, build a "Products" page: a form to add a product where the admin can dynamically add multiple variant rows (some products may only need size, some size+color, some no variant at all — keep the variant form fully dynamic/flexible).
Show a product listing table with stock per variant.
```

### Prompt 5 — Order Placement (Staff & Retailer)
```
Create an Order model as per this structure: orderNo (auto-generated, unique), retailParty (ref), bookedBy (ref User, nullable if self-booked by retailer), bookedByRole (staff/retailer/admin), items (array of {product ref, variantSku, qty, rate, amount}), totalAmount, status (Pending/Confirmed/Packed/Dispatched/Delivered/Cancelled), createdAt.
Create API: POST /api/orders (validates stock availability, calculates totalAmount, reduces stockQty on the matched variant, creates a Payment record with type "Debit" for totalAmount).
Create API: GET /api/orders (role-based: admin sees all, staff sees only orders they booked, retailer sees only their own orders), PUT /api/orders/:id/status (admin/staff only, for status updates).
On frontend:
- Staff panel: build an "Order Booking" page — select retail party, browse products with variant/stock picker, add to cart, show retail party's current balance and credit limit as a warning if exceeded, place order.
- Retailer panel: build a similar self-service "Place Order" page using their own rates.
- Both panels: an "Order History" page showing status with a visual progress tracker.
```

### Prompt 6 — Payment Collection & Ledger
```
Create a Payment model: retailParty (ref), order (ref, optional), collectedBy (ref User, nullable), amount, mode (Cash/UPI/Cheque/Credit), type (Credit/Debit), createdAt.
On order creation, auto-create a Debit payment entry equal to totalAmount (already covered in Prompt 5).
Create API: POST /api/payments (staff/admin only — records a Credit entry when payment is received, updates RetailParty.currentBalance accordingly).
Create API: GET /api/payments/party/:partyId — returns full ledger (all debit/credit entries) for a retail party with running balance.
On Staff panel: add a "Collect Payment" screen — select retail party, enter amount + mode, submit.
On Retailer panel: add a read-only "My Ledger" page showing all transactions and current balance.
On Admin panel: add a "Ledger" page to view any party's full transaction history.
```

### Prompt 7 — Invoice Generation
```
On order status change to "Confirmed", auto-generate a PDF invoice using a library like pdfkit or puppeteer, containing: invoice number, date, retail party details (name, address, GST no), item-wise table (product, variant, qty, rate, amount), total amount, and payment status.
Store the generated PDF path in the Order document.
Create API: GET /api/orders/:id/invoice — returns/downloads the PDF.
Add a "Download Invoice" button on the Order History pages (Admin, Staff, Retailer).
```

### Prompt 8 — Admin Analytics Dashboard
```
Create the following analytics API endpoints (admin-only), all reading from Orders and Payments collections using MongoDB aggregation:
- GET /api/analytics/sales-trend?period=daily|weekly|monthly — total sales over time
- GET /api/analytics/top-products — best-selling products/variants by quantity and revenue
- GET /api/analytics/party-ranking — retail parties ranked by total purchase value
- GET /api/analytics/outstanding-dues — list of parties with current balance > 0, sorted descending
- GET /api/analytics/stock-alerts — variants where stockQty is below a threshold (e.g. 10)
- GET /api/analytics/staff-performance — orders booked count and payments collected amount, per staff member
- GET /api/analytics/profit-margin — (wholesaleRate - costPrice) * qty sold, aggregated by product/period

On the Admin frontend, build a "Dashboard" page using a charting library (recharts) showing:
- A line/bar chart for sales trend
- A table for top products
- A table for party ranking
- A table for outstanding dues (with a "Send Reminder" placeholder button)
- A stock alerts widget
- A staff performance table
- A profit margin summary card
```

### Prompt 9 — Notifications (basic, in-app)
```
Create a simple in-app Notification model: recipient (ref, with recipientRole), message, isRead, createdAt.
Trigger a notification to the admin when a new order is placed, to the retail party when their order status changes, and to staff when an order they booked changes status.
Create GET /api/notifications (role-filtered) and PUT /api/notifications/:id/read.
Add a notification bell icon with unread count on all 3 panel headers.
```

---

## 7. Phase 2 (Placeholder — to be added later)

You mentioned there are Phase 2 requirements to be integrated after Phase 1 is complete. Once you share them, they'll be appended here as additional Antigravity prompts, without disturbing the Phase 1 structure above.

---

## 8. Open Items for You to Confirm Later
- Exact invoice format/layout (once you share the sample bill copy)
- Low-stock threshold number for alerts
- Whether retailer self-ordering needs admin approval before becoming "Confirmed", or auto-confirms
