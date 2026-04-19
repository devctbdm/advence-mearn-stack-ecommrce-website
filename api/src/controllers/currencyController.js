import Currency from '../models/Currency.js';

// @desc    Get all currencies (admin)
// @route   GET /api/currencies
// @access  Admin
const getCurrencies = async (req, res) => {
  try {
    const currencies = await Currency.find({}).sort({ code: 1 });
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get active currencies (public)
// @route   GET /api/currencies/active
// @access  Public
const getActiveCurrencies = async (req, res) => {
  try {
    const currencies = await Currency.find({ isActive: true }).sort({ code: 1 });
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single currency
// @route   GET /api/currencies/:id
// @access  Admin
const getCurrencyById = async (req, res) => {
  try {
    const currency = await Currency.findById(req.params.id);
    if (!currency) {
      return res.status(404).json({ message: 'Currency not found' });
    }
    res.json(currency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create currency
// @route   POST /api/currencies
// @access  Admin
const createCurrency = async (req, res) => {
  try {
    const { code, name, symbol, exchangeRateToUSD, isDefault, isActive } = req.body;

    if (!code || !name || !symbol || exchangeRateToUSD === undefined) {
      return res
        .status(400)
        .json({ message: 'Please provide code, name, symbol, and exchangeRateToUSD' });
    }

    const existing = await Currency.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'Currency code already exists' });
    }

    const currency = await Currency.create({
      code: code.toUpperCase(),
      name,
      symbol,
      exchangeRateToUSD: Number(exchangeRateToUSD),
      isDefault: Boolean(isDefault),
      isActive: Boolean(isActive),
    });

    res.status(201).json(currency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update currency
// @route   PUT /api/currencies/:id
// @access  Admin
const updateCurrency = async (req, res) => {
  try {
    const { code, name, symbol, exchangeRateToUSD, isDefault, isActive } = req.body;

    const currency = await Currency.findById(req.params.id);
    if (!currency) {
      return res.status(404).json({ message: 'Currency not found' });
    }

    if (code && code.toUpperCase() !== currency.code) {
      const existing = await Currency.findOne({ code: code.toUpperCase() });
      if (existing) {
        return res.status(400).json({ message: 'Currency code already exists' });
      }
      currency.code = code.toUpperCase();
    }

    if (name !== undefined) currency.name = name;
    if (symbol !== undefined) currency.symbol = symbol;
    if (exchangeRateToUSD !== undefined) currency.exchangeRateToUSD = Number(exchangeRateToUSD);
    if (isDefault !== undefined) currency.isDefault = Boolean(isDefault);
    if (isActive !== undefined) currency.isActive = Boolean(isActive);

    await currency.save();
    res.json(currency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete currency
// @route   DELETE /api/currencies/:id
// @access  Admin
const deleteCurrency = async (req, res) => {
  try {
    const currency = await Currency.findById(req.params.id);
    if (!currency) {
      return res.status(404).json({ message: 'Currency not found' });
    }

    if (currency.isDefault) {
      return res.status(400).json({ message: 'Cannot delete default currency' });
    }

    await currency.deleteOne();
    res.json({ message: 'Currency deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle currency active status
// @route   PUT /api/currencies/:id/toggle
// @access  Admin
const toggleCurrency = async (req, res) => {
  try {
    const currency = await Currency.findById(req.params.id);
    if (!currency) {
      return res.status(404).json({ message: 'Currency not found' });
    }

    currency.isActive = !currency.isActive;
    await currency.save();
    res.json(currency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get default currency
// @route   GET /api/currencies/default
// @access  Public
const getDefaultCurrency = async (req, res) => {
  try {
    const currency = await Currency.findOne({ isDefault: true });
    // Return null instead of 404 to avoid frontend errors on public pages
    res.json(currency || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  createCurrency,
  deleteCurrency,
  getActiveCurrencies,
  getCurrencies,
  getCurrencyById,
  getDefaultCurrency,
  toggleCurrency,
  updateCurrency,
};
