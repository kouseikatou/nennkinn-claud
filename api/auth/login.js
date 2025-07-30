// Vercel Serverless Function
module.exports = (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    const { email, password } = req.body;
    
    // モック認証チェック
    if (email === 'admin@disability-pension.jp' && password === 'admin123') {
      // 簡易JWT（実際の環境では適切なJWTライブラリを使用）
      const token = Buffer.from(JSON.stringify({
        id: 1,
        email: 'admin@disability-pension.jp',
        role: 'admin',
        iat: Date.now()
      })).toString('base64');
      
      res.status(200).json({
        token,
        user: {
          id: 1,
          name: 'システム管理者',
          email: 'admin@disability-pension.jp',
          role: 'admin'
        },
        meta: {
          environment: 'vercel-serverless',
          mock: true,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Login failed',
      details: error.message
    });
  }
};