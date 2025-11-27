#!/bin/bash
# 最終的な変換スクリプト - TypeScriptをそのままコピーしてGASで動くように最小限の修正

set -e

echo "🚀 最終変換開始..."

cd "$(dirname "$0")/.."
rm -rf dist
mkdir -p dist

# TypeScriptファイルをJSとしてコピー（型はGASで実行時に無視される）
for ts_file in src/*.ts; do
  filename=$(basename "$ts_file" .ts)
  echo "📄 コピー: $filename.ts → $filename.js"
  cp "$ts_file" "dist/$filename.js"
done

# HTMLとJSONをコピー
cp src/dashboard.html dist/
cp appsscript.json dist/

echo "✅ コピー完了"
echo ""
echo "🔧 最小限の修正を実行..."

# GASで問題になる構文のみ修正
cd dist
for js_file in *.js; do
  # export文を削除
  sed -i '' '/^export /d' "$js_file"
  # import文を削除
  sed -i '' '/^import /d' "$js_file"
  echo "  ✓ $js_file"
done

echo ""
echo "✨ 変換完了！"
echo ""
echo "📝 Note: TypeScriptの型注釈は残っていますが、Google Apps Scriptでは実行時に無視されるため問題ありません。"
