const express = require('express');
const router = express.Router();
const {
  login,
  registerStaff,
  getMe,
  getStaffList,
  updateStaff,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/login', login);
router.post('/register-staff', authMiddleware, roleMiddleware(['admin']), registerStaff);
router.get('/me', authMiddleware, getMe);
router.get('/staff', authMiddleware, roleMiddleware(['admin']), getStaffList);
router.put('/staff/:id', authMiddleware, roleMiddleware(['admin']), updateStaff);

module.exports = router;
