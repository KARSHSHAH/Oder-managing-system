# Undergarments Wholesale Order Management System (OMS)

**🌐 Live Demo:** [https://classy-moxie-21eff0.netlify.app](https://classy-moxie-21eff0.netlify.app)


## 📌 Project Overview
The **Undergarments Wholesale OMS** is a full-stack MERN (MongoDB, Express, React, Node.js) application designed to streamline the wholesale supply chain. It provides a centralized platform for administrators, field staff, and retail parties to manage product catalogs, bulk orders, financial ledgers, and inventory.

## 🚀 Key Features
- **Role-Based Access Control (RBAC):** Distinct dashboards and permissions for Admins, Staff, and Retailers.
- **Order Management:** Seamless order booking by staff (on behalf of retailers) or directly by retailers. Features order status tracking (Pending -> Approved -> Dispatched -> Delivered).
- **Financial Ledger & Payments:** Comprehensive tracking of payments, outstanding dues, and ledger history for every retail party.
- **Automated Invoicing:** Generates professional PDF invoices and payment receipts automatically.
- **OCR Integration:** Smart extraction of purchase bill data using Tesseract.js for quick inventory intake.
- **Analytics & Reporting:** Dashboard with key metrics and ability to export data to Excel (compatible with accounting software like Busy).
- **Notifications & OTP:** Email notifications via Nodemailer and secure OTP verification for sensitive actions.

## 💻 Tech Stack
**Frontend:**
- React.js (Vite)
- React Router DOM
- Axios (Centralized API client)
- Recharts (Data visualization)
- Lucide React (Icons)

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose (Database & ODM)
- JSON Web Token (JWT) & bcryptjs (Authentication & Security)
- Tesseract.js (Optical Character Recognition)
- PDFKit & ExcelJS (Document generation)
- Nodemailer (Email services)

## 🔄 Business Workflow

### 1. Onboarding
- **Admin** registers Field Staff and Retail Parties.
- Retail Parties can also be verified via OTP.
- **Admin** uploads the product catalog (Undergarments, sizes, colors, pricing).

### 2. Order Processing Workflow
1. **Catalog Browsing:** Retailers or Staff browse the available products.
2. **Order Placement:** An order is placed with specific quantities per variant.
3. **Approval:** Admin reviews and approves the order.
4. **Dispatch:** The warehouse packs the items. A PDF Invoice is automatically generated.
5. **Delivery:** The order is marked as delivered, and the retailer's outstanding balance (ledger) is updated.

### 3. Payment Collection Workflow
1. **Collection:** Staff visits the retail party or the retailer pays online/directly.
2. **Recording:** Staff/Admin records the payment received in the system.
3. **Receipt:** A PDF payment receipt is generated.
4. **Ledger Update:** The retail party's outstanding debt is reduced accordingly.

### 4. Inventory Intake (Purchase Workflow)
1. Admin uploads a purchase bill image from a manufacturer.
2. The **OCR engine (Tesseract.js)** reads the text and extracts item details, quantities, and prices.
3. Admin verifies the extracted data and confirms to update the local stock.

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas URI)

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/KARSHSHAH/Oder-managing-system.git
cd Oder-managing-system
\`\`\`

### 2. Backend Setup
\`\`\`bash
cd backend
npm install
\`\`\`
Create a \`.env\` file in the \`backend\` directory (refer to \`.env.example\`):
\`\`\`env
PORT=5000
MONGO_URI=mongodb://localhost:27017/undergarments_oms
JWT_SECRET=your_secret_key
CLIENT_URLS=http://localhost:5173
\`\`\`
Start the backend server:
\`\`\`bash
npm run dev
\`\`\`

### 3. Frontend Setup
\`\`\`bash
cd ../frontend
npm install
\`\`\`
Create a \`.env\` file in the \`frontend\` directory (refer to \`.env.example\`):
\`\`\`env
VITE_API_URL=http://localhost:5000
\`\`\`
Start the frontend development server:
\`\`\`bash
npm run dev
\`\`\`

## 🚀 Deployment
- **Backend:** Ready for deployment on platforms like **Render** or **Heroku**. Just ensure environment variables are set via the provider's dashboard.
- **Frontend:** Ready for deployment on **Vercel** or **Netlify**. It will automatically point to the backend URL specified in \`VITE_API_URL\`.

---
*Maintained by KARSHSHAH*
