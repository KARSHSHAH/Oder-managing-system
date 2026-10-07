# Undergarments Wholesale — Order Management System
### Phase 2 — Scope Document & Antigravity Prompts

**Stack:** MERN (MongoDB, Express, React, Node) — Plain JavaScript only, no TypeScript.
> Run these prompts only after all Phase 1 prompts are completed and working.

---

## 1. Scope & Schema Changes

### 1.1 Feature 1: GST-Compliant Invoice (All Panels)
Current Phase-1 invoice becomes a proper GST bill:
- **HSN Code** + **GST Rate** per product
- **CGST/SGST** (if seller & buyer same state) or **IGST** (if different state) — auto-calculated
- Seller's own business details (GSTIN, address, bank info) printed on every invoice — needs a one-time **Business Profile** (Settings) record
- Downloadable PDF on **Admin, Staff, and Retailer** panels (not just Admin) — wherever an order/invoice is visible

**New/updated fields:**

`BusinessProfile` (single settings document):
```js
{
  businessName: String,
  address: String,
  gstin: String,
  state: String,
  invoicePrefix: String,
  bankDetails: { accountName: String, accountNo: String, ifsc: String, bankName: String }
}
```

`RetailParty` — add:
```js
state: String   // needed to decide CGST+SGST vs IGST
```

`Product` — add:
```js
hsnCode: String,
gstRate: Number   // e.g. 5, 12, 18
```

`Order` — add (snapshot at invoice time, since rates can change later):
```js
taxableAmount: Number,
cgstAmount: Number,
sgstAmount: Number,
igstAmount: Number,
grandTotal: Number
```

### 1.2 Feature 2: Unit Type — Pcs / Box / Pack
Each product variant now defines **how it's sold**, so stock, ordering, and billing all use the same unit consistently.

`Product.variants[]` — add:
```js
unitType: { type: String, enum: ["Pcs", "Box", "Pack"], default: "Pcs" },
packSize: { type: Number, default: 1 }   // e.g. Box of 12 -> packSize=12, Pack of 2 -> packSize=2, Pcs -> 1
```
- `stockQty`, `wholesaleRate`, `mrp`, `costPrice` all stay **per unitType** (e.g. rate per box, not per piece)
- Order/Invoice UI shows quantity in the variant's own unit (e.g. "3 Box" or "5 Pack")

`Order.items[]` — add (snapshot, so history stays correct even if product setup changes later):
```js
unitType: String,
packSize: Number
```

### 1.3 Feature 3: Purchase Bill OCR → Auto Stock Update (Admin Only)
Admin uploads a photo of the **supplier's purchase bill** → system extracts item, quantity, rate data via OCR → admin reviews/corrects on screen → confirms → stock added automatically. (Auto-add without a review step is risky since OCR can misread, so a **review-before-confirm** screen is included.)

**New model — `Purchase`:**
```js
{
  supplierName: String,
  billImage: String,       // stored file path/URL
  billDate: Date,
  items: [
    {
      rawText: String,          // OCR raw line, for admin reference
      matchedProduct: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      matchedVariantSku: String,
      qty: Number,
      unitType: String,
      costPricePerUnit: Number,
      isNewProduct: Boolean     // true if admin created a new product/variant from this line
    }
  ],
  status: { type: String, enum: ["Pending Review", "Added to Stock"], default: "Pending Review" },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: Date
}
```
On confirm: for each item, `stockQty` of the matched variant increases by `qty`, and `costPrice` updates to the new `costPricePerUnit` (feeds directly into the Phase-1 profit margin analytics).

---

## 2. Antigravity Prompts

Run these **after** all Phase 1 prompts are done and working. Each one modifies existing files, so let Antigravity read the current codebase before applying changes.

### Prompt 10 — Unit Type (Box/Pack/Pcs) Support
```
Update the existing Product model: in the "variants" array, add two fields to each variant: unitType (enum: "Pcs", "Box", "Pack", default "Pcs") and packSize (Number, default 1).
Update the Product add/edit form on the Admin frontend so that for each variant row, admin selects a Unit Type (Pcs/Box/Pack) and enters Pack Size (e.g. Box of 12, Pack of 2). Rate, MRP, and Stock Qty fields are per this unit, not per piece.
Update the Order model: in "items" array, add unitType and packSize fields (snapshot values copied from the product variant at the time of order, so historical orders remain accurate even if the product is edited later).
Update the Order Booking (Staff) and Place Order (Retailer) frontend pages: show each variant's unit type clearly (e.g. "Box of 12 - Qty:") next to the quantity input, and make sure stock validation and amount calculation use this unit correctly.
```

### Prompt 11 — GST-Compliant Invoice (All Panels)
```
Create a new BusinessProfile model (single document) with: businessName, address, gstin, state, invoicePrefix, bankDetails (accountName, accountNo, ifsc, bankName). Create a simple Admin-only settings page to set this up once.
Update the Product model: add hsnCode (String) and gstRate (Number, e.g. 5/12/18).
Update the RetailParty model: add a "state" field.
Update the Order model: add taxableAmount, cgstAmount, sgstAmount, igstAmount, grandTotal fields.
On order confirmation, calculate tax: if RetailParty.state === BusinessProfile.state, split gstRate into CGST+SGST (half each); otherwise apply the full rate as IGST. Store these amounts on the Order.
Rewrite the invoice PDF generation (from the Phase 1 invoice feature) into a proper GST tax invoice layout: seller details + GSTIN at top, buyer details + GSTIN, item table with HSN code, quantity (with unit type), rate, taxable value, CGST/SGST or IGST columns, and grand total. Include the invoice number using BusinessProfile.invoicePrefix.
Add a "Download Invoice" button on the Order History / Order Details pages in ALL THREE panels (Admin, Staff, Retailer) — not just Admin — so each role can download the GST bill for orders they have access to.
```

### Prompt 12 — Purchase Bill OCR & Stock Update (Admin Only)
```
Install and set up an OCR library (e.g. tesseract.js) on the backend.
Create a Purchase model: supplierName, billImage (stored file path), billDate, items (array of {rawText, matchedProduct ref, matchedVariantSku, qty, unitType, costPricePerUnit, isNewProduct}), status (enum: "Pending Review", "Added to Stock"), uploadedBy (ref User), createdAt.
Create API: POST /api/purchases/upload (admin only) — accepts an image file, runs OCR to extract raw text lines, attempts a basic match against existing product names/variants by string similarity, and returns a draft list of items with matched/unmatched status. Save this as a Purchase record with status "Pending Review".
Create API: PUT /api/purchases/:id/confirm (admin only) — accepts the admin-corrected items list (with final matched product/variant, qty, costPricePerUnit, or flags for new products to create), creates any new products/variants as needed, increases stockQty on each matched variant by qty, updates costPrice to the new costPricePerUnit, sets Purchase status to "Added to Stock".
On the Admin frontend, create a "Purchase Bill Upload" page: upload the bill image, show a loading state while OCR runs, then display an editable table of extracted items where the admin can correct product match, quantity, unit type, and cost price for each line (with a dropdown to match to an existing product/variant or mark "new product"), then a "Confirm & Add to Stock" button.
```

---

## 3. Open Items for You to Confirm Later
- Exact invoice format/layout (once you share the sample bill copy)
- Low-stock threshold number for alerts
- Whether retailer self-ordering needs admin approval before becoming "Confirmed", or auto-confirms
- GST rate(s) applicable to your products (5%/12%/18%) — per product or category-wise
- Your business's own state (for CGST/SGST vs IGST logic) and GSTIN details
