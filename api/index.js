const express = require('express');
const cors = require('cors');
const { sequelize, User, Application } = require('../project-management-app/backend/src/models');
const bcrypt = require('bcryptjs');

// Vercel用の軽量アプリケーション
const app = express();

// ミドルウェア
app.use(cors());
app.use(express.json());

// グローバル初期化フラグ
let isInitialized = false;

// データベース初期化関数
async function initializeDatabase() {
  if (isInitialized) return;
  
  try {
    // SQLiteメモリDBを強制設定
    process.env.DB_STORAGE = ':memory:';
    
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
    await Application.create({
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
    
    isInitialized = true;
    console.log('DB initialized successfully');
  } catch (error) {
    console.error('DB initialization failed:', error);
    throw error;
  }
}

// ルート定義
app.get('/health', async (req, res) => {
  try {
    await initializeDatabase();
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Health check failed', details: error.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    await initializeDatabase();
    const { email, password } = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // 簡易JWT（実際の環境では適切なJWTライブラリを使用）
    const token = Buffer.from(JSON.stringify({ id: user.id, email: user.email })).toString('base64');
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

app.get('/applications', async (req, res) => {
  try {
    await initializeDatabase();
    const { limit = 20 } = req.query;
    
    const applications = await Application.findAll({
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ applications });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications', details: error.message });
  }
});

// 404ハンドラー
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// エラーハンドラー
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

module.exports = app;