const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FamilyMember = sequelize.define('FamilyMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Foreign key with strict constraint
  applicationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'applications',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  
  // Member type with strict validation
  memberType: {
    type: DataTypes.ENUM('spouse', 'child'),
    allowNull: false,
    validate: {
      notEmpty: true,
      isIn: [['spouse', 'child']]
    }
  },
  
  // Personal information with comprehensive validation
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100],
      is: /^[ぁ-んァ-ヶー一-龠々ー・\s]+$/
    }
  },
  
  nameKana: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100],
      is: /^[ァ-ヶー・\s]+$/
    }
  },
  
  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: true,
      isDate: true,
      isBefore: new Date().toISOString().split('T')[0], // Cannot be future date
      isAfter: '1900-01-01' // Reasonable minimum date
    }
  },
  
  // Identification numbers with strict format validation
  myNumber: {
    type: DataTypes.STRING(12),
    validate: {
      is: /^\d{12}$/,
      len: [12, 12]
    },
    comment: 'マイナンバー（12桁）'
  },
  
  basicPensionNumber: {
    type: DataTypes.STRING(10),
    validate: {
      is: /^\d{10}$/,
      len: [10, 10]
    },
    comment: '基礎年金番号（10桁、配偶者のみ）'
  },
  
  // Relationship details
  relationship: {
    type: DataTypes.STRING(50),
    validate: {
      len: [0, 50]
    }
  },
  
  // Child-specific information
  isStudent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  
  schoolName: {
    type: DataTypes.STRING(255),
    validate: {
      len: [0, 255]
    }
  },
  
  schoolYear: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 12
    }
  },
  
  graduationDate: {
    type: DataTypes.DATEONLY,
    validate: {
      isDate: true
    }
  },
  
  // Spouse-specific information
  occupation: {
    type: DataTypes.STRING(100),
    validate: {
      len: [0, 100]
    }
  },
  
  annualIncome: {
    type: DataTypes.DECIMAL(12, 2),
    validate: {
      min: 0,
      max: 9999999999.99
    }
  },
  
  hasDisability: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  
  disabilityDetails: {
    type: DataTypes.TEXT,
    validate: {
      len: [0, 1000]
    }
  },
  
  disabilityGrade: {
    type: DataTypes.ENUM('grade_1', 'grade_2', 'grade_3', 'grade_4', 'grade_5', 'grade_6', 'none'),
    defaultValue: 'none',
    allowNull: false
  },
  
  // Pension-related information
  hasPension: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  
  pensionType: {
    type: DataTypes.ENUM('national', 'employee', 'mutual_aid', 'disability', 'other', 'none'),
    defaultValue: 'none',
    allowNull: false
  },
  
  pensionAmount: {
    type: DataTypes.DECIMAL(10, 2),
    validate: {
      min: 0,
      max: 99999999.99
    }
  },
  
  // Living status
  livesTogetherWithApplicant: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  
  currentAddress: {
    type: DataTypes.TEXT,
    validate: {
      len: [0, 500]
    }
  },
  
  // Support information
  isDependent: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  
  supportAmount: {
    type: DataTypes.DECIMAL(10, 2),
    validate: {
      min: 0,
      max: 9999999.99
    }
  },
  
  // Data integrity
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'family_members',
  timestamps: true,
  paranoid: true, // Soft delete for data retention
  
  // Database-level constraints and indexes
  indexes: [
    {
      fields: ['applicationId']
    },
    {
      fields: ['memberType']
    },
    {
      fields: ['name']
    },
    {
      fields: ['birthDate']
    },
    {
      fields: ['isActive']
    },
    {
      unique: true,
      fields: ['applicationId', 'memberType', 'name', 'birthDate'],
      name: 'unique_family_member_per_application'
    },
    {
      fields: ['myNumber'],
      where: {
        myNumber: {
          [sequelize.Op.ne]: null
        }
      },
      name: 'family_member_my_number_index'
    }
  ],
  
  // Model hooks for business logic
  hooks: {
    beforeCreate: async (familyMember) => {
      // Validate age-related business rules
      const birthDate = new Date(familyMember.birthDate);
      const age = Math.floor((new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
      
      if (familyMember.memberType === 'child' && age >= 20) {
        // Child over 20 must be student or have disability
        if (!familyMember.isStudent && !familyMember.hasDisability) {
          throw new Error('20歳以上の子供は学生であるか障害を持っている必要があります');
        }
      }
      
      if (familyMember.memberType === 'child' && age < 0) {
        throw new Error('子供の年齢が無効です');
      }
      
      // Validate spouse-specific rules
      if (familyMember.memberType === 'spouse') {
        if (age < 18) {
          throw new Error('配偶者の年齢は18歳以上である必要があります');
        }
        if (!familyMember.basicPensionNumber) {
          console.warn('配偶者の基礎年金番号が入力されていません');
        }
      }
      
      // Validate child-specific rules
      if (familyMember.memberType === 'child') {
        if (familyMember.basicPensionNumber) {
          familyMember.basicPensionNumber = null; // Children don't have pension numbers
        }
        if (familyMember.isStudent && !familyMember.schoolName) {
          throw new Error('学生の場合は学校名の入力が必要です');
        }
      }
    },
    
    beforeUpdate: async (familyMember) => {
      // Update version for optimistic locking
      familyMember.version += 1;
      
      // Re-validate age-related rules
      const birthDate = new Date(familyMember.birthDate);
      const age = Math.floor((new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
      
      if (familyMember.memberType === 'child' && age >= 20) {
        if (!familyMember.isStudent && !familyMember.hasDisability) {
          throw new Error('20歳以上の子供は学生であるか障害を持っている必要があります');
        }
      }
    },
    
    beforeDestroy: async (familyMember) => {
      console.log(`Family member ${familyMember.name} marked for deletion`);
    }
  },
  
  // Model-level validations
  validate: {
    memberTypeConsistency() {
      if (this.memberType === 'spouse') {
        // Spouse validations
        if (this.isStudent) {
          throw new Error('配偶者に学生フラグは設定できません');
        }
        if (this.schoolName) {
          throw new Error('配偶者に学校名は設定できません');
        }
      }
      
      if (this.memberType === 'child') {
        // Child validations
        if (this.occupation) {
          throw new Error('子供に職業は設定できません');
        }
        if (this.annualIncome && this.annualIncome > 0) {
          throw new Error('子供に年収は設定できません');
        }
      }
    },
    
    financialConsistency() {
      if (this.supportAmount && this.annualIncome) {
        if (this.supportAmount > this.annualIncome) {
          throw new Error('支援額が年収を超えることはできません');
        }
      }
    },
    
    pensionConsistency() {
      if (this.hasPension && !this.pensionType) {
        throw new Error('年金ありの場合は年金種別の設定が必要です');
      }
      if (!this.hasPension && this.pensionAmount && this.pensionAmount > 0) {
        throw new Error('年金なしの場合は年金額を設定できません');
      }
    },
    
    disabilityConsistency() {
      if (this.hasDisability && this.disabilityGrade === 'none') {
        throw new Error('障害ありの場合は障害等級の設定が必要です');
      }
      if (!this.hasDisability && this.disabilityGrade !== 'none') {
        throw new Error('障害なしの場合は障害等級を設定できません');
      }
    }
  }
});

module.exports = FamilyMember;