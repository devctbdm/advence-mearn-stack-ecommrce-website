import multer from 'multer';
import { imageStorage, digitalStorage } from '../config/cloudinary.js';

export const uploadImages = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadDigital = multer({
  storage: digitalStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
});
