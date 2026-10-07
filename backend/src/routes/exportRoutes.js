const express = require('express');
const router = express.Router();
const {
  exportSalesToBusy,
  exportPurchasesToBusy
} = require('../controllers/exportController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Base route is /api/export

router.get('/busy/sales', authMiddleware, roleMiddleware(['admin']), exportSalesToBusy);
router.get('/busy/purchase', authMiddleware, roleMiddleware(['admin']), exportPurchasesToBusy);

module.exports = router;
