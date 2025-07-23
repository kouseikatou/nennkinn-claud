const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().trim(),
    body('role').optional().isIn(['admin', 'staff', 'viewer'])
  ],
  validate,
  authController.register
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  validate,
  authController.login
);

// Logout
router.post('/logout', auth, authController.logout);

// Get current user
router.get('/me', auth, authController.getMe);

// Refresh token
router.post('/refresh', auth, authController.refreshToken);

// Forgot password
router.post('/forgot-password',
  [
    body('email').isEmail().normalizeEmail()
  ],
  validate,
  authController.forgotPassword
);

// Reset password
router.post('/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 6 })
  ],
  validate,
  authController.resetPassword
);

// Change password
router.post('/change-password',
  auth,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
  ],
  validate,
  authController.changePassword
);

module.exports = router;