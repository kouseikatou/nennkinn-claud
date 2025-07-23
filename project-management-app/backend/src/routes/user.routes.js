const express = require('express');
const { body, query } = require('express-validator');
const userController = require('../controllers/user.controller');
const validate = require('../middleware/validate');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get all users (admin only)
router.get('/',
  authorize('admin'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isIn(['admin', 'staff', 'viewer']),
    query('isActive').optional().isBoolean(),
    query('search').optional().trim()
  ],
  validate,
  userController.getUsers
);

// Get user by ID
router.get('/:id',
  authorize('admin', 'staff'),
  userController.getUser
);

// Create new user (admin only)
router.post('/',
  authorize('admin'),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty().trim(),
    body('role').isIn(['admin', 'staff', 'viewer']),
    body('department').optional().trim(),
    body('phoneNumber').optional().isMobilePhone('ja-JP')
  ],
  validate,
  userController.createUser
);

// Update user
router.put('/:id',
  authorize('admin'),
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('name').optional().notEmpty().trim(),
    body('role').optional().isIn(['admin', 'staff', 'viewer']),
    body('department').optional().trim(),
    body('phoneNumber').optional().isMobilePhone('ja-JP'),
    body('isActive').optional().isBoolean()
  ],
  validate,
  userController.updateUser
);

// Update user profile (self)
router.put('/profile/me',
  [
    body('name').optional().notEmpty().trim(),
    body('department').optional().trim(),
    body('phoneNumber').optional().isMobilePhone('ja-JP')
  ],
  validate,
  userController.updateProfile
);

// Delete user (admin only)
router.delete('/:id',
  authorize('admin'),
  userController.deleteUser
);

// Get user statistics (admin only)
router.get('/statistics/overview',
  authorize('admin'),
  userController.getUserStatistics
);

module.exports = router;