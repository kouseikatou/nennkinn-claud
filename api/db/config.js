// データベース設定
const { Sequelize } = require('sequelize');

// 環境変数からデータベース接続情報を取得
const DATABASE_URL = process.env.DATABASE_URL || process.env.MYSQL_URL;

let sequelize;

if (DATABASE_URL) {
  // 本番環境: Neon PostgreSQL
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false, // SQLログを無効化（必要に応じて有効化）
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // 開発環境: SQLiteを使用（ファイルベース）
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
  });
}

// データベース接続テスト
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ データベース接続成功');
    return true;
  } catch (error) {
    console.error('❌ データベース接続エラー:', error.message);
    return false;
  }
};

module.exports = { sequelize, testConnection };