// Vercel Serverless Function for all surveys of an application
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
    const { applicationId } = req.query;
    
    // モックアンケートデータ（上記と同じデータ構造）
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
    const allSurveys = mockSurveyData[appId];
    
    // GET request - return all surveys for the application
    if (req.method === 'GET') {
      if (!allSurveys) {
        res.status(404).json({
          error: 'Application not found',
          message: `No surveys found for application ${applicationId}`,
          availableApplications: Object.keys(mockSurveyData)
        });
        return;
      }
      
      res.status(200).json({
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
    
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to process surveys request',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};