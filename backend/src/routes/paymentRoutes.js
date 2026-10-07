const express = require('express');
const router = express.Router();
const {
  recordPayment,
  getPartyLedger,
  getAllPayments,
  generateReceipt,
  downloadReceipt,
} = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router
  .route('/')
  .get(roleMiddleware(['admin', 'staff']), getAllPayments)
  .post(roleMiddleware(['admin', 'staff']), recordPayment);

router.get('/party/:partyId', getPartyLedger);

router.post('/:id/generate-receipt', roleMiddleware(['admin', 'staff']), generateReceipt);
router.get('/:id/receipt', downloadReceipt);

module.exports = router;
