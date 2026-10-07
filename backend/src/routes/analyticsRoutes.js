const express = require('express');
const router = express.Router();
const {
  getOverview,
  getSalesTrend,
  getTopProducts,
  getPartyRanking,
  getOutstandingDues,
  getStockAlerts,
  getStaffPerformance,
  getProfitMargin,
} = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/overview', getOverview);
router.get('/sales-trend', getSalesTrend);
router.get('/top-products', getTopProducts);
router.get('/party-ranking', getPartyRanking);
router.get('/outstanding-dues', getOutstandingDues);
router.get('/stock-alerts', getStockAlerts);
router.get('/staff-performance', getStaffPerformance);
router.get('/profit-margin', getProfitMargin);

module.exports = router;
