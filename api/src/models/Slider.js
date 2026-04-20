import mongoose from 'mongoose';

const sliderSchema = new mongoose.Schema({
  mainImages: [
    {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      order: { type: Number, default: 0 },
    },
  ],
  sideImages: [
    {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      order: { type: Number, default: 0 },
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Slider = mongoose.model.Slider || mongoose.model('Slider', sliderSchema);

export default Slider;
