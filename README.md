# 障害年金管理システム

このシステムは、障害年金の申請プロセスを効率的に管理するためのWebアプリケーションです。

## 主な機能

- 申請者情報の管理
- 配偶者・子供情報の登録
- 申請状況の追跡
- ドキュメント管理
- 活動ログの記録
- ユーザー権限管理

## 技術スタック

- フロントエンド: HTML, JavaScript, Tailwind CSS
- バックエンド: Node.js, Express
- データベース: SQLite (in-memory)
- ホスティング: GitHub Pages / Cloud Run

## クイックスタート

### 開発環境

```bash
# リポジトリをクローン
git clone https://github.com/kouseikatou/nennkinn-claud.git
cd nennkinn-claud

# 開発ブランチに切り替え
git checkout develop

# 依存関係をインストール
cd project-management-app/cloudrun
npm install

# 開発サーバーを起動
npm run dev
```

アプリケーションは http://localhost:8080 で利用可能です。

### デフォルトログイン情報

- Email: `admin@disability-pension.jp`
- Password: `admin123`

## 開発フロー

1. `develop` ブランチから機能ブランチを作成
2. 変更を実装
3. `develop` へプルリクエスト
4. レビュー後マージ
5. `main` へのマージで自動デプロイ

詳細は [DEVELOPMENT.md](DEVELOPMENT.md) を参照してください。

## デプロイ

- **本番環境**: https://kouseikatou.github.io/nennkinn-claud/
- **自動デプロイ**: `main` ブランチへのプッシュで GitHub Actions が自動実行

## ドキュメント

- [開発ガイド](DEVELOPMENT.md) - 開発環境のセットアップと開発フロー
- [デプロイメントガイド](project-management-app/DEPLOYMENT.md) - 本番環境へのデプロイ手順