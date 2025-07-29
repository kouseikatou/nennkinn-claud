const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// セキュリティミドルウェア
app.use(helmet({
  contentSecurityPolicy: false // HTMLファイルでインラインスクリプトを使用するため
}));
app.use(compression());
app.use(cors());

// JSONパーシング
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静的ファイルの提供
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/images', express.static(path.join(__dirname, '../images')));

// HTMLファイルの提供
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/projects.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../projects.html'));
});

app.get('/project-unified.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../project-unified.html'));
});

// APIルートの設定
app.use('/api/applications', require('./backend/src/routes/application.routes'));

// データベース接続の初期化
const { sequelize } = require('./backend/src/models');

// アプリケーション開始
async function startApp() {
  try {
    // データベース接続テスト
    await sequelize.authenticate();
    console.log('✅ データベース接続成功');
    
    // テーブルの同期
    await sequelize.sync();
    console.log('✅ データベーステーブル同期完了');
    
    app.listen(PORT, () => {
      console.log(`🚀 サーバーがポート${PORT}で起動しました`);
      console.log(`📱 アプリケーション: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ サーバー起動エラー:', error);
    process.exit(1);
  }
}

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'サーバーエラーが発生しました',
    message: process.env.NODE_ENV === 'development' ? err.message : '内部エラー'
  });
});

// 404ハンドリング
app.use((req, res) => {
  res.status(404).json({ error: 'ページが見つかりません' });
});

startApp();