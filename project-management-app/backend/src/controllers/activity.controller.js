const { Op } = require('sequelize');
const { Activity, User, Application, sequelize } = require('../models');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

const activityController = {
  // Get all activities with filters
  async getActivities(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        applicationId,
        userId,
        activityType,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Apply filters
      if (applicationId) where.applicationId = applicationId;
      if (userId) where.userId = userId;
      if (activityType) where.activityType = activityType;
      
      // Date range filter
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt[Op.gte] = moment(startDate).startOf('day').toDate();
        }
        if (endDate) {
          where.createdAt[Op.lte] = moment(endDate).endOf('day').toDate();
        }
      }

      // Apply role-based filtering
      if (req.user.role === 'viewer') {
        // Viewers can only see non-sensitive activities
        where.activityType = {
          [Op.notIn]: ['comment_added', 'document_verified']
        };
      }

      const { count, rows: activities } = await Activity.findAndCountAll({
        where,
        include: [
          { 
            model: User, 
            attributes: ['id', 'name', 'email', 'role'] 
          },
          { 
            model: Application,
            attributes: ['id', 'applicationNumber', 'applicantName']
          }
        ],
        limit: parseInt(limit),
        offset,
        order: [[sortBy, sortOrder]]
      });

      res.json({
        activities,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('Get activities error:', error);
      res.status(500).json({ error: 'Failed to fetch activities' });
    }
  },

  // Get user activities
  async getUserActivities(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      // Check if requesting user can view these activities
      if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const offset = (page - 1) * limit;

      const { count, rows: activities } = await Activity.findAndCountAll({
        where: { userId },
        include: [
          { 
            model: Application,
            attributes: ['id', 'applicationNumber', 'applicantName', 'status']
          }
        ],
        limit: parseInt(limit),
        offset,
        order: [['createdAt', 'DESC']]
      });

      res.json({
        activities,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('Get user activities error:', error);
      res.status(500).json({ error: 'Failed to fetch user activities' });
    }
  },

  // Get application activities
  async getApplicationActivities(req, res) {
    try {
      const { applicationId } = req.params;

      // First check if user has access to this application
      const application = await Application.findByPk(applicationId);
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

      const activities = await Activity.findAll({
        where: { applicationId },
        include: [
          { 
            model: User, 
            attributes: ['id', 'name', 'email', 'role'] 
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({ activities });
    } catch (error) {
      logger.error('Get application activities error:', error);
      res.status(500).json({ error: 'Failed to fetch application activities' });
    }
  },

  // Get activity statistics
  async getStatistics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) {
          dateFilter.createdAt[Op.gte] = moment(startDate).startOf('day').toDate();
        }
        if (endDate) {
          dateFilter.createdAt[Op.lte] = moment(endDate).endOf('day').toDate();
        }
      } else {
        // Default to last 30 days
        dateFilter.createdAt = {
          [Op.gte]: moment().subtract(30, 'days').startOf('day').toDate()
        };
      }

      // Activity count by type
      const activityByType = await Activity.findAll({
        where: dateFilter,
        attributes: [
          'activityType',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['activityType'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
      });

      // Daily activity count
      const dailyActivity = await Activity.findAll({
        where: dateFilter,
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
      });

      // Most active users
      const mostActiveUsers = await Activity.findAll({
        where: dateFilter,
        attributes: [
          'userId',
          [sequelize.fn('COUNT', sequelize.col('Activity.id')), 'activityCount']
        ],
        include: [
          {
            model: User,
            attributes: ['name', 'email', 'role']
          }
        ],
        group: ['userId'],
        order: [[sequelize.fn('COUNT', sequelize.col('Activity.id')), 'DESC']],
        limit: 10
      });

      // Recent activities summary
      const recentActivities = await Activity.findAll({
        where: dateFilter,
        include: [
          { 
            model: User, 
            attributes: ['name'] 
          },
          { 
            model: Application,
            attributes: ['applicationNumber']
          }
        ],
        limit: 10,
        order: [['createdAt', 'DESC']]
      });

      res.json({
        activityByType,
        dailyActivity,
        mostActiveUsers,
        recentActivities,
        dateRange: {
          start: dateFilter.createdAt[Op.gte],
          end: dateFilter.createdAt[Op.lte] || new Date()
        }
      });
    } catch (error) {
      logger.error('Get activity statistics error:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
};

module.exports = activityController;