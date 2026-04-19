import User from '../models/User.js';
import Currency from '../models/Currency.js';

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCurrencies = async (req, res) => {
  try {
    const currencies = await Currency.find({ isActive: true }).sort({ code: 1 });
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, address, preferredCurrency } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address) updateData.address = address;
    if (preferredCurrency) updateData.preferredCurrency = preferredCurrency;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { deleteUser, getAllUsers, getUserById, getCurrencies, updateProfile, updateUser };
