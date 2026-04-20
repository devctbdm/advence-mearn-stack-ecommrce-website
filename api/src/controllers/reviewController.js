import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';

const updateProductRating = async (productId) => {
  const reviews = await Review.find({ product: productId, status: 'approved' });
  if (reviews.length === 0) {
    await Product.findByIdAndUpdate(productId, { ratings: 0, numReviews: 0 });
    return;
  }
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await Product.findByIdAndUpdate(productId, {
    ratings: Math.round(avgRating * 10) / 10,
    numReviews: reviews.length,
  });
};

const getReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const query = {};
    if (req.query.status && req.query.status !== 'undefined' && req.query.status !== '') {
      query.status = req.query.status;
    }
    if (req.query.product && req.query.product !== 'undefined') {
      query.product = req.query.product;
    }
    if (req.query.rating && req.query.rating !== 'undefined') {
      query.rating = parseInt(req.query.rating);
    }

    if (req.query.search) {
      const products = await Product.find({
        name: { $regex: req.query.search, $options: 'i' },
      }).select('_id');
      const productIds = products.map((p) => p._id);
      query.$or = [
        { product: { $in: productIds } },
        { comment: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Debug logging
    console.log('getReviews - User:', req.user?._id, 'Role:', req.user?.role);
    console.log('getReviews - Query:', JSON.stringify(query));
    console.log('getReviews - Page:', page, 'Limit:', limit);

    const sortField = req.query.sort || 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };

    const reviews = await Review.find(query)
      .populate('product', 'name images')
      .populate('user', 'name email')
      .sort(sortOption)
      .limit(limit)
      .skip(startIndex);

    const total = await Review.countDocuments(query);

    console.log('getReviews - Found:', reviews.length, 'reviews, Total:', total);

    res.json({
      reviews,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error('getReviews error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('product', 'name images')
      .populate('user', 'name email');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const reviews = await Review.find({
      product: req.params.productId,
      status: 'approved',
    })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    const total = await Review.countDocuments({
      product: req.params.productId,
      status: 'approved',
    });

    const stats = await Review.aggregate([
      { $match: { product: req.params.productId, status: 'approved' } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
    ]);

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats.forEach((s) => {
      ratingDistribution[s._id] = s.count;
    });

    res.json({
      reviews,
      page,
      totalPages: Math.ceil(total / limit),
      total,
      ratingDistribution,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createReview = async (req, res) => {
  try {
    const { product, rating, comment } = req.body;

    const existingReview = await Review.findOne({ user: req.user._id, product });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const orders = await Order.find({
      user: req.user._id,
      'items.product': product,
      status: { $in: ['delivered', 'completed'] },
    });
    const isVerifiedPurchase = orders.length > 0;

    const review = await Review.create({
      product,
      user: req.user._id,
      rating,
      comment,
      isVerifiedPurchase,
    });

    const populatedReview = await Review.findById(review._id)
      .populate('product', 'name images')
      .populate('user', 'name email');

    res.status(201).json(populatedReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    if (review.status === 'approved') {
      return res.status(400).json({ message: 'Cannot update an approved review' });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate('product', 'name images')
      .populate('user', 'name email');

    res.json(populatedReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await review.deleteOne();
    await updateProductRating(review.product);

    res.json({ message: 'Review removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.status = 'approved';
    await review.save();
    await updateProductRating(review.product);

    const populatedReview = await Review.findById(review._id)
      .populate('product', 'name images')
      .populate('user', 'name email');

    res.json(populatedReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.status = 'rejected';
    await review.save();
    await updateProductRating(review.product);

    const populatedReview = await Review.findById(review._id)
      .populate('product', 'name images')
      .populate('user', 'name email');

    res.json(populatedReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const replyToReview = async (req, res) => {
  try {
    const { message } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.status !== 'approved') {
      return res.status(400).json({ message: 'Can only reply to approved reviews' });
    }

    review.adminReply = {
      message,
      repliedAt: Date.now(),
      repliedBy: req.user._id,
    };
    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate('product', 'name images')
      .populate('user', 'name email')
      .populate('adminReply.repliedBy', 'name');

    res.json(populatedReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPendingReviewsCount = async (req, res) => {
  try {
    const count = await Review.countDocuments({ status: 'pending' });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  approveReview,
  createReview,
  deleteReview,
  getPendingReviewsCount,
  getProductReviews,
  getReviewById,
  getReviews,
  rejectReview,
  replyToReview,
  updateReview,
};
