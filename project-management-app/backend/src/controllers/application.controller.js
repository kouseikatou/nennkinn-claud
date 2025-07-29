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

  // Get single application
  async getApplication(req, res) {
    try {
      const { id } = req.params;

      const application = await Application.findByPk(id, {
        include: [
          { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'lastUpdater', attributes: ['id', 'name', 'email'] },
          { 
            model: Document, 
            include: [
              { model: User, as: 'uploader', attributes: ['id', 'name'] },
              { model: User, as: 'verifier', attributes: ['id', 'name'] }
            ]
          },
          {
            model: FamilyMember,
            as: 'familyMembers',
            order: [['memberType', 'ASC'], ['birthDate', 'ASC']]
          }
        ]
      });

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      // Check access permission
      if (req.user.role === 'viewer' || 
          (req.user.role === 'staff' && 
           application.assignedToId !== req.user.id && 
           application.createdById !== req.user.id)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({ application });
    } catch (error) {
      logger.error('Get application error:', error);
      res.status(500).json({ error: 'Failed to fetch application' });
    }
  },

  // Create new application
  async createApplication(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { familyMembers, ...applicationData } = req.body;
      
      // Generate application number if not provided
      if (!applicationData.applicationNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const count = await Application.count();
        applicationData.applicationNumber = `DP${year}${month}${String(count + 1).padStart(5, '0')}`;
      }
      
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

      // 空文字をnullに変換（バリデーションエラー回避）
      const cleanedData = { ...applicationData };
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === '') {
          cleanedData[key] = null;
        }
      });

      await application.update({
        ...cleanedData,
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
  }
};

module.exports = applicationController;