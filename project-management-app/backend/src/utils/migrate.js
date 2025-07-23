const { sequelize } = require('../models');
const logger = require('./logger');

const migrate = async () => {
  try {
    logger.info('Starting database migration...');
    
    // Sync all models
    await sequelize.sync({ force: false, alter: true });
    
    logger.info('Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();