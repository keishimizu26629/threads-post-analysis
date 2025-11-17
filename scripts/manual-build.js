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
  // 関数シグネチャ内の型注釈を削除するヘルパー
  const stripParams = (paramText) => {
    return paramText
      .replace(/(\w+)\s*\?:\s*[^,]+/g, '$1') // optional parameter
      .replace(/(\w+)\s*:\s*[^,]+/g, '$1');  // normal parameter
  };

  // 1. 関数宣言の引数・戻り値の型を削除
  content = content.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*:\s*[^ {]+\s*{/g, (match, name, params) => {
    return `function ${name}(${stripParams(params)}) {`;
  });
  content = content.replace(/function\s+(\w+)\s*\(([^)]*)\)/g, (match, name, params) => {
    return `function ${name}(${stripParams(params)})`;
  });

  // 2. アロー関数の型注釈を削除（簡易）
  content = content.replace(/\(([^)]*)\)\s*:\s*[^=]+=>/g, (match, params) => {
    return `(${stripParams(params)}) =>`;
  });

  // 3. 変数宣言の型注釈を削除
  content = content.replace(/(let|const|var)\s+(\w+)\s*:\s*[^=;]+/g, '$1 $2');

  // 4. クラス内プロパティ宣言を削除
  content = content.replace(/^\s*\w+\s*:\s*[^;]+;\s*$/gm, '');

  // 5. 戻り値型（残ったもの）を削除
  content = content.replace(/\)\s*:\s*[^ {]+\s*{/g, ') {');

  // 6. インターフェース定義を削除
  content = content.replace(/interface\s+\w+\s*{[^}]*}/gs, '');

  // 7. export/importを削除
  content = content.replace(/export\s+/g, '');
  content = content.replace(/import.*from.*;\s*/g, '');

  // 8. "use strict"を削除
  content = content.replace(/["']use strict["'];\s*/g, '');

  // 9. アクセス修飾子とreadonlyを削除
  content = content.replace(/\b(private|public|protected|readonly)\s+/g, '');

  // 10. 型アサーションを削除
  content = content.replace(/as\s+[A-Za-z_][A-Za-z0-9_.<>[\]|&\s]*/g, '');

  // 11. ジェネリクスを削除（簡易）
  content = content.replace(/<[A-Za-z_][A-Za-z0-9_,\s<>]*>/g, '');

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
