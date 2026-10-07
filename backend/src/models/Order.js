const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    variantSku: {
      type: String,
      required: true,
    },
    variantDetails: {
      type: String,
      default: '',
    },
    unitType: {
      type: String,
      default: 'Pcs',
    },
    packSize: {
      type: Number,
      default: 1,
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
    },
    hsnCode: {
      type: String,
      default: '',
    },
    gstRate: {
      type: Number,
      default: 0,
    },
    taxableAmount: {
      type: Number,
      default: 0,
    },
    cgstAmount: {
      type: Number,
      default: 0,
    },
    sgstAmount: {
      type: Number,
      default: 0,
    },
    igstAmount: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    retailParty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RetailParty',
      required: true,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    bookedByRole: {
      type: String,
      enum: ['staff', 'retailer', 'admin'],
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    taxableAmount: {
      type: Number,
      default: 0,
    },
    cgstAmount: {
      type: Number,
      default: 0,
    },
    sgstAmount: {
      type: Number,
      default: 0,
    },
    igstAmount: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Packed', 'Dispatched', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Cheque', 'Credit'],
      default: 'Credit',
    },
    initialPaymentReceived: {
      type: Number,
      default: 0,
    },
    invoicePdfPath: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
