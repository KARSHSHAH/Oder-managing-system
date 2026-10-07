# Feature Integration — Purchase Bill Photo → Auto Stock Update
*(Standalone — not tied to any phase, integrate whenever ready)*

**Where:** Admin panel only
**Goal:** Admin uploads a photo of the supplier's purchase bill → system reads the data (OCR) → admin reviews/corrects it → confirms → stock updates automatically.

---

## 1. How It Works (Workflow)

1. **Admin bill photo upload kare** — "Upload Purchase Bill" button se camera/gallery se photo select karke backend ko bhejta hai (multipart/form-data).
2. **Backend image store kare** — Multer se image server pe (ya Cloudinary/S3) save hoti hai, path Purchase record me rakha jata hai.
3. **OCR se raw text nikale** — Tesseract.js image process karke saara printed text nikalta hai (product name, qty, rate). Bill printed hai isliye accuracy achi rahegi.
4. **Text ko line-items me todo** — Regex/pattern matching se raw text ko line-by-line draft items me split kiya jata hai.
5. **Existing products se match karo** — Har extracted name ko naam-similarity se existing Product/Variant se match karne ki koshish hoti hai; jo na mile woh "unmatched" dikhta hai.
6. **Admin review screen pe correct kare** — Editable table: extracted text, matched product (dropdown se badal sakte ho), qty, rate. Naya product ho toh "New Product" mark karke details bhar sakte ho.
7. **Confirm karte hi stock update** — "Confirm & Add to Stock" dabate hi matched variant ka stockQty badhta hai, costPrice update hota hai, aur Purchase record permanently save ho jata hai.

> Bina review ke direct auto-add risky hai (OCR misread ho sakta hai) — isliye step 6 kabhi skip mat karna.

---

