const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  applicationId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'applications',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  activityType: {
    type: DataTypes.ENUM(
      'created',
      'updated',
      'status_changed',
      'document_uploaded',
      'document_verified',
      'comment_added',
      'assigned',
      'reviewed',
      'approved',
      'rejected'
    ),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON
  },
  ipAddress: {
    type: DataTypes.STRING(45)
  },
  userAgent: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'activities',
  timestamps: true,
  updatedAt: false
});

module.exports = Activity;