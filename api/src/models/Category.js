import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add category name'],
    trim: true,
    unique: true,
    lowercase: true,
  },
  slug: {
    type: String,
    unique: true,
  },
  description: String,
  image: {
    url: String,
    publicId: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

categorySchema.pre('save', async function () {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
});

const Category = mongoose.model.Category || mongoose.model('Category', categorySchema);

export default Category;
