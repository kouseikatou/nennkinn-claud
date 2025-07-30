# SQLiteデータベース管理ガイド

## 概要
このプロジェクトでは、開発環境と本番環境で同じSQLiteデータベースを使用します。
これにより、環境差異によるバグを防ぎ、デプロイを簡素化できます。

## ディレクトリ構造
```
data/
├── production.sqlite    # 本番用データベース（マスター）
├── development.sqlite   # 開発用データベース（コピー）
└── backups/            # バックアップ保存場所
    └── backup_YYYYMMDD_HHMMSS.sqlite
```

## セットアップ

### 初回セットアップ
```bash
# 実行権限を付与
chmod +x setup-database.sh

# 本番用データベースの作成
./setup-database.sh

# 開発用データベースも作成する場合
./setup-database.sh --dev
```

### 環境変数設定

**.env.production**
```env
DB_DIALECT=sqlite
DB_STORAGE=./data/production.sqlite
NODE_ENV=production
```

**.env.development**
```env
DB_DIALECT=sqlite
DB_STORAGE=./data/development.sqlite
NODE_ENV=development
```

## 運用方法

### 1. データの事前登録
```bash
# 初期データの投入
npm run init-data

# カスタムデータの追加（必要に応じて）
node scripts/add-custom-data.js
```

### 2. バックアップ
```bash
# 手動バックアップ
cp data/production.sqlite "data/backups/backup_$(date +%Y%m%d_%H%M%S).sqlite"

# 自動バックアップ（cronジョブ例）
0 2 * * * cd /path/to/project && cp data/production.sqlite "data/backups/backup_$(date +\%Y\%m\%d).sqlite"
```

### 3. リストア
```bash
# バックアップからリストア
cp data/backups/backup_YYYYMMDD_HHMMSS.sqlite data/production.sqlite
```

### 4. データ同期（開発環境）
```bash
# 本番データを開発環境にコピー
cp data/production.sqlite data/development.sqlite
```

## Vercelへのデプロイ

### 方法1: Git LFSを使用
```bash
# Git LFSのセットアップ
git lfs track "data/*.sqlite"
git add .gitattributes
git add data/production.sqlite
git commit -m "Add SQLite database"
git push
```

### 方法2: Vercel Blobストレージ
Vercel Blobストレージを使用して、データベースファイルを永続化できます。

### 方法3: 外部ストレージ
- Cloudflare R2
- AWS S3
- Google Cloud Storage

## 注意事項

1. **同時アクセス**: SQLiteは同時書き込みに制限があるため、小規模運用向けです
2. **ファイルサイズ**: Gitでは100MB以下を推奨（LFS使用時は2GBまで）
3. **バックアップ**: 定期的なバックアップを必ず実施してください
4. **移行計画**: ユーザー数が増えたらPostgreSQLへの移行を検討してください

## トラブルシューティング

### データベースがロックされる
```bash
# プロセスの確認と終了
lsof data/production.sqlite
kill -9 <PID>
```

### 破損チェック
```bash
sqlite3 data/production.sqlite "PRAGMA integrity_check;"
```

### データエクスポート（移行用）
```bash
# SQL形式でエクスポート
sqlite3 data/production.sqlite .dump > export.sql

# CSV形式でエクスポート
sqlite3 data/production.sqlite ".mode csv" ".output users.csv" "SELECT * FROM users;"
```