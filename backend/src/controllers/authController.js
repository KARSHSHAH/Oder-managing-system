const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RetailParty = require('../models/RetailParty');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'wholesale_secret_key_undergarments_2026_super_secure',
    { expiresIn: '7d' }
  );
};

// @desc   Login for Admin, Staff, or Retailer
// @route  POST /api/auth/login
// @access Public
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide identifier and password' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // 1. Check User collection (Admin or Staff)
    const user = await User.findOne({ email: cleanIdentifier });
    if (user) {
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ message: 'User account is inactive' });
      }

      const token = generateToken(user._id, user.role);
      console.log('[Auth] Token created for user:', user.email, '| Role:', user.role);

      return res.json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          areaAssigned: user.areaAssigned || [],
          status: user.status,
        },
      });
    }

    // 2. Check RetailParty collection (Retailer)
    const party = await RetailParty.findOne({
      $or: [
        { loginId: { $regex: new RegExp(`^${identifier.trim()}$`, 'i') } },
        { email: cleanIdentifier },
      ],
    });

    if (party) {
      const isMatch = await party.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (party.status === 'blocked') {
        return res.status(403).json({ message: 'Account is blocked. Please contact distributor.' });
      }

      if (party.status !== 'active') {
        return res.status(403).json({ message: 'Account is inactive.' });
      }

      const token = generateToken(party._id, 'retailer');
      console.log('[Auth] Token created for retailer:', party.email, '| Role: retailer');
      return res.json({
        token,
        user: {
          _id: party._id,
          name: party.partyName,
          ownerName: party.ownerName,
          loginId: party.loginId,
          email: party.email,
          contactNo: party.contactNo,
          role: 'retailer',
          areaRoute: party.areaRoute,
          creditLimit: party.creditLimit,
          currentBalance: party.currentBalance,
          shopAddress: party.shopAddress,
          gstNo: party.gstNo,
          status: party.status,
        },
      });
    }

    return res.status(401).json({ message: 'Invalid credentials or user not found' });
  } catch (error) {
    next(error);
  }
};

// @desc   Register Staff Account (Admin only)
// @route  POST /api/auth/register-staff
// @access Private/Admin
const registerStaff = async (req, res, next) => {
  try {
    const { name, email, phone, password, areaAssigned } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      phone,
      password,
      role: 'staff',
      areaAssigned: Array.isArray(areaAssigned) ? areaAssigned : areaAssigned ? [areaAssigned] : [],
      status: 'active',
    });

    res.status(201).json({
      message: 'Staff account created successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        areaAssigned: user.areaAssigned,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get current logged-in user profile
// @route  GET /api/auth/me
// @access Private
const getMe = async (req, res, next) => {
  try {
    res.json({
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   List all staff members
// @route  GET /api/auth/staff
// @access Private/Admin
const getStaffList = async (req, res, next) => {
  try {
    const staffMembers = await User.find({ role: 'staff' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(staffMembers);
  } catch (error) {
    next(error);
  }
};

// @desc   Update staff details
// @route  PUT /api/auth/staff/:id
// @access Private/Admin
const updateStaff = async (req, res, next) => {
  try {
    const { name, phone, areaAssigned, status, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user || user.role !== 'staff') {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (areaAssigned) user.areaAssigned = Array.isArray(areaAssigned) ? areaAssigned : [areaAssigned];
    if (status) user.status = status;
    if (password) user.password = password; // Will be hashed by pre-save hook

    await user.save();

    res.json({
      message: 'Staff member updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        areaAssigned: user.areaAssigned,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  registerStaff,
  getMe,
  getStaffList,
  updateStaff,
};
