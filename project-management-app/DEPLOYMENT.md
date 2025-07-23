# 障害年金管理システム - 本番環境デプロイ手順

このドキュメントでは、障害年金管理システムを本番環境にデプロイする手順を説明します。

## 目次

1. [前提条件](#前提条件)
2. [インフラストラクチャのセットアップ](#インフラストラクチャのセットアップ)
3. [サーバーの準備](#サーバーの準備)
4. [アプリケーションのデプロイ](#アプリケーションのデプロイ)
5. [モニタリングの設定](#モニタリングの設定)
6. [バックアップの設定](#バックアップの設定)
7. [トラブルシューティング](#トラブルシューティング)

## 前提条件

### 必要なもの
- Linux サーバー (Ubuntu 22.04 LTS 推奨)
- Docker & Docker Compose
- ドメイン名
- SSL証明書
- MySQL データベース

### 推奨スペック
- **最小構成**: 2 CPU, 4GB RAM, 50GB SSD
- **推奨構成**: 4 CPU, 8GB RAM, 100GB SSD
- **高負荷対応**: 8 CPU, 16GB RAM, 200GB SSD

## インフラストラクチャのセットアップ

### 1. Terraform を使用したAWS環境構築

```bash
# Terraformディレクトリに移動
cd terraform

# 変数ファイルを作成
cp terraform.tfvars.example terraform.tfvars

# terraform.tfvarsを編集
nano terraform.tfvars
```

**terraform.tfvars 設定例:**
```hcl
aws_region = "ap-northeast-1"
domain_name = "your-domain.com"
environment = "production"
project_name = "disability-pension"
```

```bash
# Terraformを初期化
terraform init

# 実行プランを確認
terraform plan

# インフラをデプロイ
terraform apply
```

### 2. 手動でのサーバー設定

#### サーバー初期設定スクリプトの実行

```bash
# サーバーにSSH接続
ssh root@your-server-ip

# セットアップスクリプトをダウンロード
wget https://raw.githubusercontent.com/your-repo/disability-pension-system/main/scripts/setup-server.sh

# スクリプトを実行
chmod +x setup-server.sh
./setup-server.sh
```

## サーバーの準備

### 1. 環境変数の設定

```bash
# プロジェクトディレクトリに移動
cd /home/deploy/disability-pension-system

# 環境変数ファイルを作成
cp .env.production.example .env.production

# 環境変数を設定
nano .env.production
```

**重要な設定項目:**
```env
# データベース設定
MYSQL_ROOT_PASSWORD=your-secure-root-password
MYSQL_USER=pension_user
MYSQL_PASSWORD=your-secure-database-password

# JWT設定
JWT_SECRET=your-32-character-minimum-jwt-secret-key

# ドメイン設定
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://your-domain.com/api
```

### 2. SSL証明書の設置

#### Let's Encrypt の使用
```bash
# Certbotをインストール
sudo apt install certbot python3-certbot-nginx

# SSL証明書を取得
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自動更新を設定
sudo crontab -e
# 以下を追加:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

#### 手動でのSSL証明書設置
```bash
# SSL証明書ディレクトリを作成
sudo mkdir -p /etc/ssl/disability-pension

# 証明書ファイルを配置
sudo cp your-certificate.crt /etc/ssl/disability-pension/cert.pem
sudo cp your-private-key.key /etc/ssl/disability-pension/key.pem

# 権限を設定
sudo chown deploy:deploy /etc/ssl/disability-pension/*
sudo chmod 600 /etc/ssl/disability-pension/*
```

## アプリケーションのデプロイ

### 1. コードのクローン

```bash
# deployユーザーとしてログイン
su - deploy

# プロジェクトをクローン
git clone https://github.com/your-username/disability-pension-system.git
cd disability-pension-system
```

### 2. 初回デプロイ

```bash
# デプロイスクリプトを実行
./scripts/deploy.sh deploy
```

### 3. デプロイ後の確認

```bash
# サービスの状態を確認
./scripts/deploy.sh status

# ヘルスチェック
./scripts/deploy.sh health

# ログの確認
./scripts/deploy.sh logs
```

### 4. 初期データのセットアップ

```bash
# データベースマイグレーション
docker-compose -f docker-compose.production.yml exec backend npm run migrate

# 初期ユーザーの作成
docker-compose -f docker-compose.production.yml exec backend npm run seed
```

## CI/CDパイプラインの設定

### 1. GitHub Secrets の設定

GitHubリポジトリの Settings > Secrets and variables > Actions で以下を設定:

```
PRODUCTION_HOST=your-server-ip
PRODUCTION_USER=deploy
PRODUCTION_SSH_KEY=your-private-ssh-key
PRODUCTION_PORT=22
GITHUB_TOKEN=automatically-provided
```

### 2. 自動デプロイの確認

```bash
# mainブランチにプッシュして自動デプロイをテスト
git add .
git commit -m "feat: test deployment pipeline"
git push origin main
```

## モニタリングの設定

### 1. モニタリングスタックの起動

```bash
# モニタリングサービスを起動
docker-compose -f monitoring/docker-compose.monitoring.yml up -d

# サービスの確認
docker-compose -f monitoring/docker-compose.monitoring.yml ps
```

### 2. Grafanaダッシュボードへのアクセス

- URL: `http://your-server-ip:3001`
- ユーザー名: `admin`
- パスワード: `admin123`

### 3. アラートの設定

アラートは以下の条件で設定済み:
- CPU使用率が80%を超えた場合
- メモリ使用率が85%を超えた場合
- ディスク使用率が90%を超えた場合
- アプリケーションがダウンした場合

## バックアップの設定

### 1. 自動バックアップの設定

```bash
# cronジョブを設定
crontab -e

# 以下を追加（毎日午前2時にバックアップ）
0 2 * * * /home/deploy/disability-pension-system/scripts/backup.sh backup >> /var/log/backup.log 2>&1

# 毎週日曜日に古いバックアップを削除
0 3 * * 0 /home/deploy/disability-pension-system/scripts/backup.sh cleanup >> /var/log/backup.log 2>&1
```

### 2. バックアップの確認

```bash
# バックアップリストの確認
./scripts/backup.sh list

# 手動バックアップの実行
./scripts/backup.sh backup
```

### 3. リストアの実行

```bash
# 利用可能なバックアップを確認
./scripts/backup.sh list

# バックアップからリストア
./scripts/backup.sh restore /path/to/backup/file.sql.gz
```

## パフォーマンス最適化

### 1. データベース最適化

```sql
-- MySQL設定の最適化
SET GLOBAL innodb_buffer_pool_size = 1073741824; -- 1GB
SET GLOBAL max_connections = 200;
SET GLOBAL query_cache_size = 134217728; -- 128MB
```

### 2. Nginx最適化

```nginx
# /etc/nginx/nginx.conf に追加
worker_processes auto;
worker_connections 1024;

# Gzip圧縮
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
```

### 3. アプリケーション最適化

```bash
# PM2でクラスター化（EC2での手動デプロイの場合）
pm2 start ecosystem.config.js --env production

# PM2の監視
pm2 monit
```

## セキュリティ設定

### 1. ファイアウォール設定

```bash
# UFWファイアウォールの設定
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3001  # Grafana（必要に応じて）
```

### 2. fail2banの設定

```bash
# fail2banの設定
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# SSH保護の確認
sudo fail2ban-client status sshd
```

### 3. ログ監視

```bash
# 重要なログファイルを監視
sudo tail -f /var/log/auth.log
sudo tail -f /var/log/nginx/error.log
```

## トラブルシューティング

### 1. 一般的な問題

#### アプリケーションが起動しない
```bash
# ログを確認
docker-compose -f docker-compose.production.yml logs backend

# コンテナの状態を確認
docker-compose -f docker-compose.production.yml ps

# 環境変数を確認
docker-compose -f docker-compose.production.yml exec backend env
```

#### データベース接続エラー
```bash
# データベースの状態を確認
docker-compose -f docker-compose.production.yml logs mysql

# データベースに直接接続してテスト
docker-compose -f docker-compose.production.yml exec mysql mysql -u$MYSQL_USER -p$MYSQL_PASSWORD
```

#### SSL証明書の問題
```bash
# 証明書の有効性を確認
sudo certbot certificates

# Nginx設定のテスト
sudo nginx -t

# SSL設定の確認
openssl s_client -connect your-domain.com:443
```

### 2. パフォーマンスの問題

#### 高いCPU使用率
```bash
# プロセスの監視
htop

# Docker統計情報
docker stats

# アプリケーションのプロファイリング
docker-compose -f docker-compose.production.yml exec backend npm run profile
```

#### メモリ不足
```bash
# メモリ使用状況の確認
free -h

# Docker メモリ使用量
docker system df

# 不要なコンテナの削除
docker system prune -f
```

### 3. 緊急時の対応

#### サービスの緊急停止
```bash
# 全サービスを停止
./scripts/deploy.sh stop

# 特定のサービスのみ停止
docker-compose -f docker-compose.production.yml stop backend
```

#### 緊急時のロールバック
```bash
# 前のバージョンにロールバック
./scripts/deploy.sh rollback

# 特定のバックアップからリストア
./scripts/backup.sh restore /path/to/emergency/backup.sql.gz
```

## 連絡先とサポート

本番環境で問題が発生した場合は、以下の手順で対応してください：

1. **即座の対応**: 緊急停止またはロールバック
2. **ログの収集**: 関連するログファイルを保存
3. **状況の報告**: 問題の詳細を文書化
4. **復旧作業**: 段階的な復旧手順の実行

---

**注意**: このドキュメントは本番環境での運用を想定しています。設定変更前には必ずバックアップを取得し、可能であればステージング環境で事前テストを実施してください。