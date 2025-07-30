const fs = require('fs');
const path = require('path');

// Vercel環境での初期化用スクリプト
async function initVercelDatabase() {
  try {
    // ログを最小限に抑制
    
    // 本番環境でのメモリDBを使用
    process.env.NODE_ENV = 'production';
    process.env.DB_DIALECT = 'sqlite';
    process.env.DB_STORAGE = ':memory:'; // メモリ内DB
    
    const { sequelize, User, Application } = require('../project-management-app/backend/src/models');
    const bcrypt = require('bcryptjs');
    
    // データベース接続
    await sequelize.authenticate();
    // テーブル作成
    await sequelize.sync({ force: true });
    
    // 管理者ユーザー作成
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'システム管理者',
      email: 'admin@disability-pension.jp',
      password: adminPassword,
      role: 'admin',
      isActive: true
    });
    
    // サンプル申請データ作成
    const application = await Application.create({
      applicationNumber: 'APP-2024-0001',
      applicantName: '田中太郎',
      applicantNameKana: 'タナカタロウ',
      birthDate: '1985-03-15',
      gender: 'male',
      phoneNumber: '090-1234-5678',
      email: 'tanaka@example.com',
      address: '東京都新宿区西新宿1-1-1',
      postalCode: '160-0023',
      disabilityType: 'mental',
      disabilityGrade: 2,
      disabilityDescription: 'うつ病による精神障害',
      onsetDate: '2020-06-01',
      applicationType: 'new',
      status: 'submitted',
      hospitalName: '東京医療センター',
      doctorName: '山田医師',
      diagnosisDate: '2020-06-01',
      monthlyIncome: 200000,
      hasOtherPension: false,
      createdById: admin.id,
      assignedToId: admin.id,
      lastUpdatedById: admin.id
    });
    
    // 初期化完了
    
    return { admin, application };
    
  } catch (error) {
    // エラーのみログ出力
    console.error('Init error:', error.message);
    throw error;
  }
}

module.exports = initVercelDatabase;