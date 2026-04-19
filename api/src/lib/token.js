import jwt from 'jsonwebtoken';

export const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
};

export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh', {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh');
};

export const generatePasswordResetToken = () => {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
};

export const generateVerificationToken = () => {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
};
