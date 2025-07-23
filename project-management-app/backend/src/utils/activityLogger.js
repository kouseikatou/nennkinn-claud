const { Activity } = require('../models');

const createActivity = async (activityData, transaction = null) => {
  const options = transaction ? { transaction } : {};
  
  return await Activity.create({
    applicationId: activityData.applicationId || null,
    userId: activityData.userId,
    activityType: activityData.activityType,
    description: activityData.description,
    metadata: activityData.metadata || null,
    ipAddress: activityData.ipAddress || null,
    userAgent: activityData.userAgent || null
  }, options);
};

module.exports = {
  createActivity
};