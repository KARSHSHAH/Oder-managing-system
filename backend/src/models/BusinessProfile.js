const mongoose = require('mongoose');

const bankDetailsSchema = new mongoose.Schema(
  {
    accountName: { type: String, trim: true, default: '' },
    accountNo: { type: String, trim: true, default: '' },
    ifsc: { type: String, trim: true, default: '' },
    bankName: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const businessProfileSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    invoicePrefix: {
      type: String,
      trim: true,
      default: 'INV-',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    bankDetails: {
      type: bankDetailsSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BusinessProfile', businessProfileSchema);
