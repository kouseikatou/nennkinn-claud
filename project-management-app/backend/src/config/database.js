const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

let sequelize;

// Vercel Postgres環境変数を検出
if (process.env.POSTGRES_URL) {
  // Vercel Postgres設定
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
} else if (process.env.DB_DIALECT === 'sqlite') {
  // SQLite設定 (開発用)
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: (msg) => logger.debug(msg)
  });
} else {
  // MySQL設定 (本番用)
  sequelize = new Sequelize(
    process.env.DB_NAME || 'disability_pension_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: (msg) => logger.debug(msg),
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      timezone: '+09:00' // Japan timezone
    }
  );
}

module.exports = { sequelize };