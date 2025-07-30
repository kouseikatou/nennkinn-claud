// Vercel Functions メインエントリーポイント
// シンプルなモックAPIサーバー

// インメモリデータストア（データベースの代わり）
let applications = [];
let users = [
  {
    id: 1,
    email: 'admin@example.com',
    password: 'admin123', // 実際の環境ではハッシュ化が必要
    name: '管理者',
    role: 'admin',
    isActive: true
  }
];
let nextApplicationId = 1;
let nextUserId = 2;

// 初期データの作成（開発用）
if (applications.length === 0) {
  applications = [
    {
      id: nextApplicationId++,
      applicationNumber: 'APP000001',
      applicantName: '山田太郎',
      applicantNameKana: 'ヤマダタロウ',
      birthDate: '1960-04-15',
      gender: 'male',
      phoneNumber: '090-1234-5678',
      email: 'yamada@example.com',
      address: '東京都千代田区霞が関1-2-3',
      postalCode: '100-0013',
      basicPensionNumber: '1234-567890',
      status: 'submitted',
      submittedAt: '2024-01-15T10:00:00Z',
      createdAt: '2024-01-14T09:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: nextApplicationId++,
      applicationNumber: 'APP000002',
      applicantName: '鈴木花子',
      applicantNameKana: 'スズキハナコ',
      birthDate: '1958-08-22',
      gender: 'female',
      phoneNumber: '090-9876-5432',
      email: 'suzuki@example.com',
      address: '大阪府大阪市中央区本町4-5-6',
      postalCode: '541-0053',
      basicPensionNumber: '9876-543210',
      status: 'under_review',
      submittedAt: '2024-01-10T14:30:00Z',
      createdAt: '2024-01-10T13:00:00Z',
      updatedAt: '2024-01-16T09:00:00Z'
    },
    {
      id: nextApplicationId++,
      applicationNumber: 'APP000003',
      applicantName: '佐藤次郎',
      applicantNameKana: 'サトウジロウ',
      birthDate: '1962-12-01',
      gender: 'male',
      phoneNumber: '080-1111-2222',
      address: '愛知県名古屋市中村区名駅3-4-5',
      postalCode: '450-0002',
      status: 'draft',
      createdAt: '2024-01-18T15:00:00Z',
      updatedAt: '2024-01-18T15:00:00Z'
    }
  ];
}

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

module.exports = async (req, res) => {
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
    // URLパースに失敗した場合のフォールバック
    path = url.split('?')[0];
    query = {};
  }
  
  req.query = query;

  // POSTやPUTリクエストの場合、ボディをパース
  if (method === 'POST' || method === 'PUT') {
    req.body = await parseBody(req);
  }

  try {
    // ルーティング
    
    // 認証エンドポイント
    if (path === '/api/auth/login' && method === 'POST') {
      const { email, password } = req.body || {};
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
        return res.status(200).json({
          token,
          user: { ...user, password: undefined }
        });
      }
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 申請書一覧取得
    if (path === '/api/applications' && method === 'GET') {
      const { page = 1, limit = 20, status, search } = req.query;
      let filteredApplications = [...applications];

      // ステータスフィルター
      if (status) {
        filteredApplications = filteredApplications.filter(app => app.status === status);
      }

      // 検索フィルター
      if (search) {
        filteredApplications = filteredApplications.filter(app => 
          app.applicantName.includes(search) || 
          app.applicationNumber.includes(search)
        );
      }

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedApplications = filteredApplications.slice(startIndex, endIndex);

      return res.status(200).json({
        data: paginatedApplications,
        total: filteredApplications.length,
        page: parseInt(page),
        totalPages: Math.ceil(filteredApplications.length / limit)
      });
    }

    // 申請書作成
    if (path === '/api/applications' && method === 'POST') {
      const newApplication = {
        id: nextApplicationId++,
        applicationNumber: `APP${String(nextApplicationId).padStart(6, '0')}`,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...req.body
      };

      applications.push(newApplication);
      return res.status(201).json(newApplication);
    }

    // 申請書詳細取得
    if (path.match(/^\/api\/applications\/\d+$/) && method === 'GET') {
      const pathParts = path.split('/');
      const id = parseInt(pathParts[pathParts.length - 1]);
      const application = applications.find(app => app.id === id);
      
      if (application) {
        return res.status(200).json(application);
      }
      
      return res.status(404).json({ error: 'Application not found' });
    }

    // 申請書更新
    if (path.match(/^\/api\/applications\/\d+$/) && method === 'PUT') {
      const pathParts = path.split('/');
      const id = parseInt(pathParts[pathParts.length - 1]);
      const index = applications.findIndex(app => app.id === id);
      
      if (index !== -1) {
        applications[index] = {
          ...applications[index],
          ...req.body,
          id, // IDは変更不可
          updatedAt: new Date().toISOString()
        };
        return res.status(200).json(applications[index]);
      }
      
      return res.status(404).json({ error: 'Application not found' });
    }

    // 申請書削除
    if (path.match(/^\/api\/applications\/\d+$/) && method === 'DELETE') {
      const pathParts = path.split('/');
      const id = parseInt(pathParts[pathParts.length - 1]);
      const index = applications.findIndex(app => app.id === id);
      
      if (index !== -1) {
        applications.splice(index, 1);
        return res.status(200).json({ success: true });
      }
      
      return res.status(404).json({ error: 'Application not found' });
    }

    // ステータス更新
    if (path.match(/^\/api\/applications\/\d+\/status$/) && method === 'POST') {
      const pathParts = path.split('/');
      const id = parseInt(pathParts[pathParts.length - 2]); // "status"の前の部分
      const index = applications.findIndex(app => app.id === id);
      
      if (index !== -1) {
        const { status, reason } = req.body || {};
        applications[index] = {
          ...applications[index],
          status,
          rejectionReason: reason,
          updatedAt: new Date().toISOString()
        };
        
        if (status === 'approved') {
          applications[index].approvedAt = new Date().toISOString();
        } else if (status === 'rejected') {
          applications[index].rejectedAt = new Date().toISOString();
        }
        
        return res.status(200).json(applications[index]);
      }
      
      return res.status(404).json({ error: 'Application not found' });
    }

    // 現在のユーザー情報取得
    if (path === '/api/auth/me' && method === 'GET') {
      // 簡易的な認証チェック（本番環境では適切な実装が必要）
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = Buffer.from(token, 'base64').toString();
          const userId = parseInt(decoded.split(':')[0]);
          const user = users.find(u => u.id === userId);
          
          if (user) {
            return res.status(200).json({ ...user, password: undefined });
          }
        } catch (e) {
          // トークンのデコードエラー
        }
      }
      
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // ヘルスチェック
    if (path === '/api/health' && method === 'GET') {
      return res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        applicationsCount: applications.length,
        usersCount: users.length
      });
    }

    // 404 Not Found
    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};