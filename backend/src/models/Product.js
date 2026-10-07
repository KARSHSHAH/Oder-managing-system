const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      trim: true,
      default: '',
    },
    color: {
      type: String,
      trim: true,
      default: '',
    },
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    unitType: {
      type: String,
      enum: ['Pcs', 'Box', 'Pack'],
      default: 'Pcs',
    },
    packSize: {
      type: Number,
      default: 1,
      min: 1,
    },
    stockQty: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    wholesaleRate: {
      type: Number,
      required: true,
      min: 0,
    },
    mrp: {
      type: Number,
      default: 0,
      min: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    hsnCode: {
      type: String,
      trim: true,
      default: '',
    },
    gstRate: {
      type: Number,
      default: 5,
    },
    variants: [variantSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
