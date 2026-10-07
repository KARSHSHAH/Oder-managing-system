const Order = require('../models/Order');
const Product = require('../models/Product');
const RetailParty = require('../models/RetailParty');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const BusinessProfile = require('../models/BusinessProfile');
const { generateInvoicePDF } = require('../utils/pdfInvoice');
const fs = require('fs');

// Helper to generate sequential order number
const generateOrderNo = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `ORD-${timestamp}-${random}`;
};

// @desc   Create new order (Staff, Retailer, Admin)
// @route  POST /api/orders
// @access Private
const createOrder = async (req, res, next) => {
  try {
    const { retailPartyId, items, paymentMode, initialPayment, notes } = req.body;

    // Determine target retail party
    let partyId;
    if (req.user.role === 'retailer') {
      partyId = req.user._id;
    } else {
      if (!retailPartyId) {
        return res.status(400).json({ message: 'Retail Party must be selected' });
      }
      partyId = retailPartyId;
    }

    const party = await RetailParty.findById(partyId);
    if (!party) {
      return res.status(404).json({ message: 'Retail Party not found' });
    }

    if (party.status === 'blocked') {
      return res.status(403).json({ message: 'Cannot place order: Party is blocked' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    // Validate items and check stock
    let totalTaxableAmount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    const validatedItems = [];

    const businessProfile = await BusinessProfile.findOne() || { state: '' };
    const isSameState = party.state && businessProfile.state && party.state.toLowerCase() === businessProfile.state.toLowerCase();

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ message: `Product ${item.productName || item.productId} is not available` });
      }

      const variant = product.variants.find((v) => v.sku === item.variantSku);
      if (!variant) {
        return res.status(400).json({ message: `Variant ${item.variantSku} not found for product ${product.name}` });
      }

      const qty = Number(item.qty);
      if (qty <= 0) {
        return res.status(400).json({ message: `Invalid quantity for SKU ${item.variantSku}` });
      }

      if (variant.stockQty < qty) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name} (${item.variantSku}). Available: ${variant.stockQty}, Requested: ${qty}`,
        });
      }

      const rate = Number(item.rate) || variant.wholesaleRate;
      const itemTaxableAmount = qty * rate;
      const gstRate = product.gstRate || 0;
      
      const taxAmt = (itemTaxableAmount * gstRate) / 100;
      let itemCgst = 0, itemSgst = 0, itemIgst = 0;
      if (isSameState) {
        itemCgst = taxAmt / 2;
        itemSgst = taxAmt / 2;
      } else {
        itemIgst = taxAmt;
      }

      totalTaxableAmount += itemTaxableAmount;
      totalCgst += itemCgst;
      totalSgst += itemSgst;
      totalIgst += itemIgst;

      validatedItems.push({
        product: product._id,
        productName: product.name,
        variantSku: variant.sku,
        variantDetails: [variant.size ? `Size: ${variant.size}` : '', variant.color ? `Color: ${variant.color}` : '']
          .filter(Boolean)
          .join(', '),
        qty,
        unitType: variant.unitType || 'Pcs',
        packSize: variant.packSize || 1,
        rate,
        costPrice: variant.costPrice || 0,
        hsnCode: product.hsnCode || '',
        gstRate,
        taxableAmount: itemTaxableAmount,
        cgstAmount: itemCgst,
        sgstAmount: itemSgst,
        igstAmount: itemIgst,
        amount: itemTaxableAmount + taxAmt,
      });

      // Deduct stock
      variant.stockQty -= qty;
      await product.save();
    }

    const orderNo = generateOrderNo();
    const grandTotal = totalTaxableAmount + totalCgst + totalSgst + totalIgst;

    const order = new Order({
      orderNo,
      retailParty: party._id,
      bookedBy: req.user.role === 'retailer' ? null : req.user._id,
      bookedByRole: req.user.role,
      items: validatedItems,
      totalAmount: grandTotal,
      taxableAmount: totalTaxableAmount,
      cgstAmount: totalCgst,
      sgstAmount: totalSgst,
      igstAmount: totalIgst,
      grandTotal: grandTotal,
      status: 'Pending',
      paymentMode: paymentMode || 'Credit',
      initialPaymentReceived: Number(initialPayment) || 0,
      notes: notes || '',
    });

    const savedOrder = await order.save();

    // 1. Create Debit entry in ledger (party owes totalAmount)
    await Payment.create({
      retailParty: party._id,
      order: savedOrder._id,
      collectedBy: req.user.role === 'staff' ? req.user._id : null,
      amount: grandTotal,
      mode: paymentMode || 'Credit',
      type: 'Debit',
      referenceNo: `ORDER-${orderNo}`,
      remarks: `Order billed #${orderNo}`,
    });

    let newBalance = party.currentBalance + grandTotal;

    // 2. If initial payment received on booking, create Credit entry
    if (Number(initialPayment) > 0) {
      const paid = Number(initialPayment);
      await Payment.create({
        retailParty: party._id,
        order: savedOrder._id,
        collectedBy: req.user.role === 'staff' ? req.user._id : null,
        amount: paid,
        mode: paymentMode || 'Cash',
        type: 'Credit',
        referenceNo: `INIT-${orderNo}`,
        remarks: `Initial payment at booking for #${orderNo}`,
      });
      newBalance -= paid;
    }

    party.currentBalance = newBalance;
    await party.save();

    // 3. Create Notification for Admin
    await Notification.create({
      recipientRole: 'admin',
      title: 'New Order Placed',
      message: `Order #${orderNo} (Rs. ${grandTotal}) placed by ${party.partyName} (${req.user.role})`,
      link: `/admin/orders`,
    });

    const populated = await Order.findById(savedOrder._id)
      .populate('retailParty', 'partyName ownerName contactNo currentBalance creditLimit areaRoute')
      .populate('bookedBy', 'name email phone');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc   Get orders list (role-filtered)
