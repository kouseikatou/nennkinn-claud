const { sequelize, User, Application, FamilyMember } = require('./src/models');
const bcrypt = require('bcryptjs');

async function initFreshData() {
  try {
    console.log('🗑️  既存データベースを完全削除中...');
    
    // Force sync - 既存テーブルを削除して再作成
    await sequelize.sync({ force: true });
    console.log('✅ データベーステーブルを再作成しました');

    // テストユーザーを作成
    console.log('👤 テストユーザーを作成中...');
    const testUser = await User.create({
      email: 'admin@test.com',
      password: 'admin123',
      name: '管理者',
      role: 'admin',
      department: 'システム管理部',
      isActive: true
    });
    console.log('✅ テストユーザーを作成しました:', testUser.name);

    // テスト申請データを作成
    console.log('📋 テスト申請データを作成中...');
    const applications = [
      {
        applicationNumber: 'DP202400001',
        applicantName: '田中太郎',
        applicantNameKana: 'タナカタロウ',
        birthDate: '1980-05-15',
        gender: 'male',
        phoneNumber: '03-1234-5678',
        email: 'tanaka@example.com',
        address: '東京都新宿区西新宿1-1-1',
        postalCode: '160-0023',
        disabilityType: 'mental',
        disabilityDescription: 'うつ病',
        onsetDate: '2023-05-10',
        disabilityGrade: 2,
        applicationType: 'new',
        status: 'under_review',
        hospitalName: '新宿メンタルクリニック',
        doctorName: '佐藤医師',
        monthlyIncome: 200000,
        createdById: testUser.id,
        lastUpdatedById: testUser.id
      },
      {
        applicationNumber: 'DP202400002',
        applicantName: '山田花子',
        applicantNameKana: 'ヤマダハナコ',
        birthDate: '1975-08-22',
        gender: 'female',
        phoneNumber: '03-2345-6789',
        email: 'yamada@example.com',
        address: '東京都渋谷区渋谷1-2-3',
        postalCode: '150-0002',
        disabilityType: 'mental',
        disabilityDescription: '統合失調症',
        onsetDate: '2022-03-15',
        disabilityGrade: 1,
        applicationType: 'new',
        status: 'approved',
        hospitalName: '渋谷総合病院',
        doctorName: '田中医師',
        monthlyIncome: 150000,
        approvedGrade: 1,
        monthlyAmount: 81000,
        createdById: testUser.id,
        lastUpdatedById: testUser.id
      },
      {
        applicationNumber: 'DP202400003',
        applicantName: '佐藤一郎',
        applicantNameKana: 'サトウイチロウ',
        birthDate: '1970-12-03',
        gender: 'male',
        phoneNumber: '03-3456-7890',
        email: 'sato@example.com',
        address: '東京都品川区品川2-3-4',
        postalCode: '140-0001',
        disabilityType: 'physical',
        disabilityDescription: '腰椎椎間板ヘルニア',
        onsetDate: '2021-08-10',
        disabilityGrade: 3,
        applicationType: 'renewal',
        status: 'approved',
        hospitalName: '品川整形外科',
        doctorName: '高橋医師',
        monthlyIncome: 300000,
        approvedGrade: 3,
        monthlyAmount: 58000,
        createdById: testUser.id,
        lastUpdatedById: testUser.id
      },
      {
        applicationNumber: 'DP202400004',
        applicantName: '鈴木美智子',
        applicantNameKana: 'スズキミチコ',
        birthDate: '1985-04-18',
        gender: 'female',
        phoneNumber: '03-4567-8901',
        email: 'suzuki@example.com',
        address: '東京都中野区中野3-4-5',
        postalCode: '164-0001',
        disabilityType: 'mental',
        disabilityDescription: '双極性障害',
        onsetDate: '2023-12-01',
        disabilityGrade: 2,
        applicationType: 'new',
        status: 'draft',
        hospitalName: '中野心療内科',
        doctorName: '伊藤医師',
        monthlyIncome: 180000,
        createdById: testUser.id,
        lastUpdatedById: testUser.id
      },
      {
        applicationNumber: 'DP202400005',
        applicantName: '高橋健太',
        applicantNameKana: 'タカハシケンタ',
        birthDate: '1978-09-25',
        gender: 'male',
        phoneNumber: '03-5678-9012',
        email: 'takahashi@example.com',
        address: '東京都杉並区荻窪4-5-6',
        postalCode: '167-0043',
        disabilityType: 'physical',
        disabilityDescription: '関節リウマチ',
        onsetDate: '2022-11-20',
        disabilityGrade: 3,
        applicationType: 'appeal',
        status: 'rejected',
        hospitalName: '荻窪リウマチクリニック',
        doctorName: '小林医師',
        monthlyIncome: 250000,
        rejectionReason: '労働能力に著しい制限が認められない',
        createdById: testUser.id,
        lastUpdatedById: testUser.id
      }
    ];

    const createdApplications = [];
    for (const appData of applications) {
      const app = await Application.create(appData);
      createdApplications.push(app);
      console.log(`✅ 申請データを作成: ${app.applicantName}`);
    }

    // 家族構成データを追加
    console.log('👨‍👩‍👧‍👦 家族構成データを作成中...');
    
    // 田中太郎の家族
    await FamilyMember.create({
      applicationId: createdApplications[0].id,
      memberType: 'spouse',
      name: '田中花子',
      nameKana: 'タナカハナコ',
      birthDate: '1982-03-20',
      myNumber: '123456789012'
    });

    await FamilyMember.create({
      applicationId: createdApplications[0].id,
      memberType: 'child',
      name: '田中太郎Jr.',
      nameKana: 'タナカタロウジュニア',
      birthDate: '2010-07-15',
      myNumber: '234567890123'
    });

    // 佐藤一郎の家族
    await FamilyMember.create({
      applicationId: createdApplications[2].id,
      memberType: 'spouse',
      name: '佐藤美香',
      nameKana: 'サトウミカ',
      birthDate: '1973-11-08',
      myNumber: '345678901234'
    });

    for (let i = 1; i <= 3; i++) {
      await FamilyMember.create({
        applicationId: createdApplications[2].id,
        memberType: 'child',
        name: `佐藤子供${i}`,
        nameKana: `サトウコドモ${i}`,
        birthDate: `200${i + 5}-0${i}-0${i}`,
        myNumber: `45678901234${i}`
      });
    }

    console.log('✅ 家族構成データを作成しました');

    console.log('🎉 初期データの作成が完了しました！');
    console.log(`📊 作成されたデータ:`);
    console.log(`   - ユーザー: 1件`);
    console.log(`   - 申請: ${createdApplications.length}件`);
    console.log(`   - 家族構成: 6件`);
    console.log('');
    console.log('🔐 テストログイン情報:');
    console.log('   Email: admin@test.com');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ 初期データ作成中にエラーが発生しました:', error);
  } finally {
    await sequelize.close();
  }
}

initFreshData();