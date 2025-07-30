// API エンドポイント定義
// UI用のRESTful API定義

module.exports = {
  // 申請書関連API
  applications: {
    // 一覧取得
    'GET /api/applications': {
      description: '申請書一覧を取得',
      params: {
        page: { type: 'number', default: 1 },
        limit: { type: 'number', default: 20 },
        status: { type: 'string', optional: true },
        search: { type: 'string', optional: true }
      },
      response: {
        data: 'Application[]',
        total: 'number',
        page: 'number',
        totalPages: 'number'
      }
    },

    // 詳細取得
    'GET /api/applications/:id': {
      description: '申請書詳細を取得',
      params: { id: 'number' },
      response: 'Application'
    },

    // 新規作成
    'POST /api/applications': {
      description: '新規申請書を作成',
      body: 'Application',
      response: 'Application'
    },

    // 更新
    'PUT /api/applications/:id': {
      description: '申請書を更新',
      params: { id: 'number' },
      body: 'Partial<Application>',
      response: 'Application'
    },

    // 削除
    'DELETE /api/applications/:id': {
      description: '申請書を削除',
      params: { id: 'number' },
      response: { success: 'boolean' }
    },

    // ステータス更新
    'POST /api/applications/:id/status': {
      description: '申請書のステータスを更新',
      params: { id: 'number' },
      body: { 
        status: 'ApplicationStatus',
        reason: 'string?'
      },
      response: 'Application'
    }
  },

  // 家族構成員API
  familyMembers: {
    'GET /api/applications/:applicationId/family-members': {
      description: '家族構成員一覧を取得',
      params: { applicationId: 'number' },
      response: 'FamilyMember[]'
    },

    'POST /api/applications/:applicationId/family-members': {
      description: '家族構成員を追加',
      params: { applicationId: 'number' },
      body: 'FamilyMember',
      response: 'FamilyMember'
    },

    'PUT /api/family-members/:id': {
      description: '家族構成員を更新',
      params: { id: 'number' },
      body: 'Partial<FamilyMember>',
      response: 'FamilyMember'
    },

    'DELETE /api/family-members/:id': {
      description: '家族構成員を削除',
      params: { id: 'number' },
      response: { success: 'boolean' }
    }
  },

  // 調査API
  surveys: {
    'GET /api/applications/:applicationId/surveys': {
      description: '調査一覧を取得',
      params: { applicationId: 'number' },
      response: 'Survey[]'
    },

    'POST /api/applications/:applicationId/surveys': {
      description: '調査を作成',
      params: { applicationId: 'number' },
      body: 'Survey',
      response: 'Survey'
    },

    'PUT /api/surveys/:id': {
      description: '調査を更新',
      params: { id: 'number' },
      body: 'Partial<Survey>',
      response: 'Survey'
    }
  },

  // コメントAPI
  comments: {
    'GET /api/applications/:applicationId/comments': {
      description: 'コメント一覧を取得',
      params: { applicationId: 'number' },
      response: 'Comment[]'
    },

    'POST /api/applications/:applicationId/comments': {
      description: 'コメントを追加',
      params: { applicationId: 'number' },
      body: { content: 'string', isInternal: 'boolean?' },
      response: 'Comment'
    }
  },

  // ドキュメントAPI
  documents: {
    'GET /api/applications/:applicationId/documents': {
      description: 'ドキュメント一覧を取得',
      params: { applicationId: 'number' },
      response: 'Document[]'
    },

    'POST /api/applications/:applicationId/documents': {
      description: 'ドキュメントをアップロード',
      params: { applicationId: 'number' },
      body: 'FormData',
      response: 'Document'
    },

    'DELETE /api/documents/:id': {
      description: 'ドキュメントを削除',
      params: { id: 'number' },
      response: { success: 'boolean' }
    }
  },

  // ユーザーAPI
  users: {
    'GET /api/users': {
      description: 'ユーザー一覧を取得',
      response: 'User[]'
    },

    'GET /api/users/:id': {
      description: 'ユーザー詳細を取得',
      params: { id: 'number' },
      response: 'User'
    },

    'POST /api/users': {
      description: 'ユーザーを作成',
      body: 'User',
      response: 'User'
    },

    'PUT /api/users/:id': {
      description: 'ユーザーを更新',
      params: { id: 'number' },
      body: 'Partial<User>',
      response: 'User'
    }
  },

  // 認証API
  auth: {
    'POST /api/auth/login': {
      description: 'ログイン',
      body: { email: 'string', password: 'string' },
      response: { token: 'string', user: 'User' }
    },

    'POST /api/auth/logout': {
      description: 'ログアウト',
      response: { success: 'boolean' }
    },

    'GET /api/auth/me': {
      description: '現在のユーザー情報を取得',
      response: 'User'
    }
  }
};