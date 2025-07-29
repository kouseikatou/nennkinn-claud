# Vercelデプロイ設定

## 1. Vercel Postgres データベース設定

Vercelダッシュボードで以下を設定：

### Environment Variables
```
NODE_ENV=production
POSTGRES_URL=（Vercel Postgresから自動取得）
JWT_SECRET=your-super-secret-jwt-key-here-please-change-this-in-production
FRONTEND_URL=https://your-vercel-app.vercel.app
```

## 2. データベース初期化

デプロイ後、以下のコマンドでデータを初期化：

```bash
npm run init-data
```

## 3. 初期データ

以下のデータが作成されます：

### 管理者ユーザー
- 名前: 管理者
- メール: admin@disability-pension.com

### 申請データ
- 申請者: 田中太郎（タナカタロウ）
- 生年月日: 1985-03-15
- 障害種別: 精神障害（うつ病）
- ステータス: 下書き

## 4. トラブルシューティング

### データが保存されない場合
1. Vercel Postgresが正しく設定されているか確認
2. 環境変数`POSTGRES_URL`が設定されているか確認
3. データベース初期化スクリプトを実行

### API エンドポイント
- Health Check: `/health`
- API 一覧: `/`
- アンケート API: `/api/surveys/:applicationId/:surveyType`
- 申請 API: `/api/applications`

## 5. 使用方法

1. ブラウザでVercelのURLにアクセス
2. プロジェクト管理画面から「田中太郎」の申請を選択
3. アンケートフォームでデータ入力・保存が可能