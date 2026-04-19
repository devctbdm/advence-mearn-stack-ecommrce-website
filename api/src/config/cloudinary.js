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

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecommerce/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  },
});

export const uploadImages = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default cloudinary;
