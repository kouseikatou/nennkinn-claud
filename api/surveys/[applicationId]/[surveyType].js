// Vercel Serverless Function for survey data access
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
    const { applicationId, surveyType } = req.query;
    
    // モックアンケートデータ（実際の環境では適切なデータソースから取得）
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
        },
        pre_application: {
          applicationId: 2,
          surveyType: 'pre_application',
          data: {
            previousApplications: 'no',
            consultationHistory: 'no',
            documentPreparation: 'not_started',
            expectedDifficulties: ['medical_records'],
            preferredContactMethod: 'phone'
          },
          status: 'in_progress',
          lastUpdated: '2024-01-16T15:00:00.000Z'
        },
        injury: {
          applicationId: 2,
          surveyType: 'injury',
          data: {
            injuryDate: '2021-03-15',
            injuryCause: 'traffic_accident',
            initialSymptoms: ['leg_pain', 'mobility_limitation'],
            progressionTimeline: {
              '2021-03': '交通事故発生',
              '2021-03': '救急搬送・手術',
              '2021-06': 'リハビリ開始',
              '2021-12': '症状固定'
            },
            currentLimitations: ['walking', 'standing', 'climbing_stairs'],
            treatmentHistory: [
              {
                period: '2021-03 - 2021-12',
                treatment: '整形外科・リハビリ',
                provider: '渋谷総合病院'
              }
            ]
          },
          status: 'completed',
          completedAt: '2024-01-16T16:00:00.000Z'
        }
      }
    };
    
    const appId = parseInt(applicationId);
    const surveyData = mockSurveyData[appId]?.[surveyType];
    
    // GET request - return survey data
    if (req.method === 'GET') {
      if (!surveyData) {
        res.status(404).json({
          error: 'Survey not found',
          message: `Survey of type '${surveyType}' for application ${applicationId} does not exist`,
          availableTypes: mockSurveyData[appId] ? Object.keys(mockSurveyData[appId]) : [],
          availableApplications: Object.keys(mockSurveyData)
        });
        return;
      }
      
      res.status(200).json({
        survey: surveyData,
        meta: {
          environment: 'vercel-serverless',
          mock: true,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // POST request - create/save survey data
    else if (req.method === 'POST') {
      const { data, status = 'draft' } = req.body;
      
      const newSurvey = {
        applicationId: appId,
        surveyType: surveyType,
        data: data,
        status: status,
        lastUpdated: new Date().toISOString()
      };
      
      if (status === 'completed') {
        newSurvey.completedAt = new Date().toISOString();
      }
      
      res.status(201).json({
        survey: newSurvey,
        message: 'Survey saved successfully (mock)',
        meta: {
          environment: 'vercel-serverless',
          mock: true,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // PUT request - update survey data
    else if (req.method === 'PUT') {
      if (!surveyData) {
        res.status(404).json({
          error: 'Survey not found',
          message: `Cannot update non-existent survey '${surveyType}' for application ${applicationId}`
        });
        return;
      }
      
      const updates = req.body;
      const updatedSurvey = {
        ...surveyData,
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      
      if (updates.status === 'completed') {
        updatedSurvey.completedAt = new Date().toISOString();
      }
      
      res.status(200).json({
        survey: updatedSurvey,
        message: 'Survey updated successfully (mock)',
        meta: {
          environment: 'vercel-serverless',
          mock: true,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // DELETE request - delete survey
    else if (req.method === 'DELETE') {
      if (!surveyData) {
        res.status(404).json({
          error: 'Survey not found',
          message: `Cannot delete non-existent survey '${surveyType}' for application ${applicationId}`
        });
        return;
      }
      
      res.status(200).json({
        message: `Survey '${surveyType}' for application ${applicationId} deleted successfully (mock)`,
        deletedSurvey: surveyData,
        meta: {
          environment: 'vercel-serverless',
          mock: true,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to process survey request',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};