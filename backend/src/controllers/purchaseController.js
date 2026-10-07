const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const Tesseract = require('tesseract.js');
const fs = require('fs');

// @desc    Upload purchase bill and run OCR
// @route   POST /api/purchases/upload
// @access  Private (Admin only)
exports.uploadPurchaseBill = async (req, res) => {
  try {
    console.log("STEP 1 - FILE RECEIVED:", req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      hasBuffer: !!req.file.buffer
    } : "No file");

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a bill image' });
    }

    const billImage = `/uploads/${req.file.filename}`;
    const filePath = req.file.path;

    const path = require('path');
    const absolutePath = path.resolve(req.file.path);

    // Run OCR
    console.log("STEP 2 - PASSED TO OCR:", absolutePath);
    const result = await Tesseract.recognize(absolutePath, 'eng');
    const text = result.data.text;
    console.log("STEP 3 - RAW OCR TEXT:", text);
    
    // Parse the text into items and attempt fuzzy matching
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const products = await Product.find({}); // Fetch all products for matching

    const items = [];
    const unmatchedItemsForNotification = [];

    // Filter and parse:
    // Ignore lines containing typical non-product keywords
    const ignoreKeywords = ['gstin', 'address', 'ph:', 'mob:', 'phone', 'total', 'tax', 'invoice', 'date', 'supplier'];
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Skip lines with ignore keywords
      if (ignoreKeywords.some(keyword => lowerLine.includes(keyword))) {
        continue;
      }

      // Regex to find a line with Text (Product Name) followed by numbers (Qty and Price)
      // e.g. "Cotton T-shirt L Red 50 120.50"
      // Match groups: 1 -> Name (with size/color), 2 -> Qty, 3 -> Price
      let itemName = '';
      let qty = 0;
      let price = 0;

      const cleanLine = line.replace(/[|\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
      const parts = cleanLine.split(' ');

      if (parts.length >= 3) {
        const lastPart = parts[parts.length - 1].replace(/,/g, '');
        if (!isNaN(parseFloat(lastPart))) {
            price = parseFloat(lastPart);
            
            const pcsIndex = parts.findIndex(p => p.toLowerCase() === 'pcs');
            if (pcsIndex !== -1) {
                for (let i = pcsIndex - 1; i >= 1; i--) {
                    if (!isNaN(parseFloat(parts[i])) && parseFloat(parts[i]) < 1000) {
                        qty = parseFloat(parts[i]);
                        break;
                    }
                }
            }
            
            if (qty === 0) {
                 for (let i = parts.length - 2; i >= 1; i--) {
                     if (!isNaN(parseFloat(parts[i]))) {
                         qty = parseFloat(parts[i]);
                         break;
                     }
                 }
            }
            
            let startIndex = /^\d+$/.test(parts[0]) ? 1 : 0;
            let nameEndIndex = startIndex;
            for (let i = startIndex; i < parts.length - 1; i++) {
                if (parts[i].toLowerCase() === 'pcs' || !isNaN(parseFloat(parts[i]))) {
                     if (parts[i].includes('-')) continue;
                     nameEndIndex = i;
                     break;
                }
                nameEndIndex++;
            }
            if (nameEndIndex === startIndex) nameEndIndex = parts.length - 2;
            itemName = parts.slice(startIndex, nameEndIndex).join(' ').trim();
        }
      }

      if (isNaN(qty) || isNaN(price) || qty <= 0 || price < 0 || itemName.length < 3) {
        continue;
      }

      // Parse Size and Color from Name
      const sizes = ['s', 'm', 'l', 'xl', 'xxl', 'xxxl', 'free'];
      const colors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'pink', 'grey', 'gray'];
      let size = '';
      let color = '';
      const nameParts = itemName.split(/\s+/);
      const remainingNameParts = [];

      for (const part of nameParts) {
        const lowerPart = part.toLowerCase();
        if (sizes.includes(lowerPart)) {
          size = part;
        } else if (colors.includes(lowerPart)) {
          color = part;
        } else {
          remainingNameParts.push(part);
        }
      }
      itemName = remainingNameParts.join(' ');

      let matchedProduct = null;
      let matchedVariantSku = '';
      let isAutoMatched = false;
      
      // Basic string matching against existing products
      for (const product of products) {
        // Match by parsed name
        if (itemName.toLowerCase().includes(product.name.toLowerCase()) || 
            product.name.toLowerCase().includes(itemName.toLowerCase())) {
          matchedProduct = product._id;
          
          if (product.variants && product.variants.length > 0) {
            // Try to match variant by size and color
            const matchedVar = product.variants.find(v => {
              const sizeMatch = !size || (v.size && v.size.toLowerCase() === size.toLowerCase());
              const colorMatch = !color || (v.color && v.color.toLowerCase() === color.toLowerCase());
              return sizeMatch && colorMatch;
            });
            
            matchedVariantSku = matchedVar ? matchedVar.sku : product.variants[0].sku;
          }
          break;
        }
      }

      if (!matchedProduct || !matchedVariantSku) {
        // Unmatched item, prepare notification
        unmatchedItemsForNotification.push({
          rawText: line,
          productName: itemName,
          qty,
          price
        });
      }

      items.push({
        rawText: line,
        itemName,
        size,
        color,
        matchedProduct,
        matchedVariantSku,
        qty,
        unitType: 'Pcs', // Default, could be refined
        price,
        isNewProduct: false,
        isAutoMatched: false
      });
    }

    console.log("STEP 4 - PARSED ITEMS:", JSON.stringify(items, null, 2));

    // Create notifications for unmatched items
    if (unmatchedItemsForNotification.length > 0) {
      const messages = unmatchedItemsForNotification.map(i => `${i.productName} (Qty: ${i.qty}, Price: ${i.price})`).join(', ');
      await Notification.create({
        recipientRole: 'admin',
        title: 'New Products Found in Purchase Bill',
        message: `The following items were unmatched and need review: ${messages}`,
        link: '/admin/purchases/upload'
      });
    }

    const purchase = await Purchase.create({
      supplierName: 'Unknown Supplier', // Could be extracted or provided in body
      billImage,
      items,
      status: 'Pending Review',
      uploadedBy: req.user._id
    });

    const responseData = {
      success: true,
      data: purchase,
      extractedText: text
    };
    console.log("STEP 5 - FINAL RESPONSE:", JSON.stringify(responseData, null, 2));
    res.status(201).json(responseData);

  } catch (error) {
    console.error("OCR/PARSING ERROR:", error);
    res.status(500).json({
      success: false,
      message: 'Server Error during OCR',
      error: error.message,
    });
  }
};

