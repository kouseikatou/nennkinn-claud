# 障害年金管理システム - 開発ガイド

## 開発フロー

### 1. 環境セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/kouseikatou/nennkinn-claud.git
cd nennkinn-claud

# 開発ブランチに切り替え
git checkout develop

# 依存関係をインストール
cd project-management-app/cloudrun
npm install
```

### 2. ローカル開発

```bash
# 開発サーバーを起動
npm run dev
# または
node index.js
```

アプリケーションは http://localhost:8080 で利用可能です。

### 3. 開発ワークフロー

1. **機能ブランチを作成**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **コードを変更**
   - `project-management-app/cloudrun/index.js` - バックエンドAPI
   - `project-management-app/cloudrun/public/` - フロントエンドファイル

3. **変更をコミット**
   ```bash
   git add .
   git commit -m "feat: 機能の説明"
   ```

4. **開発ブランチにプッシュ**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **プルリクエストを作成**
   - GitHub上で `develop` ブランチへのPRを作成
   - レビュー後、マージ

6. **本番デプロイ**
   - `develop` から `main` へのPRを作成
   - マージすると自動的にGitHub Pagesにデプロイ

## コーディング規約

- コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/) 形式を使用
  - `feat:` 新機能
  - `fix:` バグ修正
  - `docs:` ドキュメント
  - `style:` コードスタイル
  - `refactor:` リファクタリング
  - `test:` テスト
  - `chore:` その他

## 主要ファイル構成

```
project-management-app/
├── cloudrun/
│   ├── index.js          # Express サーバー（API + 静的ファイル配信）
│   ├── package.json      # 依存関係
│   ├── Dockerfile        # Cloud Run用（オプション）
│   └── public/           # フロントエンドファイル
│       ├── index.html    # ログインページ
│       ├── projects.html # 申請一覧
│       └── project-unified.html # 申請詳細・編集
```

## API エンドポイント

- `POST /api/auth/login` - ログイン
- `GET /api/applications` - 申請一覧取得
- `GET /api/applications/:id` - 申請詳細取得
- `POST /api/applications` - 新規申請作成
- `PUT /api/applications/:id` - 申請更新
- `GET /api/applications/statistics/overview` - 統計情報

## デバッグ

```bash
# ログを確認
npm run dev

# データベースの状態を確認（SQLite in-memory）
# アプリケーション再起動でリセットされます
```

## トラブルシューティング

### ポートが使用中の場合
```bash
# 別のポートで起動
PORT=3000 node index.js
```

### 依存関係の問題
```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

## 本番環境

- **URL**: https://kouseikatou.github.io/nennkinn-claud/
- **自動デプロイ**: `main` ブランチへのプッシュで自動デプロイ
- **手動デプロイ**: GitHub Actions から手動実行も可能