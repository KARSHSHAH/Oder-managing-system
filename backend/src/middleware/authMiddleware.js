const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RetailParty = require('../models/RetailParty');

const authMiddleware = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'wholesale_secret_key_undergarments_2026_super_secure'
      );
      console.log('[AuthMiddleware] Token verified successfully for ID:', decoded.id, '| Role:', decoded.role);

      if (decoded.role === 'admin' || decoded.role === 'staff') {
        const user = await User.findById(decoded.id).select('-password');
        if (!user || user.status !== 'active') {
          return res.status(401).json({ message: 'User account is inactive or not found' });
        }
        req.user = user;
        req.user.role = decoded.role;
      } else if (decoded.role === 'retailer') {
        const party = await RetailParty.findById(decoded.id).select('-password');
        if (!party || party.status !== 'active') {
          return res.status(401).json({
            message: party?.status === 'blocked' ? 'Account is blocked. Contact distributor.' : 'Account inactive or not found',
          });
        }
        req.user = party;
        req.user.role = 'retailer';
      } else {
        return res.status(401).json({ message: 'Invalid role attached to token' });
      }

      next();
    } catch (error) {
      console.error('[AuthMiddleware] Auth verification failed:', error.message);
      return res.status(401).json({ message: 'Token is invalid or expired' });
    }
  } else {
    console.warn('[AuthMiddleware] Authorization token missing or malformed');
    return res.status(401).json({ message: 'Authorization token missing' });
  }
};

module.exports = authMiddleware;