// @route  GET /api/orders
// @access Private
const getOrders = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (req.user.role === 'retailer') {
      query.retailParty = req.user._id;
    } else if (req.user.role === 'staff') {
      query.$or = [{ bookedBy: req.user._id }];
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.orderNo = { $regex: search, $options: 'i' };
    }

    const orders = await Order.find(query)
      .populate('retailParty', 'partyName ownerName contactNo shopAddress areaRoute currentBalance creditLimit')
      .populate('bookedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc   Get single order by ID
// @route  GET /api/orders/:id
// @access Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('retailParty', 'partyName ownerName shopAddress contactNo gstNo currentBalance creditLimit')
      .populate('bookedBy', 'name email phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.role === 'retailer' && order.retailParty._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this order' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

// @desc   Update order status & generate invoice on Confirmed
// @route  PUT /api/orders/:id/status
// @access Private (Admin & Staff)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['Pending', 'Confirmed', 'Packed', 'Dispatched', 'Delivered', 'Cancelled'];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findById(req.params.id)
      .populate('retailParty')
      .populate('bookedBy');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const previousStatus = order.status;
    order.status = status;

    // If cancelled, restore stock & issue balance reversal credit
    if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
      for (const item of order.items) {
        const prod = await Product.findById(item.product);
        if (prod) {
          const variant = prod.variants.find((v) => v.sku === item.variantSku);
          if (variant) {
            variant.stockQty += item.qty;
            await prod.save();
          }
        }
      }

      // Reversal credit entry
      await Payment.create({
        retailParty: order.retailParty._id,
        order: order._id,
        collectedBy: req.user._id,
        amount: order.totalAmount,
        mode: 'Credit',
        type: 'Credit',
        referenceNo: `REVERSAL-${order.orderNo}`,
        remarks: `Order #${order.orderNo} cancelled - amount reversed`,
      });

      const party = await RetailParty.findById(order.retailParty._id);
      if (party) {
        party.currentBalance = Math.max(0, party.currentBalance - order.totalAmount);
        await party.save();
      }
    }

    // Auto-generate invoice when Confirmed
    if (status === 'Confirmed' || !order.invoicePdfPath) {
      try {
        const invoicePath = await generateInvoicePDF(order);
        order.invoicePdfPath = invoicePath;
      } catch (pdfErr) {
        console.error('Invoice PDF generation warning:', pdfErr.message);
      }
    }

    await order.save();

    // In-app notification for retailer
    await Notification.create({
      recipient: order.retailParty._id,
      recipientRole: 'retailer',
      title: `Order Status Updated: ${status}`,
      message: `Your order #${order.orderNo} has been updated to "${status}"`,
      link: `/retailer/orders`,
    });

    res.json({
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Download or stream Invoice PDF
// @route  GET /api/orders/:id/invoice
// @access Private
const downloadInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('retailParty');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Retailer authorization check
    if (req.user.role === 'retailer' && order.retailParty._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    let filePath = order.invoicePdfPath;
    if (!filePath || !fs.existsSync(filePath)) {
      filePath = await generateInvoicePDF(order);
      order.invoicePdfPath = filePath;
      await order.save();
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Invoice-${order.orderNo}.pdf"`);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  downloadInvoice,
};
