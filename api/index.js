// Vercel Functions メインエントリーポイント - MySQL版
const { sequelize, testConnection } = require('./db/config');
const { Application, User } = require('./db/models');
const initDatabase = require('./db/init');
const jwt = require('jsonwebtoken');

// JWT秘密鍵（本番環境では環境変数に設定）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// データベース初期化（初回のみ）
let dbInitialized = false;
const ensureDatabase = async () => {
  if (!dbInitialized) {
    const connected = await testConnection();
    if (connected) {
      await initDatabase();
      dbInitialized = true;
    }
  }
};

// CORSヘッダーの設定
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Test-Mode');
};

// リクエストボディをパースする関数
const parseBody = async (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (body.trim() === '') {
          resolve({});
        } else {
          resolve(JSON.parse(body));
        }
      } catch (e) {
        console.error('JSON parse error:', e.message);
        resolve({});
      }
    });
    req.on('error', (err) => {
      console.error('Request error:', err);
      resolve({});
    });
  });
};

// JWTトークンの生成
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// JWTトークンの検証
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// 認証ミドルウェア
const authenticate = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return null;
  }

  try {
    const user = await User.findByPk(decoded.id);
    return user && user.isActive ? user : null;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
};

module.exports = async (req, res) => {
  // データベース初期化を確認
  await ensureDatabase();

  // CORSヘッダーを設定
  setCorsHeaders(res);

  // OPTIONSリクエスト（プリフライト）の処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;
  let path, query;
  
  try {
    const urlObj = new URL(url, `http://${req.headers.host || 'localhost'}`);
    path = urlObj.pathname;
    query = Object.fromEntries(urlObj.searchParams);
  } catch (e) {
    path = url.split('?')[0];
    query = {};
  }
  
  req.query = query;

  // POSTやPUTリクエストの場合、ボディをパース
  if (method === 'POST' || method === 'PUT') {
    req.body = await parseBody(req);
  }

  try {
    console.log(`[${new Date().toISOString()}] ${method} ${path}`);
    
    // ルーティング
    
    // 認証エンドポイント
    if (path === '/api/auth/login' && method === 'POST') {
      const { email, password } = req.body || {};
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await User.findOne({ where: { email } });
      
      if (user && await user.validatePassword(password)) {
        // ログイン時刻を更新
        await user.update({ lastLoginAt: new Date() });
        
        const token = generateToken(user);
        return res.status(200).json({
          token,
          user: user.toJSON()
        });
      }
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 現在のユーザー情報取得
    if (path === '/api/auth/me' && method === 'GET') {
      const user = await authenticate(req);
      if (user) {
        return res.status(200).json(user.toJSON());
      }
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 申請書一覧取得
    if (path === '/api/applications' && method === 'GET') {
      const { page = 1, limit = 20, status, search, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
      
      const where = {};
      
      // ステータスフィルター
      if (status) {
        where.status = status;
      }

      // 検索フィルター
      if (search) {
        const { Op } = require('sequelize');
        // PostgreSQLではILIKEを使用（大文字小文字を区別しない）
        where[Op.or] = [
          { applicantName: { [Op.iLike]: `%${search}%` } },
          { applicationNumber: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const { count, rows } = await Application.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order: [[sortBy, sortOrder]],
        include: [{
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email']
        }]
      });

      return res.status(200).json({
        applications: rows,
        data: rows, // 後方互換性のため
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit))
      });
    }

    // 申請書作成
    if (path === '/api/applications' && method === 'POST') {
      const user = await authenticate(req);
      
      // 申請番号の生成
      const count = await Application.count();
      const applicationNumber = `APP${String(count + 1).padStart(6, '0')}`;
      
      const newApplication = await Application.create({
        ...req.body,
        applicationNumber,
        createdById: user ? user.id : null,
        status: req.body.status || 'draft'
      });

      return res.status(201).json(newApplication);
    }

    // 申請書詳細取得
    if (path.match(/^\/api\/applications\/\d+$/) && method === 'GET') {
      const id = parseInt(path.split('/').pop());
      const application = await Application.findByPk(id, {
        include: [{
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email']
        }]
      });
      
      if (application) {
        return res.status(200).json(application);
      }
      
      return res.status(404).json({ error: 'Application not found' });
    }

    // 申請書更新
    if (path.match(/^\/api\/applications\/\d+$/) && method === 'PUT') {
      const id = parseInt(path.split('/').pop());
      const application = await Application.findByPk(id);
      
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      await application.update(req.body);
      return res.status(200).json(application);
    }

    // 申請書削除
    if (path.match(/^\/api\/applications\/\d+$/) && method === 'DELETE') {
      const id = parseInt(path.split('/').pop());
      const application = await Application.findByPk(id);
      
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      await application.destroy();
      return res.status(200).json({ success: true });
    }

    // ステータス更新
    if (path.match(/^\/api\/applications\/\d+\/status$/) && method === 'POST') {
      const id = parseInt(path.split('/')[3]);
      const application = await Application.findByPk(id);
      
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const { status, reason } = req.body || {};
      const updateData = { status };
      
      if (reason) {
        updateData.rejectionReason = reason;
      }
      
      if (status === 'approved') {
        updateData.approvedAt = new Date();
      } else if (status === 'rejected') {
        updateData.rejectedAt = new Date();
      } else if (status === 'submitted') {
        updateData.submittedAt = new Date();
      }
      
      await application.update(updateData);
      return res.status(200).json(application);
    }

    // ヘルスチェック
    if (path === '/api/health' && method === 'GET') {
      const dbConnected = await testConnection();
      const applicationCount = dbConnected ? await Application.count() : 0;
      const userCount = dbConnected ? await User.count() : 0;
      
      return res.status(200).json({ 
        status: dbConnected ? 'ok' : 'db_error',
        database: dbConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        applicationsCount: applicationCount,
        usersCount: userCount
      });
    }

    // 404 Not Found
    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] API Error on ${method} ${path}:`, error);
    console.error('Stack trace:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};