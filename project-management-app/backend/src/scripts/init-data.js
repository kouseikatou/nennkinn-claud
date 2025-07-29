const { sequelize, User, Application } = require('../models');

async function initializeData() {
  try {
    console.log('🚀 データベース初期化開始...');
    
    // データベース接続確認
    await sequelize.authenticate();
    console.log('✅ データベース接続成功');

    // テーブル同期（本番環境では既存テーブルをそのまま使用）
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ テーブル同期完了');

    // 既存データをクリア（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      await sequelize.query('DELETE FROM applications');
      await sequelize.query('DELETE FROM users');
      await sequelize.query('DELETE FROM surveys');
      console.log('✅ 既存データクリア完了');
    }

    // 管理者ユーザーの作成
    const [adminUser, created] = await User.findOrCreate({
      where: { email: 'admin@disability-pension.com' },
      defaults: {
        name: '管理者',
        email: 'admin@disability-pension.com',
        password: '$2a$10$hashedPasswordPlaceholder', // 実際の環境では適切にハッシュ化
        role: 'admin'
      }
    });

    if (created) {
      console.log('✅ 管理者ユーザー作成:', adminUser.name);
    } else {
      console.log('✅ 管理者ユーザー既存確認:', adminUser.name);
    }

    // 田中太郎の申請データ作成
    const [tanakaApplication, appCreated] = await Application.findOrCreate({
      where: { 
        applicantName: '田中太郎',
        applicantNameKana: 'タナカタロウ'
      },
      defaults: {
        applicantName: '田中太郎',
        applicantNameKana: 'タナカタロウ',
        birthDate: '1985-03-15',
        gender: 'male',
        phoneNumber: '090-1234-5678',
        email: 'tanaka.taro@example.com',
        address: '東京都新宿区西新宿1-1-1',
        postalCode: '160-0023',
        disabilityType: 'mental',
        disabilityGrade: 2,
        disabilityDescription: 'うつ病による精神障害',
        onsetDate: '2020-06-01',
        applicationType: 'new',
        status: 'draft',
        hospitalName: '新宿メンタルクリニック',
        doctorName: '山田医師',
        diagnosisDate: '2020-06-15',
        monthlyIncome: 150000,
        hasOtherPension: false,
        createdById: adminUser.id,
        assignedToId: adminUser.id,
        lastUpdatedById: adminUser.id
      }
    });

    if (appCreated) {
      console.log('✅ 田中太郎の申請データ作成:', {
        id: tanakaApplication.id,
        applicationNumber: tanakaApplication.applicationNumber,
        applicantName: tanakaApplication.applicantName
      });
    } else {
      console.log('✅ 田中太郎の申請データ既存確認:', {
        id: tanakaApplication.id,
        applicationNumber: tanakaApplication.applicationNumber
      });
    }

    console.log('🎉 データベース初期化完了！');
    console.log(`📊 データ概要:`);
    console.log(`   - ユーザー数: ${await User.count()}`);
    console.log(`   - 申請数: ${await Application.count()}`);
    
    return {
      adminUser,
      tanakaApplication
    };

  } catch (error) {
    console.error('❌ 初期化エラー:', error);
    throw error;
  }
}

// スクリプトとして直接実行された場合
if (require.main === module) {
  initializeData()
    .then(() => {
      console.log('✨ 初期化スクリプト完了');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 初期化失敗:', error);
      process.exit(1);
    });
}

module.exports = initializeData;