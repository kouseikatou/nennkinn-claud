// Vercel Serverless Function for survey data
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
    // クエリパラメータから情報を取得
    const { applicationId, surveyType } = req.query;
    
    console.log('Survey request - applicationId:', applicationId, 'surveyType:', surveyType);
    
    // モックアンケートデータ
    const mockSurveyData = {
      1: {
        basic: {
          applicationId: 1,
          surveyType: 'basic',
          data: {
            livingArrangement: 'alone',
            needsAssistance: 'yes',
            assistanceType: ['daily_care', 'mobility'],
            familySupport: 'limited',
            emergencyContact: {
              name: '田中花子',
              relationship: '姉',
              phone: '090-9876-5432'
            }
          },
          status: 'completed',
          completedAt: '2024-01-15T11:00:00.000Z'
        },
        pre_application: {
          applicationId: 1,
          surveyType: 'pre_application',
          data: {
            previousApplications: 'no',
            consultationHistory: 'yes',
            consultationDetails: '社会保険労務士に相談済み',
            documentPreparation: 'in_progress',
            expectedDifficulties: ['medical_records', 'employment_history'],
            preferredContactMethod: 'email'
          },
          status: 'completed',
          completedAt: '2024-01-15T12:00:00.000Z'
        },
        injury: {
          applicationId: 1,
          surveyType: 'injury',
          data: {
            injuryDate: '2020-06-01',
            injuryCause: 'work_stress',
            initialSymptoms: ['depression', 'anxiety', 'sleep_disorder'],
            progressionTimeline: {
              '2020-06': '初期症状出現',
              '2020-07': '医療機関受診開始',
              '2020-09': '休職開始',
              '2021-01': '症状固定診断'
            },
            currentLimitations: ['concentration', 'social_interaction', 'sustained_work'],
            treatmentHistory: [
              {
                period: '2020-07 - 現在',
                treatment: '心療内科通院',
                provider: '東京医療センター'
              }
            ]
          },
          status: 'completed',
          completedAt: '2024-01-15T13:00:00.000Z'
        }
      },
      2: {
        basic: {
          applicationId: 2,
          surveyType: 'basic',
          data: {
            livingArrangement: 'with_family',
            needsAssistance: 'yes',
            assistanceType: ['mobility', 'transportation'],
            familySupport: 'strong',
            emergencyContact: {
              name: '鈴木一郎',
              relationship: '配偶者',
              phone: '080-1111-2222'
            }
          },
          status: 'draft',
          lastUpdated: '2024-01-16T14:30:00.000Z'
        }
      }
    };
    
    const appId = parseInt(applicationId);
    
    // 特定のsurveyTypeが指定されている場合
    if (surveyType) {
      const surveyData = mockSurveyData[appId]?.[surveyType];
      
      if (!surveyData) {
        return res.status(404).json({
          error: 'Survey not found',
          message: `Survey of type '${surveyType}' for application ${applicationId} does not exist`,
          availableTypes: mockSurveyData[appId] ? Object.keys(mockSurveyData[appId]) : [],
          availableApplications: Object.keys(mockSurveyData)
        });
      }
      
      // GET - 特定のsurvey取得
      if (req.method === 'GET') {
        return res.status(200).json({
          success: true,
          survey: surveyData,
          meta: {
            environment: 'vercel-serverless',
            mock: true,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // PUT/POST - survey更新/作成
      if (req.method === 'PUT' || req.method === 'POST') {
        const updatedSurvey = {
          ...surveyData,
          ...req.body,
          lastUpdated: new Date().toISOString()
        };
        
        return res.status(200).json({
          success: true,
          survey: updatedSurvey,
          message: 'Survey updated successfully (mock)',
          meta: {
            environment: 'vercel-serverless',
            mock: true,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
    
    // 全surveyデータ取得
    if (req.method === 'GET' && !surveyType) {
      const allSurveys = mockSurveyData[appId];
      
      if (!allSurveys) {
        return res.status(404).json({
          error: 'Application not found',
          message: `No surveys found for application ${applicationId}`,
          availableApplications: Object.keys(mockSurveyData)
        });
      }
      
      return res.status(200).json({
        success: true,
        applicationId: appId,
        surveys: allSurveys,
        surveyTypes: Object.keys(allSurveys),
        totalSurveys: Object.keys(allSurveys).length,
        meta: {
          environment: 'vercel-serverless',
          mock: true,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to process survey request',
      details: error.message
    });
  }
};