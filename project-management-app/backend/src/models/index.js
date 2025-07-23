const { sequelize } = require('../config/database');
const User = require('./User');
const Application = require('./Application');
const Document = require('./Document');
const Activity = require('./Activity');
const Comment = require('./Comment');

// User associations
User.hasMany(Application, { as: 'createdApplications', foreignKey: 'createdById' });
User.hasMany(Application, { as: 'assignedApplications', foreignKey: 'assignedToId' });
User.hasMany(Activity, { foreignKey: 'userId' });
User.hasMany(Comment, { foreignKey: 'userId' });
User.hasMany(Document, { as: 'uploadedDocuments', foreignKey: 'uploadedById' });
User.hasMany(Document, { as: 'verifiedDocuments', foreignKey: 'verifiedById' });

// Application associations
Application.belongsTo(User, { as: 'creator', foreignKey: 'createdById' });
Application.belongsTo(User, { as: 'assignee', foreignKey: 'assignedToId' });
Application.belongsTo(User, { as: 'lastUpdater', foreignKey: 'lastUpdatedById' });
Application.hasMany(Document, { foreignKey: 'applicationId' });
Application.hasMany(Activity, { foreignKey: 'applicationId' });
Application.hasMany(Comment, { foreignKey: 'applicationId' });

// Document associations
Document.belongsTo(Application, { foreignKey: 'applicationId' });
Document.belongsTo(User, { as: 'uploader', foreignKey: 'uploadedById' });
Document.belongsTo(User, { as: 'verifier', foreignKey: 'verifiedById' });

// Activity associations
Activity.belongsTo(User, { foreignKey: 'userId' });
Activity.belongsTo(Application, { foreignKey: 'applicationId' });

// Comment associations
Comment.belongsTo(Application, { foreignKey: 'applicationId' });
Comment.belongsTo(User, { foreignKey: 'userId' });
Comment.belongsTo(Comment, { as: 'parent', foreignKey: 'parentId' });
Comment.hasMany(Comment, { as: 'replies', foreignKey: 'parentId' });

module.exports = {
  sequelize,
  User,
  Application,
  Document,
  Activity,
  Comment
};