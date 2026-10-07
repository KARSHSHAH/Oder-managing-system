const Payment = require('../models/Payment');
const RetailParty = require('../models/RetailParty');
const Notification = require('../models/Notification');
const { generateReceiptPDF } = require('../utils/pdfReceipt');
const path = require('path');
const fs = require('fs');

// @desc   Record payment collection from retail party
// @route  POST /api/payments
// @access Private (Admin & Staff)
const recordPayment = async (req, res, next) => {
  try {
    const { retailPartyId, amount, mode, referenceNo, remarks } = req.body;

    if (!retailPartyId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Valid Retail Party and Amount are required' });
    }

    const party = await RetailParty.findById(retailPartyId);
    if (!party) {
      return res.status(404).json({ message: 'Retail party not found' });
    }

    const numericAmount = Number(amount);

    const payment = new Payment({
      retailParty: party._id,
      collectedBy: req.user._id,
      amount: numericAmount,
      mode: mode || 'Cash',
      type: 'Credit', // Credit reduces the party's outstanding dues
      referenceNo: referenceNo || '',
      remarks: remarks || `Payment received via ${mode || 'Cash'}`,
    });

    const savedPayment = await payment.save();

    // Update current balance
    party.currentBalance = Math.max(0, party.currentBalance - numericAmount);
    await party.save();

    // Trigger in-app notification to retailer
    await Notification.create({
      recipient: party._id,
      recipientRole: 'retailer',
      title: 'Payment Received',
      message: `Payment of Rs. ${numericAmount} received via ${mode || 'Cash'}. Updated outstanding balance: Rs. ${party.currentBalance}`,
      link: `/retailer/ledger`,
    });

    const populated = await Payment.findById(savedPayment._id)
      .populate('retailParty', 'partyName ownerName contactNo currentBalance')
      .populate('collectedBy', 'name email');

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment: populated,
      updatedBalance: party.currentBalance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get full running ledger for a specific retail party
// @route  GET /api/payments/party/:partyId
// @access Private (Admin, Staff, or the specific Retailer)
const getPartyLedger = async (req, res, next) => {
  try {
    const partyId = req.params.partyId;

    if (req.user.role === 'retailer' && req.user._id.toString() !== partyId) {
      return res.status(403).json({ message: 'Unauthorized access to this party ledger' });
    }

    const party = await RetailParty.findById(partyId).select('-password');
    if (!party) {
      return res.status(404).json({ message: 'Retail party not found' });
    }

    const entries = await Payment.find({ retailParty: partyId })
      .populate('collectedBy', 'name email')
      .populate('order', 'orderNo totalAmount status')
      .sort({ createdAt: 1 });

    // Compute running balance
    let runningBalance = party.openingBalance || 0;
    const ledger = entries.map((entry) => {
      if (entry.type === 'Debit') {
        runningBalance += entry.amount;
      } else if (entry.type === 'Credit') {
        runningBalance -= entry.amount;
      }

      return {
        _id: entry._id,
        date: entry.createdAt,
        type: entry.type,
        mode: entry.mode,
        amount: entry.amount,
        referenceNo: entry.referenceNo,
        remarks: entry.remarks,
        orderNo: entry.order?.orderNo || null,
        collectedBy: entry.collectedBy?.name || 'System',
        runningBalance: Math.max(0, runningBalance),
        receiptNo: entry.receiptNo,
        receiptGeneratedAt: entry.receiptGeneratedAt,
      };
    });

    res.json({
      party: {
        _id: party._id,
        partyName: party.partyName,
        ownerName: party.ownerName,
        contactNo: party.contactNo,
        openingBalance: party.openingBalance,
        currentBalance: party.currentBalance,
        creditLimit: party.creditLimit,
        areaRoute: party.areaRoute,
      },
      ledger: ledger.reverse(), // most recent first for display
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get recent collections/payments list (for Admin & Staff)
// @route  GET /api/payments
// @access Private (Admin & Staff)
const getAllPayments = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'staff') {
      query.collectedBy = req.user._id;
    }

    const payments = await Payment.find(query)
      .populate('retailParty', 'partyName ownerName areaRoute contactNo')
      .populate('collectedBy', 'name email')
      .populate('order', 'orderNo')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(payments);
  } catch (error) {
    next(error);
  }
};

// @desc   Generate Receipt PDF for a payment
// @route  POST /api/payments/:id/generate-receipt
// @access Private (Admin & Staff)
const generateReceipt = async (req, res, next) => {
  try {
    const paymentId = req.params.id;

    const payment = await Payment.findById(paymentId)
      .populate('retailParty', 'partyName ownerName contactNo shopAddress')
      .populate('collectedBy', 'name')
      .populate('order', 'orderNo');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.receiptNo) {
      return res.status(400).json({ message: 'Receipt already generated for this payment' });
    }

    // Auto-generate receiptNo
    const timestamp = Date.now().toString().slice(-6);
    payment.receiptNo = `RCPT-${timestamp}`;
    payment.receiptGeneratedAt = new Date();
    payment.receiptGeneratedBy = req.user._id;

    // We need to calculate running balance. Since we don't store it on Payment,
    // we fetch the party's current balance. 
    // Ideally, a receipt should show balance at the time, but for now we can use party.currentBalance or re-compute it.
    const party = await RetailParty.findById(payment.retailParty._id);
    const runningBalance = party ? party.currentBalance : 0;

    const pdfPath = await generateReceiptPDF(payment, runningBalance);
    payment.receiptPdfPath = pdfPath;

    await payment.save();

    res.json({
      message: 'Receipt generated successfully',
      receiptNo: payment.receiptNo,
      receiptGeneratedAt: payment.receiptGeneratedAt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Download Receipt PDF
// @route  GET /api/payments/:id/receipt
// @access Private (Admin, Staff, or the specific Retailer)
const downloadReceipt = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Role check
    if (req.user.role === 'retailer' && req.user._id.toString() !== payment.retailParty.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this receipt' });
    }

    if (!payment.receiptPdfPath || !fs.existsSync(payment.receiptPdfPath)) {
      return res.status(404).json({ message: 'Receipt PDF not found or not yet generated' });
    }

    const filePath = payment.receiptPdfPath;
    const stat = fs.statSync(filePath);

    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Receipt-${payment.receiptNo}.pdf"`);

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordPayment,
  getPartyLedger,
  getAllPayments,
  generateReceipt,
  downloadReceipt,
};
