#!/bin/bash
# 変換後の後処理スクリプト

cd "$(dirname "$0")/../dist"

echo "🔧 後処理開始..."

# 1. 関数定義の後の型定義行を削除
python3 << 'EOF'
import re

with open('Code.js', 'r') as f:
    content = f.read()

# 関数定義の直後の型定義ブロックを削除
# function name() {
#   success: boolean;
#   message: string;
# }
content = re.sub(
    r'(function\s+\w+\([^)]*\)\s*\{)\s*\n\s*\w+\??\s*:\s*[^;]+;\s*\n(\s*\w+\??\s*:\s*[^;]+;\s*\n)*\s*\}',
    r'\1',
    content,
    flags=re.MULTILINE
)

with open('Code.js', 'w') as f:
    f.write(content)

print('✅ 関数戻り値型を削除')
EOF

# 2. 短縮プロパティを展開
sed -i '' 's/{ success, data }/{ success: true, data: result }/g' Code.js
sed -i '' 's/JSON\.stringify({ success, data)/JSON.stringify({ success: true, data: result )/g' Code.js

# エラーオブジェクトの展開
sed -i '' 's/{ success, error,/{ success: false, error: errorMessage,/g' Code.js

echo "✅ 短縮プロパティを展開"

# 3. 構文チェック
echo ""
echo "📝 構文チェック中..."
if node -c Code.js 2>&1; then
    echo "✅ 構文チェック OK!"
    exit 0
else
    echo "❌ 構文エラーあり"
    node -c Code.js 2>&1 | head -10
    exit 1
fi
