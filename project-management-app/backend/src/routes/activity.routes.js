const express = require('express');
const { query } = require('express-validator');
const activityController = require('../controllers/activity.controller');
const validate = require('../middleware/validate');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get all activities
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('applicationId').optional().isInt(),
    query('userId').optional().isInt(),
    query('activityType').optional().isIn([
      'created', 'updated', 'status_changed', 'document_uploaded',
      'document_verified', 'comment_added', 'assigned', 'reviewed',
      'approved', 'rejected'
    ]),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validate,
  activityController.getActivities
);

// Get activity statistics
router.get('/statistics',
  authorize('admin', 'staff'),
  activityController.getStatistics
);

// Get user activities
router.get('/user/:userId',
  authorize('admin', 'staff'),
  activityController.getUserActivities
);

// Get application activities
router.get('/application/:applicationId',
  activityController.getApplicationActivities
);

module.exports = router;