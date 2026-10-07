const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  downloadInvoice,
} = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router
  .route('/')
  .get(getOrders)
  .post(roleMiddleware(['admin', 'staff', 'retailer']), createOrder);

router.get('/:id/invoice', downloadInvoice);

router
  .route('/:id')
  .get(getOrderById);

router.put('/:id/status', roleMiddleware(['admin', 'staff']), updateOrderStatus);

module.exports = router;
