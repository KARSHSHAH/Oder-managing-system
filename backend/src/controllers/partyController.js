const RetailParty = require('../models/RetailParty');
const { isIdentifierVerified } = require('../utils/otpHelper');

// Helper to generate a clean login ID
const generateLoginId = async (partyName) => {
  const prefix = partyName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'RP';
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const loginId = `${prefix}${randomNum}`;

  const exists = await RetailParty.findOne({ loginId });
  if (exists) {
    return generateLoginId(partyName);
  }
  return loginId;
};

// @desc   Get Retail Parties list (filtered by role and assigned area)
// @route  GET /api/retail-parties
// @access Private (Admin & Staff)
const getParties = async (req, res, next) => {
  try {
    const { search, area, status } = req.query;
    let query = {};

    // Staff area filtering
    if (req.user.role === 'staff') {
      if (req.user.areaAssigned && req.user.areaAssigned.length > 0) {
        query.areaRoute = { $in: req.user.areaAssigned };
      }
    } else if (req.user.role === 'retailer') {
      // Retailer can only see own profile
      const party = await RetailParty.findById(req.user._id).select('-password');
      return res.json([party]);
    }

    if (search) {
      query.$or = [
        { partyName: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { contactNo: { $regex: search, $options: 'i' } },
        { loginId: { $regex: search, $options: 'i' } },
      ];
    }

    if (area) {
      query.areaRoute = area;
    }

    if (status) {
      query.status = status;
    }

    const parties = await RetailParty.find(query)
      .select('-password')
      .sort({ partyName: 1 });

    res.json(parties);
  } catch (error) {
    next(error);
  }
};

// @desc   Get single party by ID
// @route  GET /api/retail-parties/:id
// @access Private
const getPartyById = async (req, res, next) => {
  try {
    const party = await RetailParty.findById(req.params.id).select('-password');
    if (!party) {
      return res.status(404).json({ message: 'Retail party not found' });
    }

    // Role-based check
    if (req.user.role === 'retailer' && req.user._id.toString() !== party._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this party' });
    }

    res.json(party);
  } catch (error) {
    next(error);
  }
};

// @desc   Create new Retail Party (Admin only)
// @route  POST /api/retail-parties
// @access Private/Admin
const createParty = async (req, res, next) => {
  try {
    const {
      partyName,
      ownerName,
      shopAddress,
      contactNo,
      altContactNo,
      email,
      gstNo,
      panNo,
      areaRoute,
      creditLimit,
      openingBalance,
      status,
      password,
    } = req.body;

    if (!partyName || !ownerName || !contactNo) {
      return res.status(400).json({ message: 'Party Name, Owner Name, and Contact No are required' });
    }

    // OTP Verification Check
    const mobileVerified = await isIdentifierVerified(contactNo);
    const emailVerified = email ? await isIdentifierVerified(email) : false;
    
    if (!mobileVerified && !emailVerified) {
      return res.status(400).json({ message: 'OTP verification is required before creating a party (verify mobile or email).' });
    }

    const loginId = await generateLoginId(partyName);
    const initialPassword = password && password.trim() ? password.trim() : 'Retail@123';
    const initBalance = Number(openingBalance) || 0;

    const party = new RetailParty({
      partyName,
      ownerName,
      shopAddress,
      contactNo,
      altContactNo,
      email,
      gstNo,
      panNo,
      areaRoute: areaRoute || 'General',
      creditLimit: creditLimit !== undefined ? Number(creditLimit) : 50000,
      openingBalance: initBalance,
      currentBalance: initBalance,
      status: status || 'active',
      loginId,
      password: initialPassword, // pre-save will hash
      createdBy: req.user._id,
      registeredVia: 'admin',
    });

    const savedParty = await party.save();

    // Return created party including raw generated credentials for admin to share
    res.status(201).json({
      message: 'Retail party created successfully',
      party: {
        _id: savedParty._id,
        partyName: savedParty.partyName,
        ownerName: savedParty.ownerName,
        contactNo: savedParty.contactNo,
        loginId: savedParty.loginId,
        temporaryPassword: initialPassword,
        areaRoute: savedParty.areaRoute,
        creditLimit: savedParty.creditLimit,
        currentBalance: savedParty.currentBalance,
        status: savedParty.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Update Retail Party (Admin only)
// @route  PUT /api/retail-parties/:id
// @access Private/Admin
const updateParty = async (req, res, next) => {
  try {
    const party = await RetailParty.findById(req.params.id);
    if (!party) {
      return res.status(404).json({ message: 'Retail party not found' });
    }

    const updatableFields = [
      'partyName',
      'ownerName',
      'shopAddress',
      'contactNo',
      'altContactNo',
      'email',
      'gstNo',
      'panNo',
      'areaRoute',
      'creditLimit',
      'status',
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        party[field] = req.body[field];
      }
    });

    if (req.body.password && req.body.password.trim()) {
      party.password = req.body.password.trim();
    }

    const updated = await party.save();
    const result = updated.toObject();
    delete result.password;

    res.json({
      message: 'Retail party updated successfully',
      party: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete Retail Party (Admin only)
// @route  DELETE /api/retail-parties/:id
// @access Private/Admin
const deleteParty = async (req, res, next) => {
  try {
    const party = await RetailParty.findById(req.params.id);
    if (!party) {
      return res.status(404).json({ message: 'Retail party not found' });
    }

    await RetailParty.findByIdAndDelete(req.params.id);
    res.json({ message: 'Retail party removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getParties,
  getPartyById,
  createParty,
  updateParty,
  deleteParty,
};
