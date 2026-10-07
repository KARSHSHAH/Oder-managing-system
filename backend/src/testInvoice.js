require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');
const RetailParty = require('./models/RetailParty');
const Product = require('./models/Product');
const BusinessProfile = require('./models/BusinessProfile');
const { generateInvoicePDF } = require('./utils/pdfInvoice');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/oms');
    console.log('Connected to DB');

    // Create a dummy retail party in Gujarat to test intra-state (CGST+SGST)
    let party = await RetailParty.findOne({ state: 'Gujarat' });
    if (!party) {
      party = await RetailParty.create({
        partyName: 'Gujarat Retailer',
        ownerName: 'Test Owner',
        contactNo: '1234567890',
        loginId: `retailer_${Date.now()}`,
        password: 'password123',
        shopAddress: 'Test Shop, Ahmedabad',
        state: 'Gujarat',
        gstNo: '24TEST1234T1Z5'
      });
    }

    // Create a dummy product
    let product = await Product.findOne();
    if (!product) {
      product = await Product.create({
        name: 'Test Shirt',
        brand: 'Test Brand',
        category: 'Shirts',
        hsnCode: '6109',
        gstRate: 5,
        variants: [{
          sku: 'TS-001',
          stockQty: 100,
          wholesaleRate: 100,
          unitType: 'Pcs'
        }]
      });
    }

    // Prepare item
    const variant = product.variants[0];
    const qty = 10;
    const rate = variant.wholesaleRate;
    const taxableAmt = qty * rate;
    const gstRate = product.gstRate;
    const taxAmt = (taxableAmt * gstRate) / 100;
    const cgstAmount = taxAmt / 2;
    const sgstAmount = taxAmt / 2;
    
    // Create order
    const orderNo = `TEST-ORD-${Date.now()}`;
    const order = await Order.create({
      orderNo,
      retailParty: party._id,
      bookedByRole: 'admin',
      items: [{
        product: product._id,
        productName: product.name,
        variantSku: variant.sku,
        qty,
        rate,
        hsnCode: product.hsnCode,
        gstRate,
        taxableAmount: taxableAmt,
        cgstAmount,
        sgstAmount,
        igstAmount: 0,
        amount: taxableAmt + taxAmt
      }],
      taxableAmount: taxableAmt,
      cgstAmount,
      sgstAmount,
      igstAmount: 0,
      totalAmount: taxableAmt + taxAmt,
      grandTotal: taxableAmt + taxAmt,
      status: 'Confirmed'
    });

    const populatedOrder = await Order.findById(order._id).populate('retailParty');
    const invoicePath = await generateInvoicePDF(populatedOrder);
    
    console.log('Invoice generated at:', invoicePath);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
