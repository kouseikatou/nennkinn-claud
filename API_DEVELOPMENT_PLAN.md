# 障害年金管理システム - API開発計画書

## 📋 概要
現在のフロントエンド（HTML/JavaScript）と連携するバックエンドAPIの詳細な開発計画です。

## 🏗️ システム構成

### アーキテクチャ選択肢

#### 🅰️ Option A: Cloud SQL + Cloud Run (推奨)
```
Frontend (HTML/JS)
    ↓
Cloud Load Balancer
    ↓ 
Cloud Run (Node.js/Express)
    ↓
Cloud SQL (PostgreSQL)
    ↓
Cloud Storage (Files)
```

#### 🅱️ Option B: Firestore + Cloud Run
```
Frontend (HTML/JS)
    ↓
Cloud Load Balancer
    ↓
Cloud Run (Node.js/Express) 
    ↓
Firestore (NoSQL)
    ↓
Cloud Storage (Files)
```

**推奨**: Option A - リレーショナルデータに適している

## 💾 データベース設計 (Cloud SQL - PostgreSQL)

### スキーマ設計

#### 1. applications テーブル
```sql
CREATE TABLE applications (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    furigana VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    pension_number VARCHAR(20) UNIQUE NOT NULL,
    postal_code VARCHAR(10),
    address TEXT NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    main_disease VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    survey_sent BOOLEAN DEFAULT FALSE,
    survey_completed BOOLEAN DEFAULT FALSE,
    survey_link_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at);
CREATE INDEX idx_applications_pension_number ON applications(pension_number);
```

#### 2. medical_history テーブル
```sql
CREATE TABLE medical_history (
    id SERIAL PRIMARY KEY,
    application_id VARCHAR(50) REFERENCES applications(id) ON DELETE CASCADE,
    hospital_name VARCHAR(200) NOT NULL,
    start_date VARCHAR(50) NOT NULL, -- 柔軟な日付形式に対応
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medical_history_application_id ON medical_history(application_id);
```

#### 3. progress_records テーブル
```sql
CREATE TABLE progress_records (
    id SERIAL PRIMARY KEY,
    application_id VARCHAR(50) REFERENCES applications(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    date VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_progress_application_id ON progress_records(application_id);
CREATE INDEX idx_progress_sort_order ON progress_records(application_id, sort_order);
```

#### 4. documents テーブル
```sql
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    application_id VARCHAR(50) REFERENCES applications(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'uploaded',
    file_url TEXT NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_size INTEGER,
    mime_type VARCHAR(100)
);

CREATE INDEX idx_documents_application_id ON documents(application_id);
CREATE INDEX idx_documents_type ON documents(type);
```

#### 5. comments テーブル
```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    application_id VARCHAR(50) REFERENCES applications(id) ON DELETE CASCADE,
    author_type VARCHAR(20) NOT NULL, -- 'reviewer', 'applicant', 'system'
    author_name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_application_id ON comments(application_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
```

#### 6. survey_links テーブル
```sql
CREATE TABLE survey_links (
    id VARCHAR(100) PRIMARY KEY,
    application_id VARCHAR(50) REFERENCES applications(id) ON DELETE CASCADE,
    applicant_name VARCHAR(100) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_survey_links_token ON survey_links(token);
CREATE INDEX idx_survey_links_expires_at ON survey_links(expires_at);
```

#### 7. users テーブル (管理者用)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'viewer', -- 'admin', 'reviewer', 'viewer'
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

