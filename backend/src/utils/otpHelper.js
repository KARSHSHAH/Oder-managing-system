const Otp = require('../models/Otp');

/**
 * Checks if the given identifier has a verified OTP within the last 15 minutes.
 * This can be used by other registration APIs to confirm verification status.
 *
 * @param {string} identifier - The mobile number or email address.
 * @returns {Promise<boolean>} - Returns true if a valid verified OTP exists, false otherwise.
 */
exports.isIdentifierVerified = async (identifier) => {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const verifiedOtp = await Otp.findOne({
      identifier,
      verified: true,
      createdAt: { $gt: fifteenMinutesAgo },
    }).sort({ createdAt: -1 });

    return !!verifiedOtp;
  } catch (error) {
    console.error('Error checking OTP verification status:', error);
    return false;
  }
};
