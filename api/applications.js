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
  
  try {
    // モック申請データ
    const mockApplications = [
      {
        id: 1,
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
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z'
      },
      {
        id: 2,
        applicationNumber: 'APP-2024-0002',
        applicantName: '鈴木花子',
        applicantNameKana: 'スズキハナコ',
        birthDate: '1990-07-22',
        gender: 'female',
        phoneNumber: '080-5678-1234',
        email: 'suzuki@example.com',
        address: '東京都渋谷区渋谷2-2-2',
        postalCode: '150-0002',
        disabilityType: 'physical',
        disabilityGrade: 3,
        disabilityDescription: '交通事故による下肢機能障害',
        onsetDate: '2021-03-15',
        applicationType: 'new',
        status: 'in_review',
        hospitalName: '渋谷総合病院',
        doctorName: '田中医師',
        diagnosisDate: '2021-03-20',
        monthlyIncome: 180000,
        hasOtherPension: false,
        createdAt: '2024-01-16T14:20:00.000Z',
        updatedAt: '2024-01-16T14:20:00.000Z'
      }
    ];
    
    const { limit = 20 } = req.query;
    const limitedApplications = mockApplications.slice(0, parseInt(limit));
    
    res.status(200).json({
      applications: limitedApplications,
      pagination: {
        total: mockApplications.length,
        page: 1,
        limit: parseInt(limit),
        pages: Math.ceil(mockApplications.length / parseInt(limit))
      },
      meta: {
        environment: 'vercel-serverless',
        mock: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch applications',
      details: error.message
    });
  }
};