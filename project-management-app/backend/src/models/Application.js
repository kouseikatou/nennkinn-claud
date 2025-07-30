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
      isEmail: {
        msg: 'Valid email address is required'
      }
    },
    allowNull: true,
    defaultValue: null
  },
  address: {
    type: DataTypes.TEXT
  },
  postalCode: {
    type: DataTypes.STRING(10)
  },
  // 基礎年金番号
  pensionNumber: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  // マイナンバー
  myNumber: {
    type: DataTypes.STRING(12),
    allowNull: true,
    validate: {
      len: [12, 12]
    }
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
  // 申請管理情報の追加項目
  certificateReceived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '証書受領'
  },
  benefitDecisionDate: {
    type: DataTypes.DATEONLY,
    comment: '受給決定日'
  },
  firstPaymentDate: {
    type: DataTypes.DATEONLY,
    comment: '初回入金日'
  },
  certificationDate: {
    type: DataTypes.DATEONLY,
    comment: '認定日'
  },
  certificationResult: {
    type: DataTypes.STRING(100),
    comment: '認定日結果'
  },
  currentResult: {
    type: DataTypes.STRING(100),
    comment: '現在結果'
  },
  nextUpdateDate: {
    type: DataTypes.DATEONLY,
    comment: '次回更新日'
  },
  updateUnavailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '更新不可者'
  },
  invoiceIssued: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '請求書発行'
  },
  invoiceData: {
    type: DataTypes.TEXT,
    comment: '請求書データ'
  },
  expectedRevenue: {
    type: DataTypes.DECIMAL(12, 2),
    comment: '売上見込み'
  },
  paymentConfirmed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '入金チェック'
  },
  installmentBalance: {
    type: DataTypes.DECIMAL(12, 2),
    comment: '分割残額'
  },
  processingFeeAmount: {
    type: DataTypes.DECIMAL(12, 2),
    comment: '事務手数料額'
  },
  processingFeeReceivedDate: {
    type: DataTypes.DATEONLY,
    comment: '事務手数料受領日'
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
      try {
        // Generate application number
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        
        console.log('🔧 applicationNumber生成中...');
        
        // データベース方言に応じて年を取得
        let whereClause;
        if (sequelize.getDialect() === 'postgres') {
          whereClause = sequelize.where(
            sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "createdAt"')),
            year
          );
        } else if (sequelize.getDialect() === 'sqlite') {
          whereClause = sequelize.where(
            sequelize.fn('strftime', '%Y', sequelize.col('createdAt')),
            year.toString()
          );
        } else {
          // MySQL
          whereClause = sequelize.where(
            sequelize.fn('YEAR', sequelize.col('createdAt')),
            year
          );
        }
        
        const count = await Application.count({ where: whereClause });
        application.applicationNumber = `DP${year}${month}${String(count + 1).padStart(5, '0')}`;
        console.log(`✅ applicationNumber生成完了: ${application.applicationNumber}`);
      } catch (error) {
        console.error('❌ applicationNumber生成エラー:', error);
        // フォールバックとして簡単な番号を生成
        const timestamp = Date.now();
        application.applicationNumber = `DP${timestamp}`;
        console.log(`⚠️  フォールバックapplicationNumber: ${application.applicationNumber}`);
      }
    }
  }
});

module.exports = Application;