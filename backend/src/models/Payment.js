const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    retailParty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RetailParty',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    mode: {
      type: String,
      enum: ['Cash', 'UPI', 'Cheque', 'Credit'],
      default: 'Cash',
    },
    type: {
      type: String,
      enum: ['Credit', 'Debit'],
      required: true,
      description: 'Debit = order amount billed to party, Credit = payment received from party',
    },
    referenceNo: {
      type: String,
      default: '',
      trim: true,
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
    },
    receiptNo: {
      type: String,
      default: null,
    },
    receiptGeneratedAt: {
      type: Date,
      default: null,
    },
    receiptGeneratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    receiptPdfPath: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
