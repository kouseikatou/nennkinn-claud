# 障害年金管理システム - バックエンド API

日本の障害年金申請を管理するためのバックエンド API です。

## 機能

### 認証・認可
- JWT ベースの認証システム
- ロールベースアクセス制御 (Admin, Staff, Viewer)
- パスワードリセット機能

### 申請管理
- 障害年金申請の作成・更新・削除
- ステータス管理 (下書き、提出済み、審査中、承認済み、却下など)
- 申請者の担当者への割り当て
- 文書アップロード・管理

### ユーザー管理
- ユーザーの作成・更新・削除 (管理者のみ)
- プロフィール管理
- 活動ログの追跡

### レポート・分析
- 申請統計情報
- 活動ログ・監査証跡
- ダッシュボード用データ

## 技術スタック

- **Node.js** - ランタイム環境
- **Express.js** - Webフレームワーク
- **Sequelize** - ORM
- **MySQL** - データベース
- **JWT** - 認証
- **Winston** - ログ管理
- **Jest** - テストフレームワーク

## セットアップ

### 必要な環境
- Node.js 16+ 
- MySQL 8.0+
- npm 8+

### インストール

1. 依存関係をインストール:
```bash
npm install
```

2. 環境変数を設定:
```bash
cp .env.example .env
```

`.env` ファイルを編集してデータベース接続情報を設定してください。

3. データベースを作成:
```bash
mysql -u root -p -e "CREATE DATABASE disability_pension_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

4. データベースマイグレーション:
```bash
npm run migrate
```

5. サンプルデータを投入 (開発環境):
```bash
npm run seed
```

### 開発サーバーの起動

```bash
npm run dev
```

サーバーは http://localhost:5000 で起動します。

### テストアカウント

シードデータを投入した場合、以下のテストアカウントが利用できます:

- **管理者**: admin@disability-pension.jp / admin123
- **職員**: staff1@disability-pension.jp / staff123  
- **閲覧者**: viewer@disability-pension.jp / viewer123

## API エンドポイント

### 認証 (`/api/auth`)
- `POST /register` - ユーザー登録
- `POST /login` - ログイン
- `POST /logout` - ログアウト
- `GET /me` - 現在のユーザー情報取得
- `POST /forgot-password` - パスワードリセット要求
- `POST /reset-password` - パスワードリセット
- `POST /change-password` - パスワード変更

### 申請管理 (`/api/applications`)
- `GET /` - 申請一覧取得 (ページング・フィルタ対応)
- `GET /:id` - 申請詳細取得
- `POST /` - 新規申請作成
- `PUT /:id` - 申請更新
- `PATCH /:id/status` - ステータス更新
- `PATCH /:id/assign` - 担当者割り当て
- `DELETE /:id` - 申請削除
- `GET /statistics` - 統計情報取得

### 文書管理 (`/api/applications/:id/documents`)
- `GET /` - 文書一覧取得
- `POST /` - 文書アップロード
- `PATCH /:documentId/verify` - 文書検証

### コメント (`/api/applications/:id/comments`)
- `GET /` - コメント一覧取得
- `POST /` - コメント追加

### ユーザー管理 (`/api/users`)
- `GET /` - ユーザー一覧取得 (管理者のみ)
- `GET /:id` - ユーザー詳細取得
- `POST /` - ユーザー作成 (管理者のみ)
- `PUT /:id` - ユーザー更新 (管理者のみ)
- `PUT /profile/me` - 自分のプロフィール更新
- `DELETE /:id` - ユーザー削除 (管理者のみ)

### 活動ログ (`/api/activities`)
- `GET /` - 活動ログ一覧取得
- `GET /user/:userId` - ユーザー別活動ログ取得
- `GET /application/:applicationId` - 申請別活動ログ取得
- `GET /statistics` - 活動統計取得

## テスト

```bash
# 全テスト実行
npm test

# テスト監視モード
npm run test:watch

# カバレッジ付きテスト
npm test -- --coverage
```

## 本番環境デプロイ

1. 本番用環境変数を設定
2. データベースマイグレーション実行
3. アプリケーション起動:

```bash
npm start
```

## ログ

アプリケーションログは `logs/` ディレクトリに保存されます:
- `combined.log` - 全ログ
- `error.log` - エラーログのみ

## セキュリティ機能

- Helmet.js によるセキュリティヘッダー設定
- CORS 設定
- Rate Limiting
- JWT トークンによる認証
- パスワードハッシュ化 (bcrypt)
- SQL インジェクション対策 (Sequelize ORM)
- XSS 対策
- 入力値バリデーション

## 開発

### コード品質

```bash
# ESLint チェック
npm run lint

# ESLint 自動修正
npm run lint:fix
```

### データベース操作

```bash
# マイグレーション実行
npm run migrate

# サンプルデータ投入
npm run seed
```

## ライセンス

ISC