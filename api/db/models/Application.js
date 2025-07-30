// 申請書モデル定義
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config');

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  applicationNumber: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  // 申請者情報
  applicantName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  applicantNameKana: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true
  },
  phoneNumber: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  postalCode: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  // 年金情報
  basicPensionNumber: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  disabilityGrade: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 3
    }
  },
  // ステータス情報
  status: {
    type: DataTypes.ENUM(
      'draft',
      'submitted',
      'under_review',
      'approved',
      'rejected',
      'additional_docs_required',
      'withdrawn'
    ),
    defaultValue: 'draft',
    allowNull: false
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // 日付情報
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // その他の情報（JSON形式で柔軟に保存）
  additionalData: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'applications',
  timestamps: true,
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['applicantName']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = Application;