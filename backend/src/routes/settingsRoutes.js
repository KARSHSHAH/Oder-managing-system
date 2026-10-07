const express = require('express');
const { getBusinessProfile, updateBusinessProfile } = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.route('/business-profile')
  .get(authMiddleware, getBusinessProfile)
  .put(authMiddleware, roleMiddleware(['admin']), updateBusinessProfile);

module.exports = router;