// @desc    Confirm purchase and add to stock
// @route   PUT /api/purchases/:id/confirm
// @access  Private (Admin only)
exports.confirmPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    if (purchase.status === 'Added to Stock') {
      return res.status(400).json({ success: false, message: 'Already added to stock' });
    }

    const { items, supplierName, billDate } = req.body;

    // Update purchase record
    purchase.items = items;
    if (supplierName) purchase.supplierName = supplierName;
    if (billDate) purchase.billDate = billDate;
    purchase.status = 'Added to Stock';

    await purchase.save();

    let updatedCount = 0;
    let newCount = 0;

    // Update stock for each item
    for (const item of items) {
      if (item.isNewProduct) {
        // AUTOMATICALLY CREATE new product
        const newProduct = new Product({
          name: item.itemName || 'New Product',
          brand: 'Generic', 
          category: 'Uncategorized',
          variants: [{
            size: item.size || '',
            color: item.color || '',
            sku: item.newVariantSku || `SKU-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`,
            unitType: item.unitType || 'Pcs',
            stockQty: Number(item.qty) || 0,
            wholesaleRate: Number(item.price) || 0,
            costPrice: Number(item.price) || 0
          }]
        });
        await newProduct.save();
        newCount++;
      } else if (item.matchedProduct && item.matchedVariantSku && item.qty > 0) {
        const product = await Product.findById(item.matchedProduct);
        if (product) {
          const variant = product.variants.find(v => v.sku === item.matchedVariantSku);
          if (variant) {
            console.log(`[Confirm Purchase] Product: ${product._id}, Variant SKU: ${variant.sku}`);
            console.log(`[Confirm Purchase] Stock BEFORE update: ${variant.stockQty}`);
            
            variant.stockQty += Number(item.qty);
            if (item.price) {
              variant.costPrice = Number(item.price);
            }
            
            console.log(`[Confirm Purchase] Stock AFTER update: ${variant.stockQty}`);
            
            // Note: Mongoose should automatically detect changes to subdocuments, but we use markModified just in case
            product.markModified('variants');
            await product.save();
            
            console.log(`[Confirm Purchase] Successfully saved product ${product._id}`);
            updatedCount++;
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      data: purchase,
      summary: { updatedCount, newCount }
    });

  } catch (error) {
    console.error("Confirm Purchase Error:", error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Private (Admin only)
exports.getAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().populate('uploadedBy', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: purchases.length, data: purchases });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get single purchase
// @route   GET /api/purchases/:id
// @access  Private (Admin only)
exports.getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id).populate('uploadedBy', 'name email').populate('items.matchedProduct', 'name');
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }
    res.status(200).json({ success: true, data: purchase });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
