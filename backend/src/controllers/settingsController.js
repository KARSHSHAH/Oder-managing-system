const BusinessProfile = require('../models/BusinessProfile');

// @desc    Get business profile
// @route   GET /api/settings/business-profile
// @access  Private (Admin, Staff)
exports.getBusinessProfile = async (req, res) => {
  try {
    let profile = await BusinessProfile.findOne();
    if (!profile) {
      // Create a default one if it doesn't exist
      profile = await BusinessProfile.create({
        businessName: 'My Wholesale Business',
      });
    }
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Update business profile
// @route   PUT /api/settings/business-profile
// @access  Private (Admin only)
exports.updateBusinessProfile = async (req, res) => {
  try {
    let profile = await BusinessProfile.findOne();
    if (!profile) {
      profile = new BusinessProfile(req.body);
      await profile.save();
    } else {
      profile = await BusinessProfile.findOneAndUpdate({}, req.body, {
        new: true,
        runValidators: true,
      });
    }
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};
