# 障害年金管理システム - GCP API仕様書

## 概要
障害年金管理システムのバックエンドAPIをGoogle Cloud Platform (GCP) で構築するための仕様書です。

## アーキテクチャ構成

### GCPサービス構成
```
Frontend (HTML/JS) 
    ↓
Cloud Load Balancer
    ↓
Cloud Run (API Server)
    ↓
Cloud Firestore (Database)
    ↓
Cloud Storage (File Storage)
```

### 使用するGCPサービス
- **Cloud Run**: APIサーバーのホスティング
- **Cloud Firestore**: メインデータベース
- **Cloud Storage**: 書類ファイルの保存
- **Cloud Functions**: バッチ処理・通知処理
- **Cloud Scheduler**: 定期実行タスク
- **Cloud Logging**: ログ管理
- **Cloud Monitoring**: 監視・アラート

## データベース設計 (Cloud Firestore)

### コレクション構成

#### 1. applications (申請情報)
```json
{
  "id": "APP-2024-001",
  "applicantInfo": {
    "fullName": "田中太郎",
    "furigana": "タナカタロウ",
    "birthDate": "1979-03-15",
    "gender": "male",
    "pensionNumber": "1234-567890",
    "postalCode": "160-0022",
    "address": "東京都新宿区新宿1-2-3 マンション名101号室",
    "phoneNumber": "090-1234-5678",
    "email": "tanaka@example.com"
  },
  "medicalInfo": {
    "mainDisease": "うつ病",
    "medicalHistory": [
      {
        "hospitalName": "新宿病院",
        "startDate": "2023年5月頃"
      }
    ]
  },
  "status": "in_review", // pending, in_review, approved, rejected
  "progress": [
    {
      "id": "1",
      "title": "書類準備",
      "date": "2024/07/15",
      "status": "completed"
    }
  ],
  "documents": [
    {
      "id": "doc1",
      "name": "受診状況等証明書",
      "type": "initial_medical_certificate",
      "status": "uploaded",
      "uploadDate": "2024-07-15T10:30:00Z",
      "fileUrl": "gs://bucket/documents/APP-2024-001/doc1.pdf"
    }
  ],
  "surveyStatus": {
    "sent": false,
    "sentDate": null,
    "completed": false,
    "completedDate": null,
    "linkId": null
  },
  "createdAt": "2024-07-20T09:00:00Z",
  "updatedAt": "2024-07-27T14:30:00Z"
}
```

#### 2. survey_links (アンケートリンク)
```json
{
  "id": "survey_123456",
  "applicationId": "APP-2024-001",
  "applicantName": "田中太郎",
  "token": "encrypted_token_string",
  "expiresAt": "2024-08-27T23:59:59Z",
  "isUsed": false,
  "usedAt": null,
  "createdAt": "2024-07-27T15:00:00Z"
}
```

#### 3. comments (コメント・履歴)
```json
{
  "id": "comment_001",
  "applicationId": "APP-2024-001",
  "authorType": "reviewer", // reviewer, applicant, system
  "authorName": "審査担当者",
  "content": "追加書類の提出をお願いいたします。",
  "createdAt": "2024-07-25T10:15:00Z"
}
```

#### 4. users (ユーザー管理)
```json
{
  "id": "user_001",
  "email": "admin@example.com",
  "role": "admin", // admin, reviewer, viewer
  "displayName": "管理者",
  "createdAt": "2024-07-01T00:00:00Z",
  "lastLoginAt": "2024-07-27T08:00:00Z"
}
```

## API エンドポイント設計

### Base URL
```
https://your-project-id.run.app/api/v1
```

### 認証
- **方式**: JWT Bearer Token
- **ヘッダー**: `Authorization: Bearer <token>`

### エンドポイント一覧

#### 申請管理 API

##### 1. 申請一覧取得
```http
GET /applications
```
**Query Parameters:**
- `status`: string (optional) - 状態でフィルタ
- `limit`: number (optional) - 取得件数制限 (default: 20)
- `offset`: number (optional) - オフセット

**Response:**
```json
{
  "success": true,
  "data": {
    "applications": [...],
    "total": 42,
    "hasMore": true
  }
}
```

##### 2. 申請詳細取得
```http
GET /applications/{applicationId}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "application": {...},
    "comments": [...],
    "documents": [...]
  }
}
```

##### 3. 申請作成
```http
POST /applications
```
**Request Body:**
```json
{
  "applicantInfo": {...},
  "medicalInfo": {...}
}
```

##### 4. 申請更新
```http
PUT /applications/{applicationId}
```

##### 5. 申請削除
```http
DELETE /applications/{applicationId}
```

#### アンケート管理 API

##### 1. アンケートリンク生成
```http
POST /applications/{applicationId}/survey-link
```
**Response:**
```json
{
  "success": true,
  "data": {
    "linkId": "survey_123456",
    "url": "https://your-domain.com/survey-form.html?token=encrypted_token",
    "expiresAt": "2024-08-27T23:59:59Z"
  }
}
```

##### 2. アンケート情報取得
```http
GET /survey/{token}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "applicationId": "APP-2024-001",
    "applicantName": "田中太郎",
    "isExpired": false,
    "isUsed": false
  }
}
```

##### 3. アンケート回答送信
```http
POST /survey/{token}/submit
```
**Request Body:**
```json
{
  "applicantInfo": {...},
  "medicalInfo": {...}
}
```

#### 進捗管理 API

