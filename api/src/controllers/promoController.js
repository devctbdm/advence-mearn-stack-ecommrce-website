import PromoCode from '../models/PromoCode.js';

const getAllPromoCodes = async (req, res) => {
  try {
    const promos = await PromoCode.find({}).sort({ createdAt: -1 });
    res.json(promos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPromoCodeById = async (req, res) => {
  try {
    const promo = await PromoCode.findById(req.params.id);

    if (!promo) {
      return res.status(404).json({ message: 'Promo code not found' });
    }

    res.json(promo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPromoCode = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      usageLimit,
      applicableProducts,
      applicableCategories,
      isActive,
      isOneTime,
      startDate,
      endDate,
    } = req.body;

    // Check if promo code already exists
    const existingPromo = await PromoCode.findOne({ code: code.toUpperCase() });
    if (existingPromo) {
      return res.status(400).json({ message: 'Promo code already exists' });
    }

    const promo = await PromoCode.create({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minPurchase: minPurchase || 0,
      maxDiscount,
      usageLimit,
      applicableProducts: applicableProducts || [],
      applicableCategories: applicableCategories || [],
      isActive: isActive !== undefined ? isActive : true,
      isOneTime: isOneTime || false,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: new Date(endDate),
    });

    res.status(201).json(promo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePromoCode = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      usageLimit,
      applicableProducts,
      applicableCategories,
      isActive,
      isOneTime,
      startDate,
      endDate,
    } = req.body;

    const updateData = {};

    if (code) updateData.code = code.toUpperCase();
    if (description) updateData.description = description;
    if (discountType) updateData.discountType = discountType;
    if (discountValue !== undefined && discountValue !== '') updateData.discountValue = discountValue;
    if (minPurchase !== undefined && minPurchase !== '') updateData.minPurchase = minPurchase;
    if (maxDiscount !== undefined && maxDiscount !== '') updateData.maxDiscount = maxDiscount;
    if (usageLimit !== undefined && usageLimit !== '') updateData.usageLimit = usageLimit;
    if (applicableProducts !== undefined) updateData.applicableProducts = applicableProducts;
    if (applicableCategories !== undefined) updateData.applicableCategories = applicableCategories;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isOneTime !== undefined) updateData.isOneTime = isOneTime;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);

    // Check if code is being changed and if new code already exists
    if (code) {
      const existingPromo = await PromoCode.findOne({
        code: code.toUpperCase(),
        _id: { $ne: req.params.id },
      });
      if (existingPromo) {
        return res.status(400).json({ message: 'Promo code already exists' });
      }
    }

    const promo = await PromoCode.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!promo) {
      return res.status(404).json({ message: 'Promo code not found' });
    }

    res.json(promo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePromoCode = async (req, res) => {
  try {
    const promo = await PromoCode.findByIdAndDelete(req.params.id);

    if (!promo) {
      return res.status(404).json({ message: 'Promo code not found' });
    }

    res.json({ message: 'Promo code deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const togglePromoStatus = async (req, res) => {
  try {
    const promo = await PromoCode.findById(req.params.id);

    if (!promo) {
      return res.status(404).json({ message: 'Promo code not found' });
    }

    promo.isActive = !promo.isActive;
    await promo.save();

    res.json(promo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getActivePromoCodes = async (req, res) => {
  try {
    const now = new Date();
    // Get current date in local time (YYYY-MM-DD)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch all active promos
    const allActive = await PromoCode.find({ isActive: true })
      .select('code description discountType discountValue minPurchase maxDiscount usageLimit startDate endDate');

    // Filter by comparing date-only (ignore time)
    const validPromos = allActive.filter((promo) => {
      const start = new Date(promo.startDate);
      const end = new Date(promo.endDate);
      // Set both to local date-only (midnight)
      const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      // Valid if today is between start and end (inclusive)
      return today >= startDateOnly && today <= endDateOnly;
    });

    res.json(validPromos);
  } catch (error) {
    console.error('Error fetching active promos:', error);
    res.status(500).json({ message: error.message });
  }
};

export {
  createPromoCode,
  deletePromoCode,
  getAllPromoCodes,
  getPromoCodeById,
  getActivePromoCodes,
  togglePromoStatus,
  updatePromoCode,
};
