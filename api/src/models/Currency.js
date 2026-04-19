import mongoose from 'mongoose';

const currencySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    symbol: {
      type: String,
      required: true,
      trim: true,
    },
    exchangeRateToUSD: {
      type: Number,
      required: true,
      min: 0,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one default currency
currencySchema.pre('save', async function () {
  if (this.isDefault) {
    await this.constructor.updateMany({ _id: { $ne: this._id } }, { $set: { isDefault: false } });
  }
});

const Currency = mongoose.model.Currency || mongoose.model('Currency', currencySchema);

export default Currency;
