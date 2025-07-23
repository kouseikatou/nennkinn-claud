const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  applicationNumber: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  applicantName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  applicantNameKana: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: false
  },
  phoneNumber: {
    type: DataTypes.STRING(20)
  },
  email: {
    type: DataTypes.STRING(255),
    validate: {
      isEmail: true
    }
  },
  address: {
    type: DataTypes.TEXT
  },
  postalCode: {
    type: DataTypes.STRING(10)
  },
  // Disability Information
  disabilityType: {
    type: DataTypes.ENUM('physical', 'mental', 'intellectual', 'multiple'),
    allowNull: false
  },
  disabilityGrade: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 7
    }
  },
  disabilityDescription: {
    type: DataTypes.TEXT
  },
  onsetDate: {
    type: DataTypes.DATEONLY
  },
  // Application Details
  applicationType: {
    type: DataTypes.ENUM('new', 'renewal', 'grade_change', 'appeal'),
    allowNull: false,
    defaultValue: 'new'
  },
  status: {
    type: DataTypes.ENUM(
      'draft',
      'submitted',
      'under_review',
      'additional_docs_required',
      'approved',
      'rejected',
      'withdrawn'
    ),
    defaultValue: 'draft'
  },
  submittedAt: {
    type: DataTypes.DATE
  },
  reviewStartedAt: {
    type: DataTypes.DATE
  },
  decidedAt: {
    type: DataTypes.DATE
  },
  // Medical Information
  hospitalName: {
    type: DataTypes.STRING(255)
  },
  doctorName: {
    type: DataTypes.STRING(100)
  },
  diagnosisDate: {
    type: DataTypes.DATEONLY
  },
  // Financial Information
  monthlyIncome: {
    type: DataTypes.DECIMAL(10, 2)
  },
  hasOtherPension: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  otherPensionDetails: {
    type: DataTypes.TEXT
  },
  // Decision Information
  approvedGrade: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 3
    }
  },
  monthlyAmount: {
    type: DataTypes.DECIMAL(10, 2)
  },
  paymentStartDate: {
    type: DataTypes.DATEONLY
  },
  rejectionReason: {
    type: DataTypes.TEXT
  },
  notes: {
    type: DataTypes.TEXT
  },
  // Relationships
  assignedToId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  createdById: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  lastUpdatedById: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'applications',
  timestamps: true,
  hooks: {
    beforeCreate: async (application) => {
      // Generate application number
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const count = await Application.count({
        where: sequelize.where(
          sequelize.fn('YEAR', sequelize.col('createdAt')),
          year
        )
      });
      application.applicationNumber = `DP${year}${month}${String(count + 1).padStart(5, '0')}`;
    }
  }
});

module.exports = Application;