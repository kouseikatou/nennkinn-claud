const { Op } = require('sequelize');
const { User, Application, Activity, sequelize } = require('../models');
const logger = require('../utils/logger');
const { createActivity } = require('../utils/activityLogger');

const userController = {
  // Get all users
  async getUsers(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        role,
        isActive,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      if (role) where.role = role;
      if (isActive !== undefined) where.isActive = isActive === 'true';
      
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { department: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows: users } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] },
        limit: parseInt(limit),
        offset,
        order: [[sortBy, sortOrder]]
      });

      res.json({
        users,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  },

  // Get single user
  async getUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] },
        include: [
          {
            model: Application,
            as: 'assignedApplications',
            attributes: ['id', 'applicationNumber', 'status'],
            limit: 5,
            order: [['createdAt', 'DESC']]
          }
        ]
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      logger.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  },

  // Create new user
  async createUser(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { email, password, name, role, department, phoneNumber } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const user = await User.create({
        email,
        password,
        name,
        role,
        department,
        phoneNumber
      }, { transaction });

      // Log activity
      await createActivity({
        userId: req.user.id,
        activityType: 'created',
        description: `User ${user.name} created by admin`,
        metadata: { createdUserId: user.id },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }, transaction);

      await transaction.commit();

      res.status(201).json({
        message: 'User created successfully',
        user: user.toJSON()
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  },

  // Update user
  async updateUser(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const updates = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent updating own role
      if (id === req.user.id && updates.role) {
        return res.status(400).json({ error: 'Cannot update own role' });
      }

      // If updating email, check for duplicates
      if (updates.email && updates.email !== user.email) {
        const existingUser = await User.findOne({ where: { email: updates.email } });
        if (existingUser) {
          return res.status(400).json({ error: 'Email already in use' });
        }
      }

      await user.update(updates, { transaction });

      // Log activity
      await createActivity({
        userId: req.user.id,
        activityType: 'updated',
        description: `User ${user.name} updated`,
        metadata: { updatedUserId: user.id, changes: updates },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }, transaction);

      await transaction.commit();

      res.json({
        message: 'User updated successfully',
        user: user.toJSON()
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  },

  // Update own profile
  async updateProfile(req, res) {
    try {
      const { name, department, phoneNumber } = req.body;
      
      const user = await User.findByPk(req.user.id);
      
      await user.update({
        name,
        department,
        phoneNumber
      });

      res.json({
        message: 'Profile updated successfully',
        user: user.toJSON()
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  },

  // Delete user (soft delete)
  async deleteUser(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      if (id === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete own account' });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user has assigned applications
      const assignedCount = await Application.count({
        where: { 
          assignedToId: id,
          status: { [Op.notIn]: ['approved', 'rejected', 'withdrawn'] }
        }
      });

      if (assignedCount > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete user with active applications' 
        });
      }

      await user.update({ isActive: false }, { transaction });

      // Log activity
      await createActivity({
        userId: req.user.id,
        activityType: 'updated',
        description: `User ${user.name} deactivated`,
        metadata: { deactivatedUserId: user.id },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }, transaction);

      await transaction.commit();

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      await transaction.rollback();
      logger.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  },

  // Get user statistics
  async getUserStatistics(req, res) {
    try {
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { isActive: true } });
      
      const usersByRole = await User.findAll({
        attributes: [
          'role',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['role']
      });

      const applicationsByUser = await Application.findAll({
        attributes: [
          'assignedToId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          assignedToId: { [Op.ne]: null },
          status: { [Op.notIn]: ['approved', 'rejected', 'withdrawn'] }
        },
        include: [{
          model: User,
          as: 'assignee',
          attributes: ['name']
        }],
        group: ['assignedToId'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 10
      });

      res.json({
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        usersByRole,
        topAssignees: applicationsByUser
      });
    } catch (error) {
      logger.error('Get user statistics error:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
};

module.exports = userController;