## 2. Schema

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
On confirm: for each item, `stockQty` of the matched variant increases by `qty`, and `costPrice` updates to the new `costPricePerUnit` (also feeds directly into your business's profit-margin analytics).

---

## 3. Antigravity Prompts

Give these two, one at a time, in order.

### Prompt A — Purchase Upload + OCR + Auto-Matching (Backend)
```
Install and set up an OCR library (tesseract.js) on the backend.
Create a Purchase model: supplierName, billImage (stored file path), billDate, items (array of {rawText, matchedProduct ref, matchedVariantSku, qty, unitType, costPricePerUnit, isNewProduct}), status (enum: "Pending Review", "Added to Stock"), uploadedBy (ref User), createdAt.
Set up multer for image upload handling.
Create API: POST /api/purchases/upload (admin only) — accepts an image file, saves it, runs OCR (tesseract.js) on it to extract raw text, splits the raw text into line items using pattern matching (look for lines containing a product-like name followed by numbers for qty/rate), then for each line attempts a fuzzy string-match against existing Product names/variant SKUs. Save all this as a Purchase record with status "Pending Review", including both matched and unmatched lines. Return the full draft item list in the response.
Create API: GET /api/purchases (admin only, list all, filterable by status) and GET /api/purchases/:id (single purchase with full item detail, for the review screen).
```

### Prompt B — Review Screen + Confirm + Stock Update (Frontend + Backend)
```
Create API: PUT /api/purchases/:id/confirm (admin only) — accepts the final admin-corrected items list (each with matchedProduct/matchedVariantSku, qty, unitType, costPricePerUnit, and isNewProduct flag). For items marked isNewProduct, create the new Product/variant first. For all items, increase stockQty on the matched variant by qty, and update that variant's costPrice to the new costPricePerUnit. Set the Purchase status to "Added to Stock".
On the Admin frontend, create a "Purchase Bill Upload" page:
- An upload control for the bill photo, with a loading state while OCR runs (call Prompt A's upload API).
- Once the draft items come back, show them in an editable table: extracted raw text (for reference), a dropdown to select/change the matched product+variant (or a "Mark as New Product" toggle with fields to enter new product details), quantity, unit type, and cost price per unit — all editable.
- Highlight unmatched lines in a different color so the admin notices them first.
- A "Confirm & Add to Stock" button that calls the confirm API, then shows a success message with a summary of how many variants' stock was updated.
- Also add a "Purchase History" list page showing all past purchases with their status and a link to view the original bill image.
```

---

### Prompt — Fix OCR Not Extracting Any Text
```
The purchase bill upload works and the image saves correctly, but OCR (tesseract.js) is not extracting any text from the image at all. Debug and fix this:
- Check that the image file path/buffer being passed to tesseract.js is correct (if multer is using memoryStorage, tesseract needs the buffer; if diskStorage, it needs the saved file path — make sure the code matches whichever storage mode is actually configured).
- Check that the tesseract.js recognize() call is properly awaited and its result (result.data.text) is being read correctly, not an empty or unresolved promise.
- Add console.log of the raw OCR output on the backend right after recognition, so we can confirm whether tesseract is returning text at all or returning empty/garbled output.
- If tesseract.js is failing to load its language data (check for a "fetch failed" or network-related error in the backend terminal), fix the language data path so it loads correctly in this environment.
Once fixed, confirm by uploading a bill and checking the backend terminal shows non-empty extracted text before it goes to parsing.
```

### Prompt — Extract Only Specific Fields + Require Admin Confirmation Before Stock Update
```
Update the purchase bill parsing and stock-update flow as follows:

1. From the OCR text, extract ONLY these fields per product line: item name, size, color, quantity, price. Ignore everything else (addresses, GSTIN, headers, footers, totals, phone numbers).

2. Do NOT automatically update stock on upload. Instead, after parsing, show the extracted list (item name, size, color, quantity, price) to the admin on the "Upload Purchase Bill" page as an editable review table, matched against existing product variants where possible.

3. Only when the admin clicks a "Confirm & Add to Stock" button should the system:
   - For matched items: increase that variant's stockQty by the given quantity and update costPrice.
   - For unmatched/new items: do not auto-create the product — flag it clearly in the table as "New Product — Not in Catalog" so the admin can decide to add it separately.

4. Nothing should be written to stock until the admin explicitly confirms.
```
```
The "Upload Purchase Bill" page works via its route but is missing from the Admin panel's sidebar/navbar — it's currently only reachable by typing the URL directly. Add a new navigation item in the Admin sidebar (alongside the existing items like Retail Parties, Product Catalog, Manage Orders, Ledger & Payments, Staff Accounts, Business Analytics), labeled "Purchase Bills", using an appropriate icon consistent with the existing sidebar icon style, linking to the existing purchase bill upload route. Also add a "Purchase History" link/tab near it if that page already exists, so both the upload screen and past purchase records are reachable from the sidebar.
```
This feature needs the **Product** model and **stockQty**/**costPrice** fields to already exist (from your base product catalog setup). It does not depend on the GST invoice or unit-type prompts — safe to integrate independently, anytime.

---

## 5. Fix Prompt — 401 Unauthorized on Purchase Bill Upload

If the "Upload Purchase Bill" screen shows "Failed to upload and process bill" with a 401 error in the network tab, give this prompt to Antigravity:

### Prompt — Fix 401 on Purchase Upload
```
The POST /api/purchases/upload request returns a 401 Unauthorized error. Find and fix the actual cause — most likely the frontend upload function (FormData) is not attaching the "Authorization: Bearer <token>" header like other authenticated calls in this app do. Fix whichever specific line is causing it, then confirm the upload works end-to-end.
```

### Prompt — Clean Up OCR Parsing + Auto Stock Logic
```
The purchase bill OCR is currently returning the full raw text (address, header, GSTIN, footer, etc.) instead of only relevant product line items. Fix the parsing and matching logic as follows:

1. Filter the OCR output so ONLY lines that look like actual product entries are extracted — a line qualifies only if it contains a product name plus at least a quantity and a price (optionally size/color too). Ignore and discard lines that are addresses, phone numbers, GSTIN, bill headers/footers, totals, or any non-product text.

2. For each extracted product line, parse out: product name, size (if present), color (if present), quantity, and price.

3. Match each parsed item against existing Product variants (by name + size + color, or SKU if identifiable).
   - If a match IS found: automatically increase that variant's stockQty by the parsed quantity and update its costPrice — do NOT require manual review for matched items.
   - If NO match is found: do NOT create a new product automatically. Instead, create a notification for the admin listing the unmatched product name/size/color/qty/price, so the admin can review and add it manually later.

4. Update the Purchase record to store: which items were auto-matched and stock-updated, and which items are pending as "new product" notifications.

5. Update the "Purchase Bill Upload" page result view to reflect this: show a clear "Stock Updated" list for matched items, and a separate "New Products Found — Needs Review" list for unmatched ones, instead of dumping raw OCR text.
```
