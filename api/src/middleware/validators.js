import { body, param, query } from 'express-validator';

export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const productValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 100 }),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category')
    .isIn(['electronics', 'clothing', 'books', 'home', 'beauty', 'sports', 'other'])
    .withMessage('Invalid category'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

export const orderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('shippingAddress.street').trim().notEmpty().withMessage('Street is required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
  body('shippingAddress.state').trim().notEmpty().withMessage('State is required'),
  body('shippingAddress.zipCode').trim().notEmpty().withMessage('Zip code is required'),
  body('paymentMethod')
    .isIn(['credit_card', 'paypal', 'cash_on_delivery'])
    .withMessage('Invalid payment method'),
];

export const cartValidation = [
  body('productId').isMongoId().withMessage('Valid product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

export const idValidation = [param('id').isMongoId().withMessage('Valid ID is required')];

export const passwordResetRequestValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
];

export const passwordResetValidation = [
  body('resetToken').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];
