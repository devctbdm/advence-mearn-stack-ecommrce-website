import mongoose from 'mongoose';

const taxSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a tax name'],
    trim: true,
  },
  rate: {
    type: Number,
    required: [true, 'Please add a tax rate'],
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot exceed 100%'],
  },
  description: {
    type: String,
  },
  country: {
    type: String,
    default: 'Global',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

taxSchema.pre('save', async function () {
  if (this.isDefault) {
    await this.constructor.updateMany({ _id: { $ne: this._id } }, { isDefault: false });
  }
  if (this.isModified('isActive') && !this.isActive) {
    await this.constructor.updateMany({ _id: { $ne: this._id } }, { $set: { isActive: true } });
  }
});

const Tax = mongoose.models.Tax || mongoose.model('Tax', taxSchema);

export default Tax;
