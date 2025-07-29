const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const crypto = require('crypto');

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Unique business identifier
  applicationNumber: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 50]
    }
  },
  
  // Basic applicant information with strict validation
  applicantName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100],
      is: /^[ぁ-んァ-ヶー一-龠々ー・\s]+$/
    }
  },
  
  applicantNameKana: {
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
  
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: false,
    validate: {
      notEmpty: true,
      isIn: [['male', 'female', 'other']]
    }
  },
  
  // Contact information with validation
  phoneNumber: {
    type: DataTypes.STRING(20),
    validate: {
      is: /^[\d\-\(\)\+\s]+$/,
      len: [10, 20]
    }
  },
  
  email: {
    type: DataTypes.STRING(255),
    validate: {
      isEmail: true,
      len: [5, 255]
    }
  },
  
  address: {
    type: DataTypes.TEXT,
    validate: {
      len: [0, 500]
    }
  },
  
  postalCode: {
    type: DataTypes.STRING(10),
    validate: {
      is: /^\d{3}-?\d{4}$/
    }
  },
  
  // Disability Information with comprehensive validation
  disabilityType: {
    type: DataTypes.ENUM('physical', 'mental', 'intellectual', 'multiple'),
    allowNull: false,
    validate: {
      notEmpty: true,
      isIn: [['physical', 'mental', 'intellectual', 'multiple']]
    }
  },
  
  disabilityGrade: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 7
    }
  },
  
  disabilityDescription: {
    type: DataTypes.TEXT,
    validate: {
      len: [0, 2000]
    }
  },
  
  onsetDate: {
    type: DataTypes.DATEONLY,
    validate: {
      isDate: true,
      isBefore: new Date().toISOString().split('T')[0]
    }
  },
  
  // Application Details with business logic validation
  applicationType: {
    type: DataTypes.ENUM('new', 'renewal', 'grade_change', 'appeal'),
    allowNull: false,
    defaultValue: 'new',
    validate: {
      notEmpty: true,
      isIn: [['new', 'renewal', 'grade_change', 'appeal']]
    }
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
    defaultValue: 'draft',
    allowNull: false,
    validate: {
      notEmpty: true,
      isIn: [['draft', 'submitted', 'under_review', 'additional_docs_required', 'approved', 'rejected', 'withdrawn']]
    }
  },
  
  // Timestamps with automatic calculation
  submittedAt: {
    type: DataTypes.DATE,
    validate: {
      isDate: true
    }
  },
  
  reviewStartedAt: {
    type: DataTypes.DATE,
    validate: {
      isDate: true
    }
  },
  
  decidedAt: {
    type: DataTypes.DATE,
    validate: {
      isDate: true
    }
  },
  
  // Medical Information with validation
  hospitalName: {
    type: DataTypes.STRING(255),
    validate: {
      len: [0, 255]
    }
  },
  
  doctorName: {
    type: DataTypes.STRING(100),
    validate: {
      len: [0, 100]
    }
  },
  
  diagnosisDate: {
    type: DataTypes.DATEONLY,
    validate: {
      isDate: true,
      isBefore: new Date().toISOString().split('T')[0]
    }
  },
  
  // Financial Information with decimal precision
  monthlyIncome: {
    type: DataTypes.DECIMAL(12, 2),
    validate: {
      min: 0,
      max: 9999999999.99
    }
  },
  
  hasOtherPension: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  
  otherPensionDetails: {
    type: DataTypes.TEXT,
    validate: {
      len: [0, 1000]
    }
  },
  
  // Decision Information with strict validation
  approvedGrade: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 3
    }
  },
  
  monthlyAmount: {
    type: DataTypes.DECIMAL(12, 2),
    validate: {
      min: 0,
      max: 9999999999.99
    }
  },
  
  paymentStartDate: {
    type: DataTypes.DATEONLY,
    validate: {
      isDate: true
    }
  },
  
  rejectionReason: {
    type: DataTypes.TEXT,
    validate: {
      len: [0, 2000]
    }
  },
  
  notes: {
    type: DataTypes.TEXT,
    validate: {
      len: [0, 5000]
    }
  },
  
  // Extended fields for detailed management with robust validation
  daysAfterApplication: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0,
      max: 9999
    }
  },
  
  progressStatus: {
    type: DataTypes.ENUM(
      'initial_consultation',      // 初回相談
      'document_preparation',      // 書類準備中
      'medical_certificate',       // 診断書取得中
      'before_submission',         // 提出前
      'submitted',                 // 提出済み
      'under_review',             // 審査中
      'decision_notification',     // 決定通知
      'payment_received',          // 入金済み
      'completed'                 // 完了
    ),
    defaultValue: 'initial_consultation',
    allowNull: false,
    validate: {
      notEmpty: true,
      isIn: [['initial_consultation', 'document_preparation', 'medical_certificate', 'before_submission', 'submitted', 'under_review', 'decision_notification', 'payment_received', 'completed']]
    }
  },
  
  progressSubStatus: {
    type: DataTypes.STRING(100),
    validate: {
      len: [0, 100]
    }
  },
  
  requestType: {
    type: DataTypes.ENUM('new', 'renewal', 'grade_change', 'appeal'),
    allowNull: false,
    defaultValue: 'new',
    validate: {
      notEmpty: true,
      isIn: [['new', 'renewal', 'grade_change', 'appeal']]
    }
  },
  
  pensionType: {
    type: DataTypes.ENUM('disability_basic', 'disability_welfare', 'disability_mutual_aid'),
    allowNull: false,
    validate: {
      notEmpty: true,
      isIn: [['disability_basic', 'disability_welfare', 'disability_mutual_aid']]
    }
  },
  
  // Important dates with validation
  applicationCompletedDate: {
    type: DataTypes.DATEONLY,
    validate: {
      isDate: true
    }
  },
  
  benefitDecisionDate: {
    type: DataTypes.DATEONLY,
    validate: {
      isDate: true
    }
  },
  
  firstPaymentDate: {
    type: DataTypes.DATEONLY,
    validate: {
      isDate: true
    }
  },
  
  // Status flags with strict boolean validation
  certificateReceived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  
  recognitionResult: {
    type: DataTypes.ENUM('grade_1', 'grade_2', 'grade_3', 'rejected', 'pending'),
    defaultValue: 'pending',
    allowNull: false,
    validate: {
      notEmpty: true,
      isIn: [['grade_1', 'grade_2', 'grade_3', 'rejected', 'pending']]
    }
  },
  
  currentResult: {
    type: DataTypes.ENUM('receiving', 'suspended', 'terminated', 'appeal_in_progress'),
    defaultValue: 'receiving',
    allowNull: false,
    validate: {
      notEmpty: true,
      isIn: [['receiving', 'suspended', 'terminated', 'appeal_in_progress']]
    }
  },
  
  // Financial fields with precision and validation
  expectedRevenue: {
    type: DataTypes.DECIMAL(12, 2),
    validate: {
      min: 0,
      max: 9999999999.99
    }
  },
  
  remainingInstallment: {
    type: DataTypes.DECIMAL(12, 2),
    validate: {
      min: 0,
      max: 9999999999.99
    }
  },
  
  serviceFee: {
    type: DataTypes.DECIMAL(12, 2),
    validate: {
      min: 0,
      max: 9999999999.99
    }
  },
  
  // Additional status flags
  invoiceIssued: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  
  paymentVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  
  nextRenewalDate: {
    type: DataTypes.DATEONLY,
    validate: {
      isDate: true
    }
  },
  
  renewalNotPossible: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  
  disabilityHandbookGrade: {
    type: DataTypes.ENUM('grade_1', 'grade_2', 'grade_3', 'grade_4', 'grade_5', 'grade_6', 'none'),
    defaultValue: 'none',
    allowNull: false,
    validate: {
      notEmpty: true,
      isIn: [['grade_1', 'grade_2', 'grade_3', 'grade_4', 'grade_5', 'grade_6', 'none']]
    }
  },
  
  disabilityHandbookApplicationDesired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  
  employmentSupportDesired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  
  // Data integrity and security fields
  dataHash: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: 'SHA-256 hash for data integrity verification'
  },
  
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  
  // Relationships with strict foreign key constraints
  assignedToId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  },
  
  lastUpdatedById: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  }
}, {
  tableName: 'applications',
  timestamps: true,
  paranoid: true, // Soft delete for data retention
  
  // Database-level constraints
  indexes: [
    {
      unique: true,
      fields: ['applicationNumber']
    },
    {
      fields: ['status']
    },
    {
      fields: ['progressStatus']
    },
    {
      fields: ['pensionType']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['updatedAt']
    },
    {
      fields: ['assignedToId']
    },
    {
      fields: ['applicantName']
    },
    {
      fields: ['birthDate']
    },
    {
      name: 'applications_full_text_search',
      fields: ['applicantName', 'applicantNameKana', 'applicationNumber']
    }
  ],
  
  // Model hooks for business logic and data integrity
  hooks: {
    beforeCreate: async (application) => {
      // Generate application number with year/month prefix
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
      
      // Calculate days after application if dates are available
      if (application.applicationCompletedDate) {
        const diffTime = new Date() - new Date(application.applicationCompletedDate);
        application.daysAfterApplication = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      
      // Generate data hash for integrity
      application.dataHash = crypto
        .createHash('sha256')
        .update(JSON.stringify({
          applicantName: application.applicantName,
          birthDate: application.birthDate,
          disabilityType: application.disabilityType
        }))
        .digest('hex');
    },
    
    beforeUpdate: async (application) => {
      // Update version for optimistic locking
      application.version += 1;
      
      // Recalculate days after application
      if (application.applicationCompletedDate) {
        const diffTime = new Date() - new Date(application.applicationCompletedDate);
        application.daysAfterApplication = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      
      // Update data hash
      application.dataHash = crypto
        .createHash('sha256')
        .update(JSON.stringify({
          applicantName: application.applicantName,
          birthDate: application.birthDate,
          disabilityType: application.disabilityType,
          version: application.version
        }))
        .digest('hex');
    },
    
    beforeDestroy: async (application) => {
      // Log deletion attempt for audit
      console.log(`Application ${application.applicationNumber} marked for deletion`);
    }
  },
  
  // Custom validation methods
  validate: {
    statusTransitionValid() {
      const validTransitions = {
        'draft': ['submitted', 'withdrawn'],
        'submitted': ['under_review', 'additional_docs_required', 'withdrawn'],
        'under_review': ['approved', 'rejected', 'additional_docs_required'],
        'additional_docs_required': ['under_review', 'withdrawn'],
        'approved': [],
        'rejected': [],
        'withdrawn': []
      };
      
      // This would need to be implemented with previous state tracking
    },
    
    dateConsistency() {
      if (this.submittedAt && this.reviewStartedAt) {
        if (new Date(this.submittedAt) > new Date(this.reviewStartedAt)) {
          throw new Error('Review start date cannot be before submission date');
        }
      }
      
      if (this.reviewStartedAt && this.decidedAt) {
        if (new Date(this.reviewStartedAt) > new Date(this.decidedAt)) {
          throw new Error('Decision date cannot be before review start date');
        }
      }
    },
    
    financialConsistency() {
      if (this.remainingInstallment && this.expectedRevenue) {
        if (this.remainingInstallment > this.expectedRevenue) {
          throw new Error('Remaining installment cannot exceed expected revenue');
        }
      }
    }
  }
});

module.exports = Application;