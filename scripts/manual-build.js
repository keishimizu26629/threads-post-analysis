/**
 * 手動ビルドスクリプト（npm権限問題の回避用）
 * TypeScriptファイルを手動でJavaScriptに変換
 */

const fs = require('fs');
const path = require('path');

const srcDir = './src';
const distDir = './dist';

console.log('🔧 手動ビルドを開始...');

// distディレクトリを作成
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// TypeScriptファイルを処理
function processTypeScriptFiles() {
  const files = fs.readdirSync(srcDir);

  files.forEach(file => {
    if (file.endsWith('.ts')) {
      const filePath = path.join(srcDir, file);
      let content = fs.readFileSync(filePath, 'utf8');

      console.log(`📝 処理中: ${file}`);

      // TypeScript -> JavaScript変換
      content = convertToJavaScript(content);

      const jsFileName = file.replace('.ts', '.js');
      const jsFilePath = path.join(distDir, jsFileName);

      fs.writeFileSync(jsFilePath, content);
      console.log(`✅ 完了: ${jsFileName}`);
    } else if (file.endsWith('.html')) {
      // HTMLファイルはそのままコピー
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(distDir, file);
      const content = fs.readFileSync(srcPath, 'utf8');

      fs.writeFileSync(destPath, content);
      console.log(`📄 HTMLコピー完了: ${file}`);
    }
  });
}

/**
 * TypeScriptをJavaScriptに変換
 */
function convertToJavaScript(content) {
  // 1. export/importを削除
  content = content.replace(/export\s+/g, '');
  content = content.replace(/import.*from.*;\s*/g, '');

  // 2. インターフェース定義を削除
  content = content.replace(/interface\s+\w+\s*\{[^}]*\}/gs, '');

  // 3. 型アサーション (as Type) を削除
  content = content.replace(/\s+as\s+[A-Za-z_][A-Za-z0-9_.<>[\]|&\s]*/g, '');

  // 4. ジェネリクス型パラメータを削除
  content = content.replace(/<[A-Za-z_][A-Za-z0-9_,\s<>[\]|&]*>/g, '');

  // 5. 関数の戻り値型を削除（パラメータより先に処理）
  // function name(): Type { → function name() {
  // より厳密に: 関数名の後ろのコロンと型だけを削除
  content = content.replace(/(\w+\([^)]*\))\s*:\s*[^{=]+(\{|=>)/g, '$1 $2');

  // 6. 変数宣言の型注釈を削除
  // const name: Type = → const name =
  // より厳密なパターンマッチングを使用
  content = content.replace(/(let|const|var)\s+(\w+)\s*:\s*[A-Za-z_][A-Za-z0-9_.<>[\]|&\s]*\s*=/g, '$1 $2 =');
  content = content.replace(/(let|const|var)\s+(\w+)\s*:\s*[A-Za-z_][A-Za-z0-9_.<>[\]|&\s]*;/g, '$1 $2;');

  // 7. 関数パラメータの型注釈を削除
  // (param: Type) → (param)
  // ただし、default:, case: などのswitch文のコロンは保護
  content = content.replace(/\(([^)]*)\)/g, (match, params) => {
    // パラメータ内の型注釈のみを削除
    const cleanedParams = params.replace(/(\w+)\s*\??\s*:\s*[^,)=]+/g, '$1');
    return `(${cleanedParams})`;
  });

  // 8. アクセス修飾子を削除
  content = content.replace(/\b(private|public|protected|readonly)\s+/g, '');

  // 9. クラス内プロパティの型宣言を削除
  content = content.replace(/^\s*\w+\s*:\s*[^=;]+;\s*$/gm, '');

  // 10. "use strict"を削除
  content = content.replace(/["']use strict["'];\s*/g, '');

  // Note: オブジェクトの短縮記法は変換しない
  // TypeScriptソース側で明示的に { key: value } 形式を使用すること

  return content;
}

// appsscript.jsonをコピー
function copyAppsScriptConfig() {
  const srcPath = './appsscript.json';
  const destPath = path.join(distDir, 'appsscript.json');

  if (fs.existsSync(srcPath)) {
    const content = fs.readFileSync(srcPath, 'utf8');
    fs.writeFileSync(destPath, content);
    console.log(`⚙️ appsscript.jsonコピー完了`);
  }
}

// メイン処理
try {
  processTypeScriptFiles();
  copyAppsScriptConfig();
  console.log('🎉 手動ビルドが完了しました！');
} catch (error) {
  console.error('❌ 手動ビルドでエラーが発生しました:', error);
  process.exit(1);
}
