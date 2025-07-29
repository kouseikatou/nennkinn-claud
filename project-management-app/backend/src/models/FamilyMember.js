const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FamilyMember = sequelize.define('FamilyMember', {
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
    },
    onDelete: 'CASCADE'
  },
  memberType: {
    type: DataTypes.ENUM('spouse', 'child'),
    allowNull: false
  },
  // 氏名
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  // ふりがな
  nameKana: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  // 生年月日
  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  // マイナンバー
  myNumber: {
    type: DataTypes.STRING(12),
    allowNull: true,
    validate: {
      isValidMyNumber(value) {
        if (value && value.trim() && value.trim().length > 0 && value.trim().length !== 12) {
          throw new Error('マイナンバーは12桁である必要があります');
        }
      }
    }
  },
  // 基礎年金番号 (配偶者のみ)
  basicPensionNumber: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: {
      isValidPensionNumber(value) {
        if (value && value.trim() && value.trim().length > 0 && value.trim().length !== 10) {
          throw new Error('基礎年金番号は10桁である必要があります');
        }
      }
    }
  }
}, {
  tableName: 'family_members',
  timestamps: true
});

module.exports = FamilyMember;