require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('./src/config/database');
const User = require('./src/models/User');

async function createTestUser() {
    try {
        // データベース接続
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // テーブル同期
        await sequelize.sync({ force: false });
        console.log('Database synced successfully.');

        // パスワードハッシュ化
        const hashedPassword = await bcrypt.hash('admin123', 12);

        // テストユーザー作成
        const testUser = await User.create({
            email: 'admin@disability-pension.jp',
            password: hashedPassword,
            name: '管理者太郎',
            role: 'admin',
            isActive: true
        });

        console.log('✅ テストユーザー作成成功:', {
            id: testUser.id,
            email: testUser.email,
            role: testUser.role
        });

        console.log('\n📋 ログイン情報:');
        console.log('Email: admin@disability-pension.jp');
        console.log('Password: admin123');

        process.exit(0);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            console.log('⚠️ テストユーザーは既に存在します');
            console.log('\n📋 ログイン情報:');
            console.log('Email: admin@disability-pension.jp');
            console.log('Password: admin123');
        } else {
            console.error('❌ エラー:', error);
        }
        process.exit(1);
    }
}

createTestUser();