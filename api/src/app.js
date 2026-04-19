import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import mongoose from 'mongoose';
import connectDB from './config/db.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import currencyRoutes from './routes/currencyRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import productRoutes from './routes/productRoutes.js';
import promoRoutes from './routes/promoRoutes.js';
import userRoutes from './routes/userRoutes.js';
import shippingRoutes from './routes/shippingRoutes.js';
import taxRoutes from './routes/taxRoutes.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();

// ── 1. CORS (must be first so preflight OPTIONS requests are handled) ──
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── 2. Body parsers ────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded());

// ── 3. Security headers ────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ── 5. HTTP Parameter Pollution & compression ──────────────────────────
app.use(hpp());
app.use(compression());

// ── 6. Database ────────────────────────────────────────────────────────
connectDB();

mongoose.connection.on('connected', () => {
  console.log('✅ Database connected');
});
mongoose.connection.on('error', (err) => {
  console.error(`❌ Database error: ${err.message}`);
});
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Database disconnected');
});

// ── 7. Routes ──────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/taxes', taxRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// ── 8. Error handler ───────────────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
