import {
  generateAccessToken,
  generatePasswordResetToken,
  generateRefreshToken,
  generateVerificationToken,
  verifyRefreshToken,
} from '../lib/token.js';
import User from '../models/User.js';

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const verificationToken = generateVerificationToken();
    const user = await User.create({
      name,
      email,
      password,
      verificationToken,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        token: generateAccessToken(user.id),
        refreshToken: generateRefreshToken(user.id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      token: generateAccessToken(user.id),
      refreshToken: generateRefreshToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const logout = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    res.json({
      token: generateAccessToken(user.id),
      refreshToken: generateRefreshToken(user.id),
    });
  } catch (err) {
    res.status(401).json({ message: 'Invalid refresh token' + err.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = generatePasswordResetToken();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000);
    await user.save();

    res.json({ message: 'Password reset token sent', resetToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    const user = await User.findOne({
      passwordResetToken: resetToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { verificationToken } = req.body;

    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    user.verificationToken = generateVerificationToken();
    await user.save();

    res.json({ message: 'Verification email resent', verificationToken: user.verificationToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isCurrentPasswordValid = await user.matchPassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  changePassword,
  forgotPassword,
  getMe,
  loginUser,
  logout,
  refreshToken,
  registerUser,
  resendVerification,
  resetPassword,
  verifyEmail,
};
