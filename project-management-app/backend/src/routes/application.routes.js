const express = require('express');
const { body, query } = require('express-validator');
const applicationController = require('../controllers/application.controller');
const validate = require('../middleware/validate');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get all applications with pagination and filters
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['draft', 'submitted', 'under_review', 'additional_docs_required', 'approved', 'rejected', 'withdrawn']),
    query('applicationType').optional().isIn(['new', 'renewal', 'grade_change', 'appeal']),
    query('assignedToId').optional().isInt(),
    query('search').optional().trim()
  ],
  validate,
  applicationController.getApplications
);

// Get application statistics
router.get('/statistics', applicationController.getStatistics);

// Get single application
router.get('/:id', applicationController.getApplication);

// Create new application
router.post('/',
  [
    body('applicantName').notEmpty().trim(),
    body('applicantNameKana').notEmpty().trim(),
    body('birthDate').isISO8601(),
    body('gender').isIn(['male', 'female', 'other']),
    body('phoneNumber').optional().isMobilePhone('ja-JP'),
    body('email').optional().isEmail(),
    body('address').optional().trim(),
    body('postalCode').optional().matches(/^\d{3}-?\d{4}$/),
    body('disabilityType').isIn(['physical', 'mental', 'intellectual', 'multiple']),
    body('disabilityGrade').optional().isInt({ min: 1, max: 7 }),
    body('applicationType').isIn(['new', 'renewal', 'grade_change', 'appeal'])
  ],
  validate,
  applicationController.createApplication
);

// Update application
router.put('/:id',
  applicationController.updateApplication
);

// Update application status
router.patch('/:id/status',
  [
    body('status').isIn(['draft', 'submitted', 'under_review', 'additional_docs_required', 'approved', 'rejected', 'withdrawn']),
    body('reason').optional().trim()
  ],
  validate,
  applicationController.updateStatus
);

// Assign application to user
router.patch('/:id/assign',
  authorize('admin', 'staff'),
  [
    body('userId').isInt()
  ],
  validate,
  applicationController.assignApplication
);

// Add comment to application
router.post('/:id/comments',
  [
    body('content').notEmpty().trim(),
    body('isInternal').optional().isBoolean()
  ],
  validate,
  applicationController.addComment
);

// Get application comments
router.get('/:id/comments', applicationController.getComments);

// Upload document for application
router.post('/:id/documents',
  applicationController.uploadDocument
);

// Get application documents
router.get('/:id/documents', applicationController.getDocuments);

// Verify document
router.patch('/:id/documents/:documentId/verify',
  authorize('admin', 'staff'),
  applicationController.verifyDocument
);

// Delete application (soft delete)
router.delete('/:id',
  authorize('admin'),
  applicationController.deleteApplication
);

// Export applications
router.get('/export/csv',
  authorize('admin', 'staff'),
  applicationController.exportApplications
);

module.exports = router;