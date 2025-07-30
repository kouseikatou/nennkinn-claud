// データベース初期化スクリプト
const { sequelize } = require('./config');
const { Application, User } = require('./models');

const initDatabase = async () => {
  try {
    // データベース接続確認
    await sequelize.authenticate();
    console.log('✅ データベース接続確認完了');

    // テーブルの作成（既存のテーブルは変更しない）
    await sequelize.sync({ alter: false });
    console.log('✅ テーブル作成/確認完了');

    // 初期ユーザーの作成（存在しない場合のみ）
    const adminUser = await User.findOne({ where: { email: 'admin@example.com' } });
    if (!adminUser) {
      await User.create({
        email: 'admin@example.com',
        password: 'admin123', // 本番環境では強力なパスワードに変更
        name: '管理者',
        role: 'admin',
        isActive: true
      });
      console.log('✅ 管理者ユーザー作成完了');
    }

    // 開発環境用のサンプルデータ作成
    if (process.env.NODE_ENV !== 'production') {
      const sampleCount = await Application.count();
      if (sampleCount === 0) {
        await Application.bulkCreate([
          {
            applicationNumber: 'APP000001',
            applicantName: '山田太郎',
            applicantNameKana: 'ヤマダタロウ',
            birthDate: '1960-04-15',
            gender: 'male',
            phoneNumber: '090-1234-5678',
            email: 'yamada@example.com',
            address: '東京都千代田区霞が関1-2-3',
            postalCode: '100-0013',
            basicPensionNumber: '1234-567890',
            status: 'submitted',
            submittedAt: new Date('2024-01-15T10:00:00Z')
          },
          {
            applicationNumber: 'APP000002',
            applicantName: '鈴木花子',
            applicantNameKana: 'スズキハナコ',
            birthDate: '1958-08-22',
            gender: 'female',
            phoneNumber: '090-9876-5432',
            email: 'suzuki@example.com',
            address: '大阪府大阪市中央区本町4-5-6',
            postalCode: '541-0053',
            basicPensionNumber: '9876-543210',
            status: 'under_review',
            submittedAt: new Date('2024-01-10T14:30:00Z')
          },
          {
            applicationNumber: 'APP000003',
            applicantName: '佐藤次郎',
            applicantNameKana: 'サトウジロウ',
            birthDate: '1962-12-01',
            gender: 'male',
            phoneNumber: '080-1111-2222',
            address: '愛知県名古屋市中村区名駅3-4-5',
            postalCode: '450-0002',
            status: 'draft'
          }
        ]);
        console.log('✅ サンプルデータ作成完了');
      }
    }

    console.log('✅ データベース初期化完了');
    return true;
  } catch (error) {
    console.error('❌ データベース初期化エラー:', error);
    return false;
  }
};

// 直接実行された場合
if (require.main === module) {
  initDatabase().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = initDatabase;