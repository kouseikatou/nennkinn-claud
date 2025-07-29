const { sequelize, User, Application } = require('./src/models');

async function createTestData() {
  try {
    // データベース接続
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // テストユーザーの作成
    const testUser = await User.create({
      name: 'テストユーザー',
      email: 'test@example.com',
      password: 'hashed_password',
      role: 'admin'
    });
    console.log('✅ Test user created:', { id: testUser.id, name: testUser.name });

    // テスト申請の作成（外部キー制約を満たすため）
    const testApplication = await Application.create({
      applicationNumber: 'TEST-2024-001', 
      applicantName: '田中太郎',
      applicantNameKana: 'タナカタロウ',
      birthDate: '1990-01-01',
      gender: 'male',
      disabilityType: 'mental',
      applicationType: 'new',
      createdById: testUser.id,
      assignedToId: testUser.id,
      lastUpdatedById: testUser.id
    });

    console.log('✅ Test application created:', {
      id: testApplication.id,
      applicationNumber: testApplication.applicationNumber,
      applicantName: testApplication.applicantName
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestData();