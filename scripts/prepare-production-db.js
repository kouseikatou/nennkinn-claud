const fs = require('fs');
const path = require('path');
const { sequelize, User, Application, FamilyMember, Survey } = require('../project-management-app/backend/src/models');
const bcrypt = require('bcryptjs');

async function prepareProductionDatabase() {
  try {
    console.log('🚀 本番用データベース準備開始...\n');

    // データディレクトリ作成
    const dataDir = path.join(__dirname, '..', 'data');
    const backupsDir = path.join(dataDir, 'backups');
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('✅ データディレクトリ作成完了');
    }
    
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
      console.log('✅ バックアップディレクトリ作成完了');
    }

    // 環境変数を本番用に設定
    process.env.DB_DIALECT = 'sqlite';
    process.env.DB_STORAGE = './data/production.sqlite';
    process.env.NODE_ENV = 'production';

    // データベース接続
    await sequelize.authenticate();
    console.log('✅ データベース接続成功\n');

    // テーブル作成（force: falseで既存データを保持）
    await sequelize.sync({ force: false });
    console.log('✅ テーブル構造確認完了\n');

    // 1. 管理者アカウント作成
    console.log('👤 管理者アカウントセットアップ...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const [adminUser] = await User.findOrCreate({
      where: { email: 'admin@disability-pension.jp' },
      defaults: {
        name: 'システム管理者',
        email: 'admin@disability-pension.jp',
        password: adminPassword,
        role: 'admin',
        isActive: true
      }
    });
    console.log(`✅ 管理者: ${adminUser.email}\n`);

    // 2. スタッフアカウント作成
    console.log('👥 スタッフアカウントセットアップ...');
    const staffPassword = await bcrypt.hash('staff123', 10);
    const staffMembers = [
      { name: '山田花子', email: 'yamada@disability-pension.jp' },
      { name: '佐藤次郎', email: 'sato@disability-pension.jp' }
    ];

    for (const staff of staffMembers) {
      const [staffUser] = await User.findOrCreate({
        where: { email: staff.email },
        defaults: {
          ...staff,
          password: staffPassword,
          role: 'staff',
          isActive: true
        }
      });
      console.log(`✅ スタッフ: ${staffUser.email}`);
    }

    // 3. サンプル申請者データ（テスト用）
    console.log('\n📋 サンプル申請データセットアップ...');
    const sampleApplications = [
      {
        applicantName: '田中太郎',
        applicantNameKana: 'タナカタロウ',
        birthDate: '1985-03-15',
        gender: 'male',
        phoneNumber: '090-1234-5678',
        email: 'tanaka@example.com',
        address: '東京都新宿区西新宿1-1-1',
        postalCode: '160-0023',
        disabilityType: 'mental',
        disabilityGrade: 2,
        disabilityDescription: 'うつ病による精神障害',
        onsetDate: '2020-06-01',
        status: 'submitted'
      },
      {
        applicantName: '鈴木花子',
        applicantNameKana: 'スズキハナコ',
        birthDate: '1990-07-22',
        gender: 'female',
        phoneNumber: '080-5678-1234',
        email: 'suzuki@example.com',
        address: '東京都渋谷区渋谷2-2-2',
        postalCode: '150-0002',
        disabilityType: 'physical',
        disabilityGrade: 3,
        disabilityDescription: '交通事故による下肢機能障害',
        onsetDate: '2021-03-15',
        status: 'in_review'
      }
    ];

    for (const appData of sampleApplications) {
      const [application] = await Application.findOrCreate({
        where: { 
          applicantName: appData.applicantName,
          email: appData.email 
        },
        defaults: {
          ...appData,
          applicationType: 'new',
          hospitalName: '東京医療センター',
          doctorName: '山田医師',
          diagnosisDate: appData.onsetDate,
          monthlyIncome: 200000,
          hasOtherPension: false,
          createdById: adminUser.id,
          assignedToId: staffMembers[0].id,
          lastUpdatedById: adminUser.id
        }
      });
      console.log(`✅ 申請データ: ${application.applicantName} (${application.applicationNumber})`);
    }

    // 4. 統計情報表示
    console.log('\n📊 データベース統計:');
    console.log(`   - ユーザー数: ${await User.count()}`);
    console.log(`   - 申請数: ${await Application.count()}`);
    console.log(`   - アクティブスタッフ: ${await User.count({ where: { role: 'staff', isActive: true } })}`);

    // 5. 初期バックアップ作成
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupPath = path.join(backupsDir, `initial_${timestamp}.sqlite`);
    
    if (fs.existsSync('./data/production.sqlite')) {
      fs.copyFileSync('./data/production.sqlite', backupPath);
      console.log(`\n💾 初期バックアップ作成: ${backupPath}`);
    }

    console.log('\n✨ 本番用データベース準備完了！');
    console.log('\n📝 ログイン情報:');
    console.log('   管理者: admin@disability-pension.jp / admin123');
    console.log('   スタッフ: yamada@disability-pension.jp / staff123');
    console.log('           sato@disability-pension.jp / staff123');
    
    return true;
  } catch (error) {
    console.error('\n❌ エラー発生:', error);
    return false;
  } finally {
    await sequelize.close();
  }
}

// 直接実行時
if (require.main === module) {
  prepareProductionDatabase()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 予期しないエラー:', error);
      process.exit(1);
    });
}

module.exports = prepareProductionDatabase;