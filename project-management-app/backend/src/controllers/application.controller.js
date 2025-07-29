const { Op } = require('sequelize');
const { 
  Application, 
  User, 
  Document, 
  Activity, 
  Comment,
  FamilyMember,
  sequelize 
} = require('../models');
const logger = require('../utils/logger');
const { uploadFile } = require('../utils/fileUpload');
const { createActivity } = require('../utils/activityLogger');

const applicationController = {
  // Get all applications with pagination and filters
  async getApplications(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        applicationType,
        assignedToId,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Apply filters
      if (status) where.status = status;
      if (applicationType) where.applicationType = applicationType;
      if (assignedToId) where.assignedToId = assignedToId;
      
      // Search by name or application number
      if (search) {
        where[Op.or] = [
          { applicantName: { [Op.like]: `%${search}%` } },
          { applicantNameKana: { [Op.like]: `%${search}%` } },
          { applicationNumber: { [Op.like]: `%${search}%` } }
        ];
      }

      // Apply role-based filtering
      if (req.user.role === 'staff') {
        where[Op.or] = [
          { assignedToId: req.user.id },
          { createdById: req.user.id }
        ];
      }

      const { count, rows: applications } = await Application.findAndCountAll({
        where,
        include: [
          { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
        ],
        limit: parseInt(limit),
        offset,
        order: [[sortBy, sortOrder]]
      });

      res.json({
        applications,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('Get applications error:', error);
      res.status(500).json({ error: 'Failed to fetch applications' });
    }
  },

  // Get single application with comprehensive data for project-unified.html
  async getApplication(req, res) {
    try {
      const { id } = req.params;
      const { format } = req.query; // Support different response formats

      const application = await Application.findByPk(id, {
        include: [
          { 
            model: User, 
            as: 'assignee', 
            attributes: ['id', 'firstName', 'lastName', 'email'] 
          },
          { 
            model: User, 
            as: 'creator', 
            attributes: ['id', 'firstName', 'lastName', 'email'] 
          },
          { 
            model: User, 
            as: 'lastUpdater', 
            attributes: ['id', 'firstName', 'lastName', 'email'] 
          },
          { 
            model: Document, 
            include: [
              { model: User, as: 'uploader', attributes: ['id', 'firstName', 'lastName'] },
              { model: User, as: 'verifier', attributes: ['id', 'firstName', 'lastName'] }
            ],
            order: [['createdAt', 'DESC']]
          },
          {
            model: FamilyMember,
            as: 'familyMembers',
            where: { isActive: true },
            required: false,
            order: [['memberType', 'ASC'], ['birthDate', 'ASC']]
          },
          {
            model: Activity,
            include: [
              { model: User, attributes: ['id', 'firstName', 'lastName'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: 10
          },
          {
            model: Comment,
            include: [
              { model: User, attributes: ['id', 'firstName', 'lastName'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: 5
          }
        ]
      });

      if (!application) {
        return res.status(404).json({ 
          error: 'Application not found',
          redirectUrl: '/projects.html' // Fallback redirect
        });
      }

      // Check access permission
      if (req.user && req.user.role === 'viewer' || 
          (req.user && req.user.role === 'staff' && 
           application.assignedToId !== req.user.id && 
           application.createdById !== req.user.id)) {
        return res.status(403).json({ 
          error: 'Access denied',
          redirectUrl: '/projects.html'
        });
      }

      // Calculate additional computed fields for UI
      const enrichedApplication = {
        ...application.toJSON(),
        
        // Calculate age
        age: application.birthDate ? 
          Math.floor((new Date() - new Date(application.birthDate)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
        
        // Generate status badge info for UI
        statusBadge: getStatusBadgeInfo(application.status, application.progressStatus),
        
        // Generate edit/view URLs for frontend
        urls: {
          edit: `/project-unified.html?edit=${application.id}`,
          view: `/project-unified.html?view=${application.id}`,
          list: '/projects.html'
        },
        
        // Progress indicators
        progressInfo: calculateProgressInfo(application),
        
        // Financial summary
        financialSummary: calculateFinancialSummary(application),
        
        // Family summary
        familySummary: calculateFamilySummary(application.familyMembers),
        
        // Next action recommendations
        nextActions: getNextActionRecommendations(application)
      };

      // Format response based on requested format
      if (format === 'minimal') {
        res.json({
          application: {
            id: application.id,
            applicationNumber: application.applicationNumber,
            applicantName: application.applicantName,
            status: application.status,
            progressStatus: application.progressStatus,
            urls: enrichedApplication.urls
          }
        });
      } else {
        res.json({ 
          application: enrichedApplication,
          meta: {
            lastModified: application.updatedAt,
            version: application.version,
            canEdit: canUserEdit(req.user, application),
            canDelete: canUserDelete(req.user, application)
          }
        });
      }
    } catch (error) {
      logger.error('Get application error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch application',
        redirectUrl: '/projects.html'
      });
    }
  },

  // Create new application
  async createApplication(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { familyMembers, ...applicationData } = req.body;
      
      const application = await Application.create({
        ...applicationData,
        createdById: req.user.id,
        lastUpdatedById: req.user.id
      }, { transaction });

      // Create family members if provided
      if (familyMembers && Array.isArray(familyMembers)) {
        for (const member of familyMembers) {
          await FamilyMember.create({
            ...member,
            applicationId: application.id
          }, { transaction });
        }
      }

      // Create activity log
      await createActivity({
        applicationId: application.id,
        userId: req.user.id,
        activityType: 'created',
        description: `Application ${application.applicationNumber} created`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }, transaction);

      await transaction.commit();

      const createdApplication = await Application.findByPk(application.id, {
        include: [
          { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
          { model: FamilyMember, as: 'familyMembers' }
        ]
      });

      res.status(201).json({
        message: 'Application created successfully',
        application: createdApplication
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Create application error:', error);
      res.status(500).json({ error: 'Failed to create application' });
    }
  },

  // Update application
  async updateApplication(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { familyMembers, ...applicationData } = req.body;
      
      const application = await Application.findByPk(id);
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      // Check permission
      if (req.user.role === 'viewer' || 
          (req.user.role === 'staff' && 
           application.assignedToId !== req.user.id && 
           application.createdById !== req.user.id)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Track changes for activity log
      const changes = {};
      Object.keys(applicationData).forEach(key => {
        if (application[key] !== applicationData[key]) {
          changes[key] = {
            from: application[key],
            to: applicationData[key]
          };
        }
      });

      await application.update({
        ...applicationData,
        lastUpdatedById: req.user.id
      }, { transaction });

      // Update family members if provided
      if (familyMembers !== undefined) {
        // Delete existing family members
        await FamilyMember.destroy({
          where: { applicationId: id },
          transaction
        });

        // Create new family members
        if (Array.isArray(familyMembers)) {
          for (const member of familyMembers) {
            await FamilyMember.create({
              ...member,
              applicationId: id
            }, { transaction });
          }
        }
      }

      // Create activity log
      await createActivity({
        applicationId: application.id,
        userId: req.user.id,
        activityType: 'updated',
        description: `Application updated`,
        metadata: { changes },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }, transaction);

      await transaction.commit();

      const updatedApplication = await Application.findByPk(id, {
        include: [
          { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'lastUpdater', attributes: ['id', 'name', 'email'] },
          { model: FamilyMember, as: 'familyMembers' }
        ]
      });

      res.json({
        message: 'Application updated successfully',
        application: updatedApplication
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Update application error:', error);
      res.status(500).json({ error: 'Failed to update application' });
    }
  },

  // Update application status
  async updateStatus(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      const application = await Application.findByPk(id);
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const oldStatus = application.status;
      
      // Update status and related fields
      const updateData = {
        status,
        lastUpdatedById: req.user.id
      };

      if (status === 'submitted' && !application.submittedAt) {
        updateData.submittedAt = new Date();
      }
      if (status === 'under_review' && !application.reviewStartedAt) {
        updateData.reviewStartedAt = new Date();
      }
      if ((status === 'approved' || status === 'rejected') && !application.decidedAt) {
        updateData.decidedAt = new Date();
      }
      if (status === 'rejected' && reason) {
        updateData.rejectionReason = reason;
      }

      await application.update(updateData, { transaction });

      // Create activity log
      await createActivity({
        applicationId: application.id,
        userId: req.user.id,
        activityType: 'status_changed',
        description: `Status changed from ${oldStatus} to ${status}`,
        metadata: { oldStatus, newStatus: status, reason },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }, transaction);

      await transaction.commit();

      res.json({
        message: 'Status updated successfully',
        application
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Update status error:', error);
      res.status(500).json({ error: 'Failed to update status' });
    }
  },

  // Assign application to user
  async assignApplication(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { userId } = req.body;

      const application = await Application.findByPk(id);
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const assignee = await User.findByPk(userId);
      if (!assignee || !assignee.isActive) {
        return res.status(400).json({ error: 'Invalid assignee' });
      }

      const oldAssigneeId = application.assignedToId;
      
      await application.update({
        assignedToId: userId,
        lastUpdatedById: req.user.id
      }, { transaction });

      // Create activity log
      await createActivity({
        applicationId: application.id,
        userId: req.user.id,
        activityType: 'assigned',
        description: `Application assigned to ${assignee.name}`,
        metadata: { oldAssigneeId, newAssigneeId: userId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }, transaction);

      await transaction.commit();

      res.json({
        message: 'Application assigned successfully',
        application
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Assign application error:', error);
      res.status(500).json({ error: 'Failed to assign application' });
    }
  },

  // Add comment to application
  async addComment(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { content, isInternal = true, parentId } = req.body;

      const application = await Application.findByPk(id);
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const comment = await Comment.create({
        applicationId: id,
        userId: req.user.id,
        content,
        isInternal,
        parentId
      }, { transaction });

      // Create activity log
      await createActivity({
        applicationId: id,
        userId: req.user.id,
        activityType: 'comment_added',
        description: 'Comment added',
        metadata: { commentId: comment.id, isInternal },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }, transaction);

      await transaction.commit();

      const createdComment = await Comment.findByPk(comment.id, {
        include: [
          { model: User, attributes: ['id', 'name', 'email'] }
        ]
      });

      res.status(201).json({
        message: 'Comment added successfully',
        comment: createdComment
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Add comment error:', error);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  },

  // Get application comments
  async getComments(req, res) {
    try {
      const { id } = req.params;
      const { includeInternal = true } = req.query;

      const where = { applicationId: id };
      
      // Non-admin users can't see internal comments
      if (req.user.role === 'viewer' || includeInternal === 'false') {
        where.isInternal = false;
      }

      const comments = await Comment.findAll({
        where,
        include: [
          { model: User, attributes: ['id', 'name', 'email'] },
          { 
            model: Comment, 
            as: 'replies',
            include: [
              { model: User, attributes: ['id', 'name', 'email'] }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({ comments });
    } catch (error) {
      logger.error('Get comments error:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  },

  // Upload document
  async uploadDocument(req, res) {
    // This would be implemented with multer middleware
    // For now, we'll create a placeholder
    res.status(501).json({ error: 'File upload not implemented yet' });
  },

  // Get documents
  async getDocuments(req, res) {
    try {
      const { id } = req.params;

      const documents = await Document.findAll({
        where: { applicationId: id },
        include: [
          { model: User, as: 'uploader', attributes: ['id', 'name'] },
          { model: User, as: 'verifier', attributes: ['id', 'name'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({ documents });
    } catch (error) {
      logger.error('Get documents error:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  },

  // Verify document
  async verifyDocument(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id, documentId } = req.params;
      const { notes } = req.body;

      const document = await Document.findOne({
        where: { id: documentId, applicationId: id }
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      await document.update({
        isVerified: true,
        verifiedAt: new Date(),
        verifiedById: req.user.id,
        notes
      }, { transaction });

      // Create activity log
      await createActivity({
        applicationId: id,
        userId: req.user.id,
        activityType: 'document_verified',
        description: `Document ${document.documentType} verified`,
        metadata: { documentId: document.id },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }, transaction);

      await transaction.commit();

      res.json({
        message: 'Document verified successfully',
        document
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Verify document error:', error);
      res.status(500).json({ error: 'Failed to verify document' });
    }
  },

  // Delete application
  async deleteApplication(req, res) {
    try {
      const { id } = req.params;

      const application = await Application.findByPk(id);
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      // Soft delete by updating status
      await application.update({ 
        status: 'withdrawn',
        lastUpdatedById: req.user.id 
      });

      res.json({ message: 'Application deleted successfully' });
    } catch (error) {
      logger.error('Delete application error:', error);
      res.status(500).json({ error: 'Failed to delete application' });
    }
  },

  // Get statistics
  async getStatistics(req, res) {
    try {
      const stats = await Application.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      const monthlyStats = await Application.findAll({
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: {
            [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 12))
          }
        },
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m')],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'ASC']]
      });

      res.json({
        statusStats: stats,
        monthlyStats
      });
    } catch (error) {
      logger.error('Get statistics error:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  },

  // Export applications
  async exportApplications(req, res) {
    // This would generate a CSV file
    // For now, we'll create a placeholder
    res.status(501).json({ error: 'Export not implemented yet' });
  },

  // Get application by application number for direct URL access
  async getApplicationByNumber(req, res) {
    try {
      const { applicationNumber } = req.params;

      const application = await Application.findOne({
        where: { applicationNumber },
        attributes: ['id', 'applicationNumber', 'applicantName', 'status']
      });

      if (!application) {
        return res.status(404).json({ 
          error: 'Application not found',
          redirectUrl: '/projects.html'
        });
      }

      // Redirect to the proper URL with ID
      res.json({
        redirect: true,
        urls: {
          edit: `/project-unified.html?edit=${application.id}`,
          view: `/project-unified.html?view=${application.id}`
        },
        application: {
          id: application.id,
          applicationNumber: application.applicationNumber,
          applicantName: application.applicantName,
          status: application.status
        }
      });
    } catch (error) {
      logger.error('Get application by number error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch application',
        redirectUrl: '/projects.html'
      });
    }
  },

  // Quick status update for project-unified.html interface
  async quickUpdate(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { field, value, version } = req.body;

      const application = await Application.findByPk(id);
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      // Check optimistic locking
      if (version && application.version !== version) {
        return res.status(409).json({ 
          error: 'Data has been modified by another user. Please reload.',
          currentVersion: application.version
        });
      }

      // Validate field update permission
      const allowedFields = [
        'progressStatus', 'progressSubStatus', 'daysAfterApplication',
        'certificateReceived', 'invoiceIssued', 'paymentVerified',
        'nextRenewalDate', 'renewalNotPossible',
        'disabilityHandbookApplicationDesired', 'employmentSupportDesired',
        'expectedRevenue', 'remainingInstallment', 'serviceFee'
      ];

      if (!allowedFields.includes(field)) {
        return res.status(400).json({ error: 'Field update not allowed' });
      }

      const updateData = {
        [field]: value,
        lastUpdatedById: req.user.id
      };

      await application.update(updateData, { transaction });

      // Create activity log
      await createActivity({
        applicationId: application.id,
        userId: req.user.id,
        activityType: 'updated',
        description: `Quick update: ${field} changed to ${value}`,
        metadata: { field, oldValue: application[field], newValue: value },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }, transaction);

      await transaction.commit();

      res.json({
        message: 'Updated successfully',
        field,
        value,
        version: application.version + 1,
        updatedAt: new Date()
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Quick update error:', error);
      res.status(500).json({ error: 'Failed to update application' });
    }
  }
};

// Helper functions for enhanced application data
function getStatusBadgeInfo(status, progressStatus) {
  const statusConfig = {
    'draft': { color: 'gray', label: '下書き', icon: 'edit' },
    'submitted': { color: 'blue', label: '提出済み', icon: 'send' },
    'under_review': { color: 'yellow', label: '審査中', icon: 'clock' },
    'additional_docs_required': { color: 'orange', label: '追加書類必要', icon: 'file-plus' },
    'approved': { color: 'green', label: '承認済み', icon: 'check-circle' },
    'rejected': { color: 'red', label: '却下', icon: 'x-circle' },
    'withdrawn': { color: 'gray', label: '取下げ', icon: 'minus-circle' }
  };

  const progressConfig = {
    'initial_consultation': '初回相談',
    'document_preparation': '書類準備中',
    'medical_certificate': '診断書取得中',
    'before_submission': '提出前',
    'submitted': '提出済み',
    'under_review': '審査中',
    'decision_notification': '決定通知',
    'payment_received': '入金済み',
    'completed': '完了'
  };

  return {
    status: statusConfig[status] || statusConfig['draft'],
    progress: progressConfig[progressStatus] || progressStatus,
    combinedLabel: `${statusConfig[status]?.label || status} - ${progressConfig[progressStatus] || progressStatus}`
  };
}

function calculateProgressInfo(application) {
  const totalSteps = 9; // Based on progressStatus enum
  const stepOrder = [
    'initial_consultation', 'document_preparation', 'medical_certificate',
    'before_submission', 'submitted', 'under_review',
    'decision_notification', 'payment_received', 'completed'
  ];
  
  const currentStep = stepOrder.indexOf(application.progressStatus) + 1;
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  return {
    currentStep,
    totalSteps,
    progressPercentage,
    stepName: application.progressStatus,
    isCompleted: application.progressStatus === 'completed',
    daysInProgress: application.daysAfterApplication || 0
  };
}

function calculateFinancialSummary(application) {
  const expectedRevenue = parseFloat(application.expectedRevenue) || 0;
  const remainingInstallment = parseFloat(application.remainingInstallment) || 0;
  const serviceFee = parseFloat(application.serviceFee) || 0;
  const monthlyAmount = parseFloat(application.monthlyAmount) || 0;

  return {
    expectedRevenue,
    remainingInstallment,
    serviceFee,
    monthlyAmount,
    paidAmount: expectedRevenue - remainingInstallment,
    paymentProgress: expectedRevenue > 0 ? Math.round(((expectedRevenue - remainingInstallment) / expectedRevenue) * 100) : 0,
    hasFinancialData: expectedRevenue > 0 || serviceFee > 0 || monthlyAmount > 0
  };
}

function calculateFamilySummary(familyMembers) {
  if (!familyMembers || !Array.isArray(familyMembers)) {
    return { hasFamily: false, summary: '家族情報なし' };
  }

  const spouse = familyMembers.find(m => m.memberType === 'spouse' && m.isActive);
  const children = familyMembers.filter(m => m.memberType === 'child' && m.isActive);

  let summary = '';
  if (spouse) {
    summary += `配偶者: ${spouse.name}`;
  }
  if (children.length > 0) {
    if (summary) summary += ', ';
    summary += `子供: ${children.length}名`;
  }
  if (!summary) {
    summary = '家族情報なし';
  }

  return {
    hasFamily: familyMembers.length > 0,
    summary,
    spouseCount: spouse ? 1 : 0,
    childrenCount: children.length,
    totalMembers: familyMembers.length
  };
}

function getNextActionRecommendations(application) {
  const actions = [];

  // Based on status and progress
  switch (application.progressStatus) {
    case 'initial_consultation':
      actions.push({
        action: 'schedule_document_review',
        label: '書類確認のスケジュール設定',
        priority: 'high',
        url: `/project-unified.html?edit=${application.id}#documents`
      });
      break;
    
    case 'document_preparation':
      actions.push({
        action: 'check_required_documents',
        label: '必要書類の確認',
        priority: 'high',
        url: `/project-unified.html?edit=${application.id}#documents`
      });
      break;
    
    case 'medical_certificate':
      actions.push({
        action: 'follow_up_medical',
        label: '医療機関への確認',
        priority: 'medium',
        url: `/project-unified.html?edit=${application.id}#medical`
      });
      break;
    
    case 'submitted':
      if (!application.certificateReceived) {
        actions.push({
          action: 'check_certificate',
          label: '証書の受領確認',
          priority: 'medium',
          url: `/project-unified.html?edit=${application.id}#status`
        });
      }
      break;
  }

  // Financial actions
  if (!application.invoiceIssued && application.status === 'approved') {
    actions.push({
      action: 'issue_invoice',
      label: '請求書発行',
      priority: 'high',
      url: `/project-unified.html?edit=${application.id}#financial`
    });
  }

  if (application.invoiceIssued && !application.paymentVerified) {
    actions.push({
      action: 'verify_payment',
      label: '入金確認',
      priority: 'high',
      url: `/project-unified.html?edit=${application.id}#financial`
    });
  }

  // Renewal actions
  if (application.nextRenewalDate) {
    const renewalDate = new Date(application.nextRenewalDate);
    const today = new Date();
    const daysToRenewal = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysToRenewal <= 90 && daysToRenewal > 0) {
      actions.push({
        action: 'prepare_renewal',
        label: `更新準備 (${daysToRenewal}日後)`,
        priority: daysToRenewal <= 30 ? 'high' : 'medium',
        url: `/project-unified.html?edit=${application.id}#renewal`
      });
    }
  }

  return actions.slice(0, 3); // Limit to top 3 actions
}

function canUserEdit(user, application) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'viewer') return false;
  
  return application.assignedToId === user.id || application.createdById === user.id;
}

function canUserDelete(user, application) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'viewer' || user.role === 'staff') return false;
  
  return application.createdById === user.id && application.status === 'draft';
}

module.exports = applicationController;