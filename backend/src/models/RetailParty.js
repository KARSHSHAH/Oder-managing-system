const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const retailPartySchema = new mongoose.Schema(
  {
    partyName: {
      type: String,
      required: [true, 'Party name is required'],
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },
    shopAddress: {
      type: String,
      trim: true,
      default: '',
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    contactNo: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    altContactNo: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    gstNo: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    panNo: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    areaRoute: {
      type: String,
      trim: true,
      default: 'General',
    },
    creditLimit: {
      type: Number,
      default: 50000,
      min: 0,
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked'],
      default: 'active',
    },
    loginId: {
      type: String,
      required: [true, 'Login ID is required'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    registeredVia: {
      type: String,
      enum: ['admin', 'self'],
      default: 'admin',
    },
  },
  { timestamps: true }
);

// Encrypt password before saving if modified
retailPartySchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

retailPartySchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('RetailParty', retailPartySchema);