##### 1. 進捗追加
```http
POST /applications/{applicationId}/progress
```
**Request Body:**
```json
{
  "title": "審査開始",
  "date": "2024-07-27",
  "status": "in_progress"
}
```

##### 2. 進捗更新
```http
PUT /applications/{applicationId}/progress/{progressId}
```

##### 3. 進捗削除
```http
DELETE /applications/{applicationId}/progress/{progressId}
```

#### 書類管理 API

##### 1. 書類アップロード
```http
POST /applications/{applicationId}/documents
```
**Content-Type**: `multipart/form-data`
**Request Body:**
- `file`: File
- `name`: string
- `type`: string

##### 2. 書類一覧取得
```http
GET /applications/{applicationId}/documents
```

##### 3. 書類削除
```http
DELETE /applications/{applicationId}/documents/{documentId}
```

#### コメント管理 API

##### 1. コメント追加
```http
POST /applications/{applicationId}/comments
```
**Request Body:**
```json
{
  "content": "コメント内容"
}
```

##### 2. コメント一覧取得
```http
GET /applications/{applicationId}/comments
```

#### 郵便番号検索 API

##### 1. 住所検索
```http
GET /postal-code/{postalCode}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "postalCode": "160-0022",
    "prefecture": "東京都",
    "city": "新宿区",
    "town": "新宿"
  }
}
```

## セキュリティ要件

### 認証・認可
- **管理者認証**: Google Identity Platform
- **アンケート認証**: 時限付きトークン
- **API認証**: JWT Bearer Token

### データ保護
- **暗号化**: 保存時・転送時の暗号化
- **アクセス制御**: IAMによる細かい権限管理
- **監査ログ**: すべてのAPI操作をCloud Loggingに記録

### セキュリティヘッダー
```http
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

## エラーハンドリング

### エラーレスポンス形式
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "リクエストが無効です",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### エラーコード一覧
- `INVALID_REQUEST`: リクエスト形式エラー
- `UNAUTHORIZED`: 認証エラー
- `FORBIDDEN`: 権限エラー
- `NOT_FOUND`: リソースが見つからない
- `CONFLICT`: データ競合エラー
- `RATE_LIMIT_EXCEEDED`: レート制限超過
- `INTERNAL_ERROR`: サーバー内部エラー

## デプロイメント

### Cloud Run 設定
```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/pension-api', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/pension-api']
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'pension-api'
      - '--image'
      - 'gcr.io/$PROJECT_ID/pension-api'
      - '--region'
      - 'asia-northeast1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
```

### 環境変数
```env
PROJECT_ID=your-project-id
FIRESTORE_DATABASE=(default)
STORAGE_BUCKET=your-storage-bucket
JWT_SECRET=your-jwt-secret
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

## 監視・ログ

### Cloud Monitoring メトリクス
- API レスポンス時間
- エラー率
- リクエスト数
- データベース接続数

### アラート設定
- エラー率が5%を超えた場合
- レスポンス時間が2秒を超えた場合
- データベース接続エラー

### ログレベル
- **ERROR**: システムエラー、認証失敗
- **WARN**: バリデーションエラー、リソース不足警告
- **INFO**: API呼び出し、重要な処理開始/終了
- **DEBUG**: 詳細なデバッグ情報

## パフォーマンス要件

### レスポンス時間
- **API平均レスポンス時間**: < 500ms
- **データベース クエリ**: < 100ms
- **ファイルアップロード**: < 5秒

### スケーラビリティ
- **同時接続数**: 1000接続
- **Cloud Run インスタンス**: 自動スケーリング (0-100)
- **Firestore**: 読み取り/書き込みの自動スケーリング

## 開発環境セットアップ

### 必要なツール
- Node.js 18+
- Google Cloud SDK
- Docker
- Firebase CLI

### 初期設定
```bash
# GCP プロジェクト設定
gcloud config set project your-project-id

# サービスアカウント作成
gcloud iam service-accounts create pension-api

# Firestore 有効化
gcloud services enable firestore.googleapis.com

# Cloud Run 有効化
gcloud services enable run.googleapis.com

# ローカル開発用認証
gcloud auth application-default login
```

### 開発サーバー起動
```bash
npm install
npm run dev
```

## テスト戦略

### テスト種類
- **単体テスト**: Jest
- **統合テスト**: Supertest
- **E2Eテスト**: Playwright
- **ロードテスト**: Artillery

### テストカバレッジ
- **コードカバレッジ**: > 80%
- **APIエンドポイント**: 100%
- **エラーケース**: 全てのエラーパターン

## 今後の拡張予定

### フェーズ2機能
- プッシュ通知 (Firebase Cloud Messaging)
- メール通知 (SendGrid/Cloud Email)
- レポート生成 (Cloud Functions)
- データ分析 (BigQuery)

### フェーズ3機能
- AI審査支援 (Vertex AI)
- OCR文書解析 (Document AI)
- チャットボット (Dialogflow)
- モバイルアプリ (React Native)

---

## 実装優先度

### Phase 1 (MVP) - 4週間
1. 基本API実装 (申請CRUD)
2. アンケート機能
3. ファイルアップロード
4. 基本認証

### Phase 2 - 2週間
1. 進捗管理API
2. コメント機能
3. 郵便番号検索
4. 詳細なエラーハンドリング

### Phase 3 - 2週間
1. 監視・ログ設定
2. セキュリティ強化
3. パフォーマンス最適化
4. テスト充実

この仕様書に基づいて、GCPを活用した障害年金管理システムのバックエンドAPIを構築できます。