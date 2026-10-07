const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema(
  {
    rawText: {
      type: String,
      default: '',
    },
    itemName: {
      type: String,
      default: '',
    },
    size: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '',
    },
    matchedProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    matchedVariantSku: {
      type: String,
      default: '',
    },
    qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    unitType: {
      type: String,
      enum: ['Pcs', 'Box', 'Pack'],
      default: 'Pcs',
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    isNewProduct: {
      type: Boolean,
      default: false,
    },
    isAutoMatched: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const purchaseSchema = new mongoose.Schema(
  {
    supplierName: {
      type: String,
      trim: true,
      default: 'Unknown Supplier',
    },
    billImage: {
      type: String, // stored file path/URL
      required: [true, 'Bill image is required'],
    },
    billDate: {
      type: Date,
      default: Date.now,
    },
    items: [purchaseItemSchema],
    status: {
      type: String,
      enum: ['Pending Review', 'Added to Stock'],
      default: 'Pending Review',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Purchase', purchaseSchema);
