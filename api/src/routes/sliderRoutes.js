import express from 'express';
import {
  createSlider,
  deleteSlider,
  getAllSliders,
  getSliderById,
  getSliders,
  updateSlider,
} from '../controllers/sliderController.js';
import { admin, protect } from '../middleware/auth.js';
import { uploadSliderImages } from '../config/cloudinary.js';

const router = express.Router();

// Public routes
router.get('/', getSliders);
router.get('/:id', getSliderById);

// Admin routes
router.post(
  '/',
  protect,
  admin,
  uploadSliderImages.fields([
    { name: 'mainImages', maxCount: 3 },
    { name: 'sideImages', maxCount: 2 },
  ]),
  createSlider
);
router.put(
  '/:id',
  protect,
  admin,
  uploadSliderImages.fields([
    { name: 'mainImages', maxCount: 3 },
    { name: 'sideImages', maxCount: 2 },
  ]),
  updateSlider
);
router.delete('/:id', protect, admin, deleteSlider);
router.get('/admin/all', protect, admin, getAllSliders);

export default router;
