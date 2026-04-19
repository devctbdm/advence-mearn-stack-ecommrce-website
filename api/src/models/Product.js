import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: 0,
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
  },
  productType: {
    type: String,
    enum: ['physical', 'digital'],
    default: 'physical',
  },
  colors: [
    {
      name: { type: String },
      hex: { type: String },
    },
  ],
  sizes: [
    {
      name: { type: String },
      stock: { type: Number, default: 0 },
    },
  ],
  stock: {
    type: Number,
    min: 0,
    default: 0,
  },
  digitalFile: {
    url: String,
    publicId: String,
  },
  images: [
    {
      url: String,
      publicId: String,
    },
  ],
  ratings: {
    type: Number,
    default: 0,
  },
  numReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: null,
  },
  discountValue: {
    type: Number,
    default: null,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

productSchema.pre('save', async function () {
  if (this.isModified('name') || !this.slug) {
    this.slug =
      this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Date.now();
  }
});

const Product = mongoose.model.Product || mongoose.model('Product', productSchema);

export default Product;
