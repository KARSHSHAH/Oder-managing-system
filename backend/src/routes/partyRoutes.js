const express = require('express');
const router = express.Router();
const {
  getParties,
  getPartyById,
  createParty,
  updateParty,
  deleteParty,
} = require('../controllers/partyController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router
  .route('/')
  .get(roleMiddleware(['admin', 'staff', 'retailer']), getParties)
  .post(roleMiddleware(['admin']), createParty);

router
  .route('/:id')
  .get(roleMiddleware(['admin', 'staff', 'retailer']), getPartyById)
  .put(roleMiddleware(['admin']), updateParty)
  .delete(roleMiddleware(['admin']), deleteParty);

module.exports = router;
