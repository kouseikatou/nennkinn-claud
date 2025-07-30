const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
const path = require('path');

let sequelize;

// 環境に応じたSQLiteデータベースパスの設定
function getDatabasePath() {
  const env = process.env.NODE_ENV || 'development';
  const basePath = process.env.DB_STORAGE;
  
  if (basePath) {
    return basePath;
  }
  
  // デフォルトパス
  switch (env) {
    case 'production':
      return path.join(__dirname, '../../../../data/production.sqlite');
    case 'development':
      return path.join(__dirname, '../../../../data/development.sqlite');
    case 'test':
      return ':memory:'; // テスト時はメモリ内DB
    default:
      return path.join(__dirname, '../../../../data/development.sqlite');
  }
}

// Vercel環境でのメモリ内DB設定
if (process.env.VERCEL) {
  console.log('🌐 Vercel環境でメモリ内DBを使用');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false, // Vercelではログを抑制
    pool: {
      max: 1,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else if (process.env.POSTGRES_URL) {
  // Vercel Postgres設定（オプション）
  sequelize = new Sequelize(process.env.POSTGRES_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: (msg) => logger.debug(msg)
  });
} else {
  // SQLite設定（デフォルト）
  const dbPath = getDatabasePath();
  console.log(`📁 Using SQLite database: ${dbPath}`);
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: process.env.NODE_ENV === 'development' ? console.log : false, // 本番ではログを無効化
    pool: {
      max: 1,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

module.exports = { sequelize };