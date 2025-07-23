const crypto = require('crypto');
const { User, Activity } = require('../models');
const { generateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const authController = {
  // Register new user
  async register(req, res) {
    try {
      const { email, password, name, role, department, phoneNumber } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Create new user
      const user = await User.create({
        email,
        password,
        name,
        role: role || 'staff',
        department,
        phoneNumber
      });

      // Generate token
      const token = generateToken(user);

      // Log activity
      await Activity.create({
        userId: user.id,
        activityType: 'created',
        description: 'User account created',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: user.toJSON(),
        token
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  },

  // Login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      // Generate token
      const token = generateToken(user);

      // Log activity
      await Activity.create({
        userId: user.id,
        activityType: 'created',
        description: 'User logged in',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      res.json({
        message: 'Login successful',
        user: user.toJSON(),
        token
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  },

  // Logout
  async logout(req, res) {
    try {
      // Log activity
      await Activity.create({
        userId: req.user.id,
        activityType: 'created',
        description: 'User logged out',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      res.json({ message: 'Logout successful' });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  },

  // Get current user
  async getMe(req, res) {
    res.json({ user: req.user.toJSON() });
  },

  // Refresh token
  async refreshToken(req, res) {
    try {
      const token = generateToken(req.user);
      res.json({ token });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(500).json({ error: 'Token refresh failed' });
    }
  },

  // Forgot password
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.json({ message: 'If the email exists, a reset link has been sent' });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
      await user.save();

      // TODO: Send email with reset link
      // For now, we'll just return the token (in production, never do this!)
      logger.info(`Password reset token for ${email}: ${resetToken}`);

      res.json({ 
        message: 'If the email exists, a reset link has been sent',
        ...(process.env.NODE_ENV === 'development' && { resetToken })
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({ error: 'Password reset request failed' });
    }
  },

  // Reset password
  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await User.findOne({
        where: {
          passwordResetToken: hashedToken,
          passwordResetExpires: { $gt: new Date() }
        }
      });

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }

      user.password = password;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({ error: 'Password reset failed' });
    }
  },

  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findByPk(req.user.id);
      
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      user.password = newPassword;
      await user.save();

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({ error: 'Password change failed' });
    }
  }
};

module.exports = authController;