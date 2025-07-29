const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create database transaction for atomic operation
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Users table (if not exists)
      await queryInterface.createTable('users', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        username: {
          type: DataTypes.STRING(50),
          unique: true,
          allowNull: false
        },
        email: {
          type: DataTypes.STRING(255),
          unique: true,
          allowNull: false
        },
        passwordHash: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        role: {
          type: DataTypes.ENUM('admin', 'staff', 'readonly'),
          defaultValue: 'staff',
          allowNull: false
        },
        firstName: {
          type: DataTypes.STRING(50),
          allowNull: false
        },
        lastName: {
          type: DataTypes.STRING(50),
          allowNull: false
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          allowNull: false
        },
        lastLoginAt: {
          type: DataTypes.DATE
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        deletedAt: {
          type: DataTypes.DATE
        }
      }, { 
        transaction,
        indexes: [
          { fields: ['email'] },
          { fields: ['username'] },
          { fields: ['role'] },
          { fields: ['isActive'] }
        ]
      });

      // Applications table with comprehensive fields
      await queryInterface.createTable('applications', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        
        // Unique business identifier
        applicationNumber: {
          type: DataTypes.STRING(50),
          unique: true,
          allowNull: false
        },
        
        // Basic applicant information
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
        
        // Contact information
        phoneNumber: {
          type: DataTypes.STRING(20)
        },
        email: {
          type: DataTypes.STRING(255)
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
          type: DataTypes.INTEGER
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
          defaultValue: 'draft',
          allowNull: false
        },
        
        // Timestamps
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
          type: DataTypes.DECIMAL(12, 2)
        },
        hasOtherPension: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        otherPensionDetails: {
          type: DataTypes.TEXT
        },
        
        // Decision Information
        approvedGrade: {
          type: DataTypes.INTEGER
        },
        monthlyAmount: {
          type: DataTypes.DECIMAL(12, 2)
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
        
        // Extended fields for detailed management
        daysAfterApplication: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          allowNull: false
        },
        progressStatus: {
          type: DataTypes.ENUM(
            'initial_consultation',
            'document_preparation',
            'medical_certificate',
            'before_submission',
            'submitted',
            'under_review',
            'decision_notification',
            'payment_received',
            'completed'
          ),
          defaultValue: 'initial_consultation',
          allowNull: false
        },
        progressSubStatus: {
          type: DataTypes.STRING(100)
        },
        requestType: {
          type: DataTypes.ENUM('new', 'renewal', 'grade_change', 'appeal'),
          allowNull: false,
          defaultValue: 'new'
        },
        pensionType: {
          type: DataTypes.ENUM('disability_basic', 'disability_welfare', 'disability_mutual_aid'),
          allowNull: false
        },
        
        // Important dates
        applicationCompletedDate: {
          type: DataTypes.DATEONLY
        },
        benefitDecisionDate: {
          type: DataTypes.DATEONLY
        },
        firstPaymentDate: {
          type: DataTypes.DATEONLY
        },
        
        // Status flags
        certificateReceived: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        recognitionResult: {
          type: DataTypes.ENUM('grade_1', 'grade_2', 'grade_3', 'rejected', 'pending'),
          defaultValue: 'pending',
          allowNull: false
        },
        currentResult: {
          type: DataTypes.ENUM('receiving', 'suspended', 'terminated', 'appeal_in_progress'),
          defaultValue: 'receiving',
          allowNull: false
        },
        
        // Financial fields
        expectedRevenue: {
          type: DataTypes.DECIMAL(12, 2)
        },
        remainingInstallment: {
          type: DataTypes.DECIMAL(12, 2)
        },
        serviceFee: {
          type: DataTypes.DECIMAL(12, 2)
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
          type: DataTypes.DATEONLY
        },
        renewalNotPossible: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        disabilityHandbookGrade: {
          type: DataTypes.ENUM('grade_1', 'grade_2', 'grade_3', 'grade_4', 'grade_5', 'grade_6', 'none'),
          defaultValue: 'none',
          allowNull: false
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
        
        // Data integrity and security
        dataHash: {
          type: DataTypes.STRING(64),
          comment: 'SHA-256 hash for data integrity verification'
        },
        version: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
          allowNull: false
        },
        
        // Foreign keys
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
        },
        
        // Timestamps
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        deletedAt: {
          type: DataTypes.DATE
        }
      }, {
        transaction,
        indexes: [
          { unique: true, fields: ['applicationNumber'] },
          { fields: ['status'] },
          { fields: ['progressStatus'] },
          { fields: ['pensionType'] },
          { fields: ['createdAt'] },
          { fields: ['updatedAt'] },
          { fields: ['assignedToId'] },
          { fields: ['applicantName'] },
          { fields: ['birthDate'] },
          { fields: ['applicantName', 'applicantNameKana', 'applicationNumber'] }
        ]
      });

      // Family Members table
      await queryInterface.createTable('family_members', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        
        // Foreign key
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
        
        // Member type
        memberType: {
          type: DataTypes.ENUM('spouse', 'child'),
          allowNull: false
        },
        
        // Personal information
        name: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        nameKana: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        birthDate: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        
        // Identification numbers
        myNumber: {
          type: DataTypes.STRING(12),
          comment: 'マイナンバー（12桁）'
        },
        basicPensionNumber: {
          type: DataTypes.STRING(10),
          comment: '基礎年金番号（10桁、配偶者のみ）'
        },
        
        // Relationship details
        relationship: {
          type: DataTypes.STRING(50)
        },
        
        // Child-specific information
        isStudent: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        schoolName: {
          type: DataTypes.STRING(255)
        },
        schoolYear: {
          type: DataTypes.INTEGER
        },
        graduationDate: {
          type: DataTypes.DATEONLY
        },
        
        // Spouse-specific information
        occupation: {
          type: DataTypes.STRING(100)
        },
        annualIncome: {
          type: DataTypes.DECIMAL(12, 2)
        },
        hasDisability: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        disabilityDetails: {
          type: DataTypes.TEXT
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
          type: DataTypes.DECIMAL(10, 2)
        },
        
        // Living status
        livesTogetherWithApplicant: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          allowNull: false
        },
        currentAddress: {
          type: DataTypes.TEXT
        },
        
        // Support information
        isDependent: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          allowNull: false
        },
        supportAmount: {
          type: DataTypes.DECIMAL(10, 2)
        },
        
        // Data integrity
        version: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
          allowNull: false
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          allowNull: false
        },
        
        // Timestamps
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        deletedAt: {
          type: DataTypes.DATE
        }
      }, {
        transaction,
        indexes: [
          { fields: ['applicationId'] },
          { fields: ['memberType'] },
          { fields: ['name'] },
          { fields: ['birthDate'] },
          { fields: ['isActive'] },
          { 
            unique: true, 
            fields: ['applicationId', 'memberType', 'name', 'birthDate'],
            name: 'unique_family_member_per_application'
          }
        ]
      });

      // Documents table
      await queryInterface.createTable('documents', {
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
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        documentType: {
          type: DataTypes.ENUM(
            'medical_certificate',
            'diagnosis_report',
            'application_form',
            'identity_document',
            'income_certificate',
            'other'
          ),
          allowNull: false
        },
        fileName: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        originalFileName: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        fileSize: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        mimeType: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        filePath: {
          type: DataTypes.STRING(500),
          allowNull: false
        },
        checksum: {
          type: DataTypes.STRING(64),
          allowNull: false,
          comment: 'SHA-256 checksum for file integrity'
        },
        uploadedById: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        verifiedById: {
          type: DataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        isVerified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        verifiedAt: {
          type: DataTypes.DATE
        },
        notes: {
          type: DataTypes.TEXT
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        deletedAt: {
          type: DataTypes.DATE
        }
      }, {
        transaction,
        indexes: [
          { fields: ['applicationId'] },
          { fields: ['documentType'] },
          { fields: ['uploadedById'] },
          { fields: ['isVerified'] },
          { fields: ['createdAt'] }
        ]
      });

      // Activities/Audit log table
      await queryInterface.createTable('activities', {
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
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        action: {
          type: DataTypes.ENUM(
            'created',
            'updated',
            'deleted',
            'status_changed',
            'document_uploaded',
            'document_verified',
            'comment_added',
            'assigned',
            'submitted',
            'approved',
            'rejected'
          ),
          allowNull: false
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        oldValues: {
          type: DataTypes.JSON,
          comment: 'Previous values for update operations'
        },
        newValues: {
          type: DataTypes.JSON,
          comment: 'New values for update operations'
        },
        ipAddress: {
          type: DataTypes.STRING(45),
          comment: 'IPv4 or IPv6 address'
        },
        userAgent: {
          type: DataTypes.TEXT,
          comment: 'Browser user agent string'
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, {
        transaction,
        indexes: [
          { fields: ['applicationId'] },
          { fields: ['userId'] },
          { fields: ['action'] },
          { fields: ['createdAt'] },
          { fields: ['applicationId', 'createdAt'] }
        ]
      });

      // Comments table
      await queryInterface.createTable('comments', {
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
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        parentId: {
          type: DataTypes.INTEGER,
          references: {
            model: 'comments',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        isInternal: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'Internal comments not visible to applicants'
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        deletedAt: {
          type: DataTypes.DATE
        }
      }, {
        transaction,
        indexes: [
          { fields: ['applicationId'] },
          { fields: ['userId'] },
          { fields: ['parentId'] },
          { fields: ['isInternal'] },
          { fields: ['createdAt'] }
        ]
      });

      // Create database constraints and checks
      await queryInterface.addConstraint('applications', {
        fields: ['birthDate'],
        type: 'check',
        name: 'applications_birth_date_check',
        where: {
          birthDate: {
            [Sequelize.Op.gte]: '1900-01-01',
            [Sequelize.Op.lt]: Sequelize.literal('CURRENT_DATE')
          }
        },
        transaction
      });

      await queryInterface.addConstraint('applications', {
        fields: ['disabilityGrade'],
        type: 'check',
        name: 'applications_disability_grade_check',
        where: {
          disabilityGrade: {
            [Sequelize.Op.between]: [1, 7]
          }
        },
        transaction
      });

      await queryInterface.addConstraint('applications', {
        fields: ['daysAfterApplication'],
        type: 'check',
        name: 'applications_days_after_application_check',
        where: {
          daysAfterApplication: {
            [Sequelize.Op.gte]: 0
          }
        },
        transaction
      });

      await queryInterface.addConstraint('family_members', {
        fields: ['myNumber'],
        type: 'check',
        name: 'family_members_my_number_format_check',
        where: Sequelize.literal("my_number IS NULL OR my_number ~ '^[0-9]{12}$'"),
        transaction
      });

      await queryInterface.addConstraint('family_members', {
        fields: ['basicPensionNumber'],
        type: 'check',
        name: 'family_members_pension_number_format_check',
        where: Sequelize.literal("basic_pension_number IS NULL OR basic_pension_number ~ '^[0-9]{10}$'"),
        transaction
      });

      // Create triggers for automatic timestamp updates
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `, { transaction });

      // Apply triggers to all tables with updated_at columns
      const tablesWithUpdatedAt = ['users', 'applications', 'family_members', 'documents', 'comments'];
      
      for (const table of tablesWithUpdatedAt) {
        await queryInterface.sequelize.query(`
          CREATE TRIGGER update_${table}_updated_at 
          BEFORE UPDATE ON ${table} 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `, { transaction });
      }

      await transaction.commit();
      console.log('Database migration completed successfully');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Database migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Drop in reverse order due to foreign key constraints
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      await queryInterface.dropTable('comments', { transaction });
      await queryInterface.dropTable('activities', { transaction });
      await queryInterface.dropTable('documents', { transaction });
      await queryInterface.dropTable('family_members', { transaction });
      await queryInterface.dropTable('applications', { transaction });
      await queryInterface.dropTable('users', { transaction });
      
      // Drop the trigger function
      await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;', { transaction });
      
      await transaction.commit();
      console.log('Database rollback completed successfully');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Database rollback failed:', error);
      throw error;
    }
  }
};