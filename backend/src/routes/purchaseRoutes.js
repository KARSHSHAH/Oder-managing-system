const express = require('express');
const { uploadPurchaseBill, confirmPurchase, getAllPurchases, getPurchaseById } = require('../controllers/purchaseController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Assuming you have a multer middleware setup, like upload.single('billImage')
// Let's use a placeholder middleware or require it if it exists. 
// For now, we'll assume there is a generic upload middleware, or we'll create a simple one inline.
const multer = require('multer');
const fs = require('fs');

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = file.originalname.split('.').pop() || 'png';
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Only JPG, JPEG, and PNG are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

const router = express.Router();

const uploadMiddleware = (req, res, next) => {
  const uploadSingle = upload.single('billImage');
  uploadSingle(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
      }
      return res.status(400).json({ success: false, message: 'Upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

router.get('/', authMiddleware, roleMiddleware(['admin']), getAllPurchases);
router.get('/:id', authMiddleware, roleMiddleware(['admin']), getPurchaseById);
router.post('/upload', authMiddleware, roleMiddleware(['admin']), uploadMiddleware, uploadPurchaseBill);
router.put('/:id/confirm', authMiddleware, roleMiddleware(['admin']), confirmPurchase);

module.exports = router;
