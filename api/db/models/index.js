// モデルのエクスポート
const Application = require('./Application');
const User = require('./User');

// アソシエーション（関連）の定義
// 例: 申請書は作成者（ユーザー）を持つ
Application.belongsTo(User, { 
  as: 'createdBy',
  foreignKey: 'createdById',
  allowNull: true
});

User.hasMany(Application, {
  as: 'applications',
  foreignKey: 'createdById'
});

module.exports = {
  Application,
  User
};