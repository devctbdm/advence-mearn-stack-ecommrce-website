import ShippingMethod from '../models/ShippingMethod.js';

export const getShippingMethods = async (req, res, next) => {
  try {
    const methods = await ShippingMethod.find({ isActive: true }).sort({ sortOrder: 1, price: 1 });
    res.json(methods);
  } catch (error) {
    next(error);
  }
};

export const getShippingMethod = async (req, res, next) => {
  try {
    const method = await ShippingMethod.findById(req.params.id);
    if (!method) {
      return res.status(404).json({ message: 'Shipping method not found' });
    }
    res.json(method);
  } catch (error) {
    next(error);
  }
};

export const createShippingMethod = async (req, res, next) => {
  try {
    const method = new ShippingMethod(req.body);
    await method.save();
    res.status(201).json(method);
  } catch (error) {
    next(error);
  }
};

export const updateShippingMethod = async (req, res, next) => {
  try {
    const method = await ShippingMethod.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!method) {
      return res.status(404).json({ message: 'Shipping method not found' });
    }
    res.json(method);
  } catch (error) {
    next(error);
  }
};

export const deleteShippingMethod = async (req, res, next) => {
  try {
    const method = await ShippingMethod.findByIdAndDelete(req.params.id);
    if (!method) {
      return res.status(404).json({ message: 'Shipping method not found' });
    }
    res.json({ message: 'Shipping method deleted' });
  } catch (error) {
    next(error);
  }
};

export const getAllShippingMethodsAdmin = async (req, res, next) => {
  try {
    const methods = await ShippingMethod.find().sort({ sortOrder: 1, price: 1 });
    res.json(methods);
  } catch (error) {
    next(error);
  }
};

export const calculateShipping = async (req, res, next) => {
  try {
    const { subtotal, country } = req.query;
    const methods = await ShippingMethod.find({ isActive: true }).sort({ sortOrder: 1, price: 1 });

    const calculatedMethods = methods.map((method) => {
      let finalPrice = method.price;
      if (method.freeThreshold && subtotal >= method.freeThreshold) {
        finalPrice = 0;
      }
      return {
        _id: method._id,
        name: method.name,
        description: method.description,
        price: finalPrice,
        estimatedDays: method.estimatedDays,
        freeThreshold: method.freeThreshold,
      };
    });

    res.json(calculatedMethods);
  } catch (error) {
    next(error);
  }
};
