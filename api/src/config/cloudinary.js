import dotenv from 'dotenv';
dotenv.config();

import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

console.log('Cloudinary cloud_name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('Cloudinary api_key:', process.env.CLOUDINARY_API_KEY ? 'loaded' : 'missing');

const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecommerce/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  },
});

const sliderStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecommerce/sliders',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  },
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecommerce/uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  },
});

export const uploadProductImages = multer({
  storage: productStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

export const uploadSliderImages = multer({
  storage: sliderStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

export const uploadImages = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit per file
});

export default cloudinary;
