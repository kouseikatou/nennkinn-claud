module.exports = (req, res) => {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 最小限のテストレスポンス
  if (req.method === 'GET') {
    const { id } = req.query;
    
    if (id === '1') {
      return res.status(200).json({
        success: true,
        application: {
          id: 1,
          applicationNumber: 'APP-2024-0001',
          applicantName: '田中太郎',
          status: 'submitted'
        },
        debug: {
          receivedId: id,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return res.status(404).json({
        error: 'Application not found',
        receivedId: id
      });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
};