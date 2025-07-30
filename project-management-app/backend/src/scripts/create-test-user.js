const bcrypt = require('bcryptjs');
const { User } = require('../models');

async function createTestUser() {
  try {
    console.log('🔐 テストユーザー作成開始...');
    
    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('✅ パスワードハッシュ生成完了');
    
    // 管理者ユーザーを更新または作成
    const [user, created] = await User.upsert({
      email: 'admin@disability-pension.com',
      password: hashedPassword,
      name: '管理者',
      role: 'admin'
    }, {
      where: { email: 'admin@disability-pension.com' }
    });
    
    if (created) {
      console.log('✅ テストユーザー作成完了');
    } else {
      console.log('✅ テストユーザー更新完了');
    }
    
    console.log('📋 ユーザー情報:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: admin123`);
    console.log(`   Role: ${user.role}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

createTestUser();