#### 8. postal_codes テーブル (キャッシュ用)
```sql
CREATE TABLE postal_codes (
    postal_code VARCHAR(10) PRIMARY KEY,
    prefecture VARCHAR(20) NOT NULL,
    city VARCHAR(50) NOT NULL,
    town VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 バックエンド実装計画

### 技術スタック
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (Cloud SQL)
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer + Cloud Storage
- **Validation**: Joi
- **Documentation**: Swagger/OpenAPI

### ディレクトリ構成
```
backend/
├── src/
│   ├── controllers/         # API コントローラー
│   │   ├── applications.js
│   │   ├── surveys.js
│   │   ├── documents.js
│   │   └── utils.js
│   ├── models/             # データモデル
│   │   └── index.js
│   ├── middleware/         # ミドルウェア
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── routes/             # ルート定義
│   │   ├── applications.js
│   │   ├── surveys.js
│   │   └── index.js
│   ├── services/           # ビジネスロジック
│   │   ├── applicationService.js
│   │   ├── surveyService.js
│   │   ├── documentService.js
│   │   └── postalCodeService.js
│   ├── utils/              # ユーティリティ
│   │   ├── database.js
│   │   ├── storage.js
│   │   └── crypto.js
│   └── app.js              # アプリケーション起動
├── prisma/
│   ├── schema.prisma       # データベーススキーマ
│   └── migrations/         # マイグレーション
├── tests/                  # テスト
├── docs/                   # API ドキュメント
├── package.json
├── Dockerfile
└── cloudbuild.yaml
```

### 環境構成
```bash
# 本番環境
PROJECT_ID=pension-system-prod
DATABASE_URL=postgresql://user:pass@host:5432/pension_db
REDIS_URL=redis://redis-host:6379
STORAGE_BUCKET=pension-documents-prod
JWT_SECRET=super-secret-key
NODE_ENV=production

# ステージング環境  
PROJECT_ID=pension-system-staging
DATABASE_URL=postgresql://user:pass@host:5432/pension_db_staging
STORAGE_BUCKET=pension-documents-staging

# 開発環境
PROJECT_ID=pension-system-dev
DATABASE_URL=postgresql://user:pass@localhost:5432/pension_db_dev
STORAGE_BUCKET=pension-documents-dev
```

## 🧠 メモリ・パフォーマンス設計

### Redis キャッシュ戦略

#### 1. アプリケーション一覧キャッシュ
```javascript
// キー: applications:list:page:1:status:pending
// TTL: 5分
// データ: ページング済み申請一覧
```

#### 2. 申請詳細キャッシュ
```javascript
// キー: application:APP-2024-001
// TTL: 10分
// データ: 申請詳細情報（コメント・書類含む）
```

#### 3. 郵便番号キャッシュ
```javascript
// キー: postal:160-0022
// TTL: 24時間
// データ: 住所情報
```

#### 4. セッションキャッシュ
```javascript
// キー: session:user:123
// TTL: 2時間
// データ: ユーザーセッション情報
```

### Cloud Run メモリ設定
```yaml
# 本番環境
resources:
  limits:
    memory: 2Gi
    cpu: 2000m
  requests:
    memory: 512Mi
    cpu: 1000m

# 開発環境
resources:
  limits:
    memory: 1Gi
    cpu: 1000m
