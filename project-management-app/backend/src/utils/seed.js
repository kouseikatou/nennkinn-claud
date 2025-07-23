const { faker } = require('@faker-js/faker/locale/ja');
const bcrypt = require('bcryptjs');
const { 
  User, 
  Application, 
  Document, 
  Activity, 
  Comment,
  sequelize 
} = require('../models');
const logger = require('./logger');

// Set Japanese locale
faker.locale = 'ja';

const seedDatabase = async () => {
  try {
    logger.info('Starting database seeding...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      email: 'admin@disability-pension.jp',
      password: adminPassword,
      name: '管理者',
      role: 'admin',
      department: 'システム管理部',
      phoneNumber: '090-1234-5678'
    });

    logger.info('Admin user created');

    // Create staff users
    const staffUsers = [];
    for (let i = 0; i < 5; i++) {
      const staffPassword = await bcrypt.hash('staff123', 10);
      const staff = await User.create({
        email: `staff${i + 1}@disability-pension.jp`,
        password: staffPassword,
        name: faker.person.fullName(),
        role: 'staff',
        department: faker.helpers.arrayElement(['審査部', '申請受付部', 'サポート部']),
        phoneNumber: faker.phone.number('090-####-####')
      });
      staffUsers.push(staff);
    }

    logger.info(`${staffUsers.length} staff users created`);

    // Create viewer user
    const viewerPassword = await bcrypt.hash('viewer123', 10);
    await User.create({
      email: 'viewer@disability-pension.jp',
      password: viewerPassword,
      name: '閲覧者',
      role: 'viewer',
      department: '監査部'
    });

    logger.info('Viewer user created');

    // Create applications
    const statuses = ['draft', 'submitted', 'under_review', 'additional_docs_required', 'approved', 'rejected'];
    const disabilityTypes = ['physical', 'mental', 'intellectual', 'multiple'];
    const applicationTypes = ['new', 'renewal', 'grade_change', 'appeal'];

    for (let i = 0; i < 50; i++) {
      const status = faker.helpers.arrayElement(statuses);
      const assignee = faker.helpers.arrayElement(staffUsers);
      
      const applicationData = {
        applicantName: faker.person.fullName(),
        applicantNameKana: faker.person.fullName(),
        birthDate: faker.date.birthdate({ min: 20, max: 70, mode: 'age' }),
        gender: faker.helpers.arrayElement(['male', 'female']),
        phoneNumber: faker.phone.number('090-####-####'),
        email: faker.internet.email(),
        address: faker.location.streetAddress(true),
        postalCode: faker.location.zipCode('###-####'),
        disabilityType: faker.helpers.arrayElement(disabilityTypes),
        disabilityGrade: faker.number.int({ min: 1, max: 7 }),
        disabilityDescription: faker.lorem.paragraph(),
        onsetDate: faker.date.past({ years: 5 }),
        applicationType: faker.helpers.arrayElement(applicationTypes),
        status: status,
        hospitalName: faker.company.name() + '病院',
        doctorName: faker.person.fullName() + ' 医師',
        diagnosisDate: faker.date.recent({ days: 90 }),
        monthlyIncome: faker.number.int({ min: 0, max: 500000 }),
        hasOtherPension: faker.datatype.boolean(),
        notes: faker.lorem.sentence(),
        assignedToId: assignee.id,
        createdById: admin.id,
        lastUpdatedById: admin.id
      };

      // Add status-specific fields
      if (status === 'submitted' || ['under_review', 'approved', 'rejected'].includes(status)) {
        applicationData.submittedAt = faker.date.recent({ days: 30 });
      }
      if (['under_review', 'approved', 'rejected'].includes(status)) {
        applicationData.reviewStartedAt = faker.date.recent({ days: 20 });
      }
      if (status === 'approved' || status === 'rejected') {
        applicationData.decidedAt = faker.date.recent({ days: 10 });
        if (status === 'approved') {
          applicationData.approvedGrade = faker.number.int({ min: 1, max: 3 });
          applicationData.monthlyAmount = faker.number.int({ min: 50000, max: 150000 });
          applicationData.paymentStartDate = faker.date.soon({ days: 30 });
        } else {
          applicationData.rejectionReason = faker.lorem.sentence();
        }
      }

      const application = await Application.create(applicationData);

      // Create some activities for the application
      await Activity.create({
        applicationId: application.id,
        userId: admin.id,
        activityType: 'created',
        description: `申請書 ${application.applicationNumber} が作成されました`,
        ipAddress: faker.internet.ipv4()
      });

      if (status !== 'draft') {
        await Activity.create({
          applicationId: application.id,
          userId: admin.id,
          activityType: 'status_changed',
          description: `ステータスが「${status}」に変更されました`,
          metadata: { oldStatus: 'draft', newStatus: status },
          ipAddress: faker.internet.ipv4()
        });
      }

      // Create some comments
      if (faker.datatype.boolean()) {
        await Comment.create({
          applicationId: application.id,
          userId: assignee.id,
          content: faker.lorem.sentence(),
          isInternal: true
        });
      }
    }

    logger.info('50 applications created with activities and comments');

    // Create some sample documents for a few applications
    const applications = await Application.findAll({ limit: 10 });
    const documentTypes = [
      'medical_certificate',
      'disability_certificate',
      'income_certificate',
      'residence_certificate',
      'bank_account',
      'id_card'
    ];

    for (const app of applications) {
      const numDocs = faker.number.int({ min: 1, max: 4 });
      for (let i = 0; i < numDocs; i++) {
        const docType = faker.helpers.arrayElement(documentTypes);
        await Document.create({
          applicationId: app.id,
          documentType: docType,
          fileName: `${docType}_${Date.now()}.pdf`,
          originalName: `${docType}.pdf`,
          filePath: `/uploads/2024/01/${docType}_${Date.now()}.pdf`,
          fileSize: faker.number.int({ min: 100000, max: 5000000 }),
          mimeType: 'application/pdf',
          isVerified: faker.datatype.boolean(),
          uploadedById: app.createdById
        });
      }
    }

    logger.info('Sample documents created');

    logger.info('Database seeding completed successfully');
    logger.info('\nTest accounts:');
    logger.info('Admin: admin@disability-pension.jp / admin123');
    logger.info('Staff: staff1@disability-pension.jp / staff123');
    logger.info('Viewer: viewer@disability-pension.jp / viewer123');
    
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();