# Vercel Functions API

このディレクトリには、Vercel Functionsで動作するモックAPIが含まれています。

## エンドポイント

### 認証
- `POST /api/auth/login` - ログイン
  - Body: `{ email: string, password: string }`
  - デフォルト: `admin@example.com` / `admin123`

- `GET /api/auth/me` - 現在のユーザー情報取得

### 申請書管理
- `GET /api/applications` - 申請書一覧取得
  - Query: `?page=1&limit=20&status=draft&search=山田`

- `GET /api/applications/:id` - 申請書詳細取得

- `POST /api/applications` - 申請書作成

- `PUT /api/applications/:id` - 申請書更新

- `DELETE /api/applications/:id` - 申請書削除

- `POST /api/applications/:id/status` - ステータス更新
  - Body: `{ status: string, reason?: string }`

### ヘルスチェック
- `GET /api/health` - APIの状態確認

## 特徴

- インメモリデータストア（再起動時にリセット）
- CORS対応
- 開発用のサンプルデータ付き
- 認証はシンプルなトークンベース（本番環境では要改修）

## ローカル開発

```bash
vercel dev
```

## デプロイ

```bash
vercel --prod
```