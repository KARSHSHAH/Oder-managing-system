const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router
  .route('/')
  .get(getProducts) // all roles can view (sanitized for non-admin)
  .post(roleMiddleware(['admin']), createProduct);

router
  .route('/:id')
  .get(getProductById)
  .put(roleMiddleware(['admin']), updateProduct)
  .delete(roleMiddleware(['admin']), deleteProduct);

module.exports = router;
