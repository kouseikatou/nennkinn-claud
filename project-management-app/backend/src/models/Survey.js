const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Survey = sequelize.define('Survey', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  applicationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'applications',
      key: 'id'
    }
  },
  surveyType: {
    type: DataTypes.ENUM('basic', 'pre_application', 'injury'),
    allowNull: false
  },
  // 基本申請者情報
  basicInfo: {
    type: DataTypes.JSON,
    comment: '基本申請者情報のアンケート回答データ'
  },
  // 申請前アンケート
  preApplicationInfo: {
    type: DataTypes.JSON,
    comment: '申請前アンケートの回答データ'
  },
  // 傷病情報
  injuryInfo: {
    type: DataTypes.JSON,
    comment: '傷病情報アンケートの回答データ'
  },
  // 提出状況
  status: {
    type: DataTypes.ENUM('draft', 'completed', 'submitted'),
    defaultValue: 'draft'
  },
  completedAt: {
    type: DataTypes.DATE
  },
  submittedAt: {
    type: DataTypes.DATE
  },
  // メタデータ
  metadata: {
    type: DataTypes.JSON,
    comment: 'アンケートのメタデータ（進捗、検証エラー等）'
  }
}, {
  tableName: 'surveys',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['applicationId', 'surveyType']
    }
  ]
});

module.exports = Survey;