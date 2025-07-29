const express = require('express');
const { body, validationResult } = require('express-validator');
const { Survey, Application } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// アンケートデータの保存/更新
router.post('/:applicationId/:surveyType', [
  body('data').isObject().withMessage('データはオブジェクト形式である必要があります'),
  body('status').optional().isIn(['draft', 'completed', 'submitted']).withMessage('無効なステータスです')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'バリデーションエラー',
        details: errors.array()
      });
    }

    const { applicationId, surveyType } = req.params;
    const { data, status = 'draft' } = req.body;

    // 申請が存在するかチェック
    const application = await Application.findByPk(applicationId);
    if (!application) {
      return res.status(404).json({
        error: '申請が見つかりません'
      });
    }

    // アンケートタイプの検証
    const validSurveyTypes = ['basic', 'pre_application', 'injury'];
    if (!validSurveyTypes.includes(surveyType)) {
      return res.status(400).json({
        error: '無効なアンケートタイプです'
      });
    }

    // アンケートデータを保存または更新
    const [survey, created] = await Survey.findOrCreate({
      where: {
        applicationId: applicationId,
        surveyType: surveyType
      },
      defaults: {
        applicationId: applicationId,
        surveyType: surveyType,
        [`${getSurveyDataField(surveyType)}`]: data,
        status: status,
        completedAt: status === 'completed' ? new Date() : null,
        submittedAt: status === 'submitted' ? new Date() : null
      }
    });

    if (!created) {
      // 既存のアンケートを更新
      const updateData = {
        [`${getSurveyDataField(surveyType)}`]: data,
        status: status
      };

      if (status === 'completed' && survey.status !== 'completed') {
        updateData.completedAt = new Date();
      }
      if (status === 'submitted' && survey.status !== 'submitted') {
        updateData.submittedAt = new Date();
      }

      await survey.update(updateData);
    }

    logger.info(`Survey ${surveyType} for application ${applicationId} ${created ? 'created' : 'updated'}`);

    res.status(created ? 201 : 200).json({
      message: `アンケートが${created ? '作成' : '更新'}されました`,
      survey: survey
    });

  } catch (error) {
    logger.error('Survey save error:', error);
    res.status(500).json({
      error: 'アンケートの保存中にエラーが発生しました',
      details: error.message
    });
  }
});

// アンケートデータの取得
router.get('/:applicationId/:surveyType', async (req, res) => {
  try {
    const { applicationId, surveyType } = req.params;

    const survey = await Survey.findOne({
      where: {
        applicationId: applicationId,
        surveyType: surveyType
      }
    });

    if (!survey) {
      return res.status(404).json({
        error: 'アンケートが見つかりません'
      });
    }

    res.json({
      survey: survey
    });

  } catch (error) {
    logger.error('Survey fetch error:', error);
    res.status(500).json({
      error: 'アンケートの取得中にエラーが発生しました',
      details: error.message
    });
  }
});

// 申請に関連するすべてのアンケートの取得
router.get('/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;

    const surveys = await Survey.findAll({
      where: {
        applicationId: applicationId
      },
      order: [['createdAt', 'ASC']]
    });

    res.json({
      surveys: surveys
    });

  } catch (error) {
    logger.error('Surveys fetch error:', error);
    res.status(500).json({
      error: 'アンケートの取得中にエラーが発生しました',
      details: error.message
    });
  }
});

// アンケートの削除
router.delete('/:applicationId/:surveyType', async (req, res) => {
  try {
    const { applicationId, surveyType } = req.params;

    const deleted = await Survey.destroy({
      where: {
        applicationId: applicationId,
        surveyType: surveyType
      }
    });

    if (deleted === 0) {
      return res.status(404).json({
        error: 'アンケートが見つかりません'
      });
    }

    logger.info(`Survey ${surveyType} for application ${applicationId} deleted`);

    res.json({
      message: 'アンケートが削除されました'
    });

  } catch (error) {
    logger.error('Survey delete error:', error);
    res.status(500).json({
      error: 'アンケートの削除中にエラーが発生しました',
      details: error.message
    });
  }
});

// ヘルパー関数：アンケートタイプに応じたデータフィールドを返す
function getSurveyDataField(surveyType) {
  const fieldMap = {
    'basic': 'basicInfo',
    'pre_application': 'preApplicationInfo',
    'injury': 'injuryInfo'
  };
  return fieldMap[surveyType] || 'basicInfo';
}

module.exports = router;