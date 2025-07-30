#!/bin/bash

echo "🚀 Vercel自動デプロイ設定スクリプト"
echo ""

# Vercel CLIがインストールされているか確認
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLIがインストールされていません"
    echo "以下のコマンドでインストールしてください："
    echo "npm i -g vercel"
    exit 1
fi

echo "✅ Vercel CLIが見つかりました"

# プロジェクトの確認
echo ""
echo "📋 現在のプロジェクト設定："
vercel ls

echo ""
echo "🔧 自動デプロイを有効化するには以下の手順を実行してください："
echo ""
echo "1. Vercelダッシュボードにアクセス："
echo "   https://vercel.com/katous-projects-3f2eb0af/nennkinn-claud"
echo ""
echo "2. Settings → Git で以下を確認："
echo "   ✅ Production Branch: main"
echo "   ✅ Automatic deployments: ON"
echo ""
echo "3. または、以下のコマンドでプロジェクトを再リンク："
echo "   vercel link --yes"
echo "   vercel env pull"
echo ""

# プロジェクトが正しくリンクされているか確認
if [ -f ".vercel/project.json" ]; then
    echo "✅ プロジェクトは正しくリンクされています"
    cat .vercel/project.json
else
    echo "⚠️  プロジェクトがリンクされていません"
    echo "以下のコマンドを実行してください："
    echo "vercel link"
fi

echo ""
echo "🎉 設定完了後、GitHubへのプッシュで自動デプロイされます！"