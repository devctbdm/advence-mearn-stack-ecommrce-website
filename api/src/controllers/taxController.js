import Tax from '../models/Tax.js';

export const getAllTaxes = async (req, res, next) => {
  try {
    const taxes = await Tax.find().sort({ sortOrder: 1, createdAt: -1 });
    res.json(taxes);
  } catch (error) {
    next(error);
  }
};

export const getActiveTaxes = async (req, res, next) => {
  try {
    const taxes = await Tax.find({ isActive: true }).sort({ sortOrder: 1 });
    res.json(taxes);
  } catch (error) {
    next(error);
  }
};

export const getTax = async (req, res, next) => {
  try {
    const tax = await Tax.findById(req.params.id);
    if (!tax) {
      return res.status(404).json({ message: 'Tax not found' });
    }
    res.json(tax);
  } catch (error) {
    next(error);
  }
};

export const createTax = async (req, res, next) => {
  try {
    const { name, rate, description, country, isActive, isDefault, sortOrder } = req.body;

    if (isDefault) {
      await Tax.updateMany({}, { isDefault: false });
    }

    const tax = await Tax.create({
      name,
      rate,
      description,
      country,
      isActive: isActive ?? true,
      isDefault: isDefault ?? false,
      sortOrder: sortOrder ?? 0,
    });

    res.status(201).json(tax);
  } catch (error) {
    next(error);
  }
};

export const updateTax = async (req, res, next) => {
  try {
    const { name, rate, description, country, isActive, isDefault, sortOrder } = req.body;

    const tax = await Tax.findById(req.params.id);
    if (!tax) {
      return res.status(404).json({ message: 'Tax not found' });
    }

    if (isDefault && !tax.isDefault) {
      await Tax.updateMany({ _id: { $ne: req.params.id } }, { isDefault: false });
    }

    tax.name = name ?? tax.name;
    tax.rate = rate ?? tax.rate;
    tax.description = description ?? tax.description;
    tax.country = country ?? tax.country;
    tax.isActive = isActive ?? tax.isActive;
    tax.isDefault = isDefault ?? tax.isDefault;
    tax.sortOrder = sortOrder ?? tax.sortOrder;

    await tax.save();

    res.json(tax);
  } catch (error) {
    next(error);
  }
};

export const deleteTax = async (req, res, next) => {
  try {
    const tax = await Tax.findByIdAndDelete(req.params.id);
    if (!tax) {
      return res.status(404).json({ message: 'Tax not found' });
    }
    res.json({ message: 'Tax deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getDefaultTax = async (req, res, next) => {
  try {
    let tax = await Tax.findOne({ isDefault: true, isActive: true });
    if (!tax) {
      tax = await Tax.findOne({ isActive: true }).sort({ sortOrder: 1 });
    }
    res.json(tax);
  } catch (error) {
    next(error);
  }
};