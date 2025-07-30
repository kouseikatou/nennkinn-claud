#!/bin/bash

# SQLiteデータベースのセットアップスクリプト

echo "🚀 SQLiteデータベースセットアップ開始..."

# データディレクトリの作成
mkdir -p data
mkdir -p data/backups

# 本番用データベースファイルの作成（存在しない場合）
if [ ! -f "data/production.sqlite" ]; then
    echo "📁 本番用データベースファイルを作成中..."
    touch data/production.sqlite
    
    # 初期データの投入
    echo "📊 初期データを投入中..."
    npm run init-data
    
    echo "✅ 本番用データベース作成完了！"
else
    echo "ℹ️  本番用データベースは既に存在します"
fi

# 開発用データベースのコピー作成
if [ "$1" == "--dev" ]; then
    echo "🔧 開発用データベースをセットアップ中..."
    cp data/production.sqlite data/development.sqlite
    echo "✅ 開発用データベース作成完了！"
fi

# バックアップの作成
echo "💾 初期バックアップを作成中..."
cp data/production.sqlite "data/backups/backup_$(date +%Y%m%d_%H%M%S).sqlite"

echo "🎉 セットアップ完了！"
echo ""
echo "使用方法:"
echo "  本番環境: DB_STORAGE=./data/production.sqlite"
echo "  開発環境: DB_STORAGE=./data/development.sqlite"
echo ""
echo "バックアップ: data/backups/ に保存されています"