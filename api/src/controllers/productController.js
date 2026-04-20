import cloudinary from '../config/cloudinary.js';
import Product from '../models/Product.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    // Filtering
    const query = {};
    if (req.query.category) {
      const categories = Array.isArray(req.query.category)
        ? req.query.category
        : req.query.category.split(',');
      query.category = { $in: categories.map((c) => c.trim()) };
    }
    if (req.query.minPrice) query.price = { $gte: req.query.minPrice };
    if (req.query.maxPrice) query.price = { ...query.price, $lte: req.query.maxPrice };
    if (req.query.colors) {
      const colorArray = Array.isArray(req.query.colors)
        ? req.query.colors
        : req.query.colors.split(',');
      const cleanedColors = colorArray.map((c) => c.trim()).filter(Boolean);
      if (cleanedColors.length > 0) {
        query.colors = {
          $elemMatch: {
            $or: [{ hex: { $in: cleanedColors } }, { name: { $in: cleanedColors } }],
          },
        };
      }
    }

    // Searching
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }

    // Sorting
    let sortOption = undefined;
    if (req.query.sort && req.query.order) {
      const sortField = req.query.sort;
      const sortOrder = req.query.order === 'asc' ? 1 : -1;
      sortOption = { [sortField]: sortOrder };
    }

    const products = await Product.find(query).sort(sortOption).limit(limit).skip(startIndex);
    const total = await Product.countDocuments(query);

    res.json({
      products,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    console.log('Files:', req.files);
    console.log('Body:', req.body);

    if (req.body.colors) {
      productData.colors = JSON.parse(req.body.colors);
    }
    if (req.body.sizes) {
      productData.sizes = JSON.parse(req.body.sizes);
    }

    if (req.files && req.files.length > 0) {
      console.log('Files received:', req.files.length);
      const images = req.files.map((file) => ({
        url: file.path || file.secure_url,
        publicId: file.filename || file.public_id,
      }));
      productData.images = images;
    } else {
      console.log('No files in request');
    }

    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (error) {
    console.error('Product create error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updateData = { ...req.body };

    if (req.body.colors) {
      updateData.colors = JSON.parse(req.body.colors);
    }
    if (req.body.sizes) {
      updateData.sizes = JSON.parse(req.body.sizes);
    }

    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    });

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        if (image.publicId) {
          await cloudinary.uploader.destroy(image.publicId);
        }
      }
    }

    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createProduct, deleteProduct, getProductById, getProducts, updateProduct };
