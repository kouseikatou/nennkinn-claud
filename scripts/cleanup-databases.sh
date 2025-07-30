#!/bin/bash

echo "🧹 データベースファイルのクリーンアップ開始..."

# プロジェクトルートから実行
PROJECT_ROOT=$(dirname $(dirname $(realpath $0)))
cd "$PROJECT_ROOT"

# 古いデータベースファイルを検索して削除（dataフォルダ以外）
echo "📍 不要なデータベースファイルを検索中..."

# 削除対象のファイルをリスト表示
find . -type f \( -name "*.sqlite" -o -name "*.db" -o -name "*.sqlite3" \) \
  -not -path "./data/*" \
  -not -path "./node_modules/*" \
  -not -path "./venv/*" | while read -r file; do
    echo "  🗑️  削除: $file"
    rm -f "$file"
done

# 統一されたデータディレクトリ構造を確認
echo ""
echo "📁 データディレクトリ構造を確認..."
mkdir -p data/backups

# 現在のデータベースファイルを表示
echo ""
echo "✅ 現在のデータベースファイル:"
if [ -d "data" ]; then
    ls -la data/*.sqlite 2>/dev/null || echo "  (データベースファイルがありません)"
fi

echo ""
echo "🎉 クリーンアップ完了！"
echo ""
echo "📝 今後は以下のパスのみを使用してください:"
echo "  - 本番: data/production.sqlite"
echo "  - 開発: data/development.sqlite"
echo "  - バックアップ: data/backups/"