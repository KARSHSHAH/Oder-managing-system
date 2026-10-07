const Product = require('../models/Product');

// Helper to filter out sensitive costPrice for non-admin roles
const sanitizeProducts = (products, role) => {
  if (role === 'admin') return products;

  const sanitizeSingle = (p) => {
    const obj = p.toObject ? p.toObject() : { ...p };
    if (obj.variants && Array.isArray(obj.variants)) {
      obj.variants = obj.variants.map((v) => {
        const { costPrice, ...rest } = v;
        return rest;
      });
    }
    return obj;
  };

  return Array.isArray(products) ? products.map(sanitizeSingle) : sanitizeSingle(products);
};

// @desc   Get all products with optional filters
// @route  GET /api/products
// @access Private (All authenticated roles)
const getProducts = async (req, res, next) => {
  try {
    const { category, brand, search, isActive } = req.query;
    let query = {};

    // Retailer and staff only see active products
    if (req.user.role !== 'admin') {
      query.isActive = true;
    } else if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (category) {
      query.category = category;
    }

    if (brand) {
      query.brand = brand;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { 'variants.sku': { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query).sort({ category: 1, name: 1 });
    const sanitized = sanitizeProducts(products, req.user.role);

    res.json(sanitized);
  } catch (error) {
    next(error);
  }
};

// @desc   Get single product by ID
// @route  GET /api/products/:id
// @access Private
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const sanitized = sanitizeProducts(product, req.user.role);
    res.json(sanitized);
  } catch (error) {
    next(error);
  }
};

// @desc   Create Product with flexible variants (Admin only)
// @route  POST /api/products
// @access Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const { name, brand, category, description, variants, isActive } = req.body;

    if (!name || !brand || !category) {
      return res.status(400).json({ message: 'Name, brand, and category are required' });
    }

    // Process and validate variants
    const processedVariants = (variants || []).map((v, idx) => {
      const sku =
        v.sku && v.sku.trim()
          ? v.sku.trim().toUpperCase()
          : `${brand.substring(0, 3).toUpperCase()}-${category.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}-${idx + 1}`;

      return {
        size: v.size || '',
        color: v.color || '',
        sku,
        stockQty: Number(v.stockQty) || 0,
        wholesaleRate: Number(v.wholesaleRate) || 0,
        mrp: Number(v.mrp) || 0,
        costPrice: Number(v.costPrice) || 0,
      };
    });

    const product = new Product({
      name: name.trim(),
      brand: brand.trim(),
      category: category.trim(),
      description: description || '',
      variants: processedVariants,
      isActive: isActive !== undefined ? isActive : true,
    });

    const saved = await product.save();
    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
};

// @desc   Update Product & Variants (Admin only)
// @route  PUT /api/products/:id
// @access Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { name, brand, category, description, variants, isActive } = req.body;

    if (name) product.name = name.trim();
    if (brand) product.brand = brand.trim();
    if (category) product.category = category.trim();
    if (description !== undefined) product.description = description;
    if (isActive !== undefined) product.isActive = isActive;

    if (variants && Array.isArray(variants)) {
      product.variants = variants.map((v, idx) => {
        const sku =
          v.sku && v.sku.trim()
            ? v.sku.trim().toUpperCase()
            : `${product.brand.substring(0, 3).toUpperCase()}-${product.category.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}-${idx + 1}`;

        return {
          size: v.size || '',
          color: v.color || '',
          sku,
          stockQty: Number(v.stockQty) || 0,
          wholesaleRate: Number(v.wholesaleRate) || 0,
          mrp: Number(v.mrp) || 0,
          costPrice: Number(v.costPrice) || 0,
        };
      });
    }

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc   Delete Product (Admin only)
// @route  DELETE /api/products/:id
// @access Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