```

### データベース接続プール
```javascript
// Prisma 設定
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // 接続プール設定
  __internal: {
    engine: {
      config: {
        connectionLimit: 20,    // 最大接続数
        poolTimeout: 20000,     // タイムアウト20秒
        maxUses: 50000,         // 最大使用回数
      }
    }
  }
});
```

## 🔍 住所検索機能詳細設計

### 実装戦略

#### Phase 1: 外部API連携 (即座に実装可能)
```javascript
// 郵便番号検索API選択肢
const postalApiOptions = [
  {
    name: 'zipcloud',
    url: 'http://zipcloud.ibsnet.co.jp/api/search',
    free: true,
    rateLimit: '制限なし'
  },
  {
    name: 'HeartRails Geo API',
    url: 'http://geoapi.heartrails.com/api/json',
    free: true,
    rateLimit: 'moderate'
  }
];
```

#### Phase 2: データベースキャッシュ (最適化)
```javascript
// 検索フロー
async function searchPostalCode(postalCode) {
  // 1. ローカルキャッシュ確認
  let address = await redis.get(`postal:${postalCode}`);
  if (address) return JSON.parse(address);
  
  // 2. データベース確認
  address = await prisma.postal_codes.findUnique({
    where: { postal_code: postalCode }
  });
  if (address) {
    await redis.setex(`postal:${postalCode}`, 86400, JSON.stringify(address));
    return address;
  }
  
  // 3. 外部API呼び出し
  address = await fetchFromExternalAPI(postalCode);
  if (address) {
    // データベースに保存
    await prisma.postal_codes.create({ data: address });
    // キャッシュに保存
    await redis.setex(`postal:${postalCode}`, 86400, JSON.stringify(address));
  }
  
  return address;
}
```

#### API実装
```javascript
// GET /api/v1/postal-code/:postalCode
router.get('/postal-code/:postalCode', async (req, res) => {
  try {
    const { postalCode } = req.params;
    
    // バリデーション
    if (!/^\d{3}-?\d{4}$/.test(postalCode)) {
      return res.status(400).json({
        success: false,
        error: '郵便番号の形式が正しくありません'
      });
    }
    
    const normalizedCode = postalCode.replace('-', '');
    const address = await postalCodeService.search(normalizedCode);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        error: '該当する住所が見つかりません'
      });
    }
    
    res.json({
      success: true,
      data: {
        postalCode: postalCode,
        prefecture: address.prefecture,
        city: address.city,
        town: address.town
      }
    });
  } catch (error) {
    logger.error('Postal code search error:', error);
    res.status(500).json({
      success: false,
      error: 'サーバーエラーが発生しました'
    });
  }
});
```

## 📅 開発スケジュール

### Phase 1: 基盤構築 (2週間)
**Week 1**
- [ ] GCP プロジェクト設定
- [ ] Cloud SQL インスタンス作成
- [ ] データベーススキーマ設計・構築
- [ ] Node.js プロジェクト初期設定
- [ ] Prisma ORM セットアップ

**Week 2**  
- [ ] 基本的なAPI構造構築
- [ ] 認証ミドルウェア実装
- [ ] Cloud Storage 連携
- [ ] Cloud Run デプロイ設定

### Phase 2: 核心機能 (3週間)
**Week 3-4**
- [ ] 申請管理API (CRUD)
- [ ] アンケート機能API
- [ ] ファイルアップロード機能
- [ ] 郵便番号検索API

**Week 5**
- [ ] 進捗管理API
- [ ] コメント機能API
- [ ] データバリデーション強化
- [ ] エラーハンドリング

### Phase 3: 最適化・テスト (2週間)
**Week 6**
- [ ] Redis キャッシュ実装
- [ ] パフォーマンス最適化
- [ ] セキュリティ強化
- [ ] ログ・監視設定

**Week 7**
- [ ] 単体テスト作成
- [ ] 統合テスト実装
- [ ]負荷テスト実行
- [ ] ドキュメント整備

## 💰 コスト見積もり

### GCP リソース (月額概算)
```
Cloud SQL (db-standard-2):     ¥15,000
Cloud Run (2vCPU, 2GB):       ¥8,000
Cloud Storage (100GB):        ¥2,500
Cloud Load Balancer:          ¥2,000
Redis (Memorystore 1GB):      ¥5,000
監視・ログ:                    ¥3,000
--------------------------------------
合計:                         ¥35,500/月
```

### 開発リソース見積もり
```
バックエンド開発者: 7週間 × 40h = 280時間
インフラ設定: 1週間 × 20h = 20時間
テスト・品質保証: 2週間 × 30h = 60時間
--------------------------------------
合計: 360時間
```

## 🔒 セキュリティ対策

### 認証・認可
```javascript
// JWT認証ミドルウェア
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// 管理者権限チェック
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

### データ保護
- SQL インジェクション対策 (Prisma ORM使用)
- XSS対策 (入力サニタイゼーション)
- CSRF対策 (SameSite Cookieの使用)
- レート制限 (express-rate-limit)

### 監査ログ
```javascript
// すべてのAPI操作をログ記録
const auditLogger = (req, res, next) => {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  };
  
  console.log('API_AUDIT:', JSON.stringify(logData));
  next();
};
```

## 📊 監視・運用

### Cloud Monitoring メトリクス
- API応答時間
- エラー率
- データベース接続数
- メモリ使用量
- CPU使用率

### アラート設定
```yaml
# エラー率アラート
- condition: error_rate > 5%
  duration: 5m
  action: slack notification

# レスポンス時間アラート  
- condition: response_time > 2s
  duration: 3m
  action: email + slack

# データベース接続アラート
- condition: db_connections > 80%
  duration: 2m
  action: email + pager
```

## 🧪 テスト戦略

### テスト構成
```javascript
// Jest設定例
module.exports = {
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ]
};
```

### テストデータ管理
```javascript
// テスト用データベース
const testDb = {
  applications: [
    {
      id: 'TEST-001',
      full_name: 'テスト太郎',
      status: 'pending'
      // ...
    }
  ]
};
```

この開発計画により、現在のフロントエンドと連携する堅牢なバックエンドAPIを効率的に構築できます。特に住所検索機能とメモリ最適化に重点を置いた実装により、ユーザビリティとパフォーマンスの両立を実現します。