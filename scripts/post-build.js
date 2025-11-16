/**
 * TypeScriptコンパイル後の後処理スクリプト
 * GAS用にJavaScriptファイルを最適化
 */

const fs = require('fs');
const path = require('path');

const distDir = './dist';

console.log('🔧 GAS用ポストビルド処理を開始...');

// distディレクトリ内のすべてのJSファイルを処理
function processJavaScriptFiles() {
  const files = fs.readdirSync(distDir);

  files.forEach(file => {
    if (file.endsWith('.js')) {
      const filePath = path.join(distDir, file);
      let content = fs.readFileSync(filePath, 'utf8');

      console.log(`📝 処理中: ${file}`);

      // GAS用の変換処理
      content = transformForGAS(content);

      // ファイルを上書き
      fs.writeFileSync(filePath, content);
      console.log(`✅ 完了: ${file}`);
    }
  });
}

/**
 * GAS用にJavaScriptコードを変換
 */
function transformForGAS(content) {
  // 1. "use strict"を削除（GASでは不要）
  content = content.replace(/["']use strict["'];\s*/g, '');

  // 2. exportキーワードを削除
  content = content.replace(/export\s+/g, '');

  // 3. importステートメントを削除
  content = content.replace(/import.*from.*;\s*/g, '');

  // 4. ES6のオブジェクトプロパティ省略記法を展開
  content = expandObjectShorthand(content);

  // 5. アロー関数を通常の関数に変換（必要に応じて）
  // content = convertArrowFunctions(content);

  // 6. テンプレートリテラルの問題を修正
  content = fixTemplateLiterals(content);

  return content;
}

/**
 * オブジェクトプロパティの省略記法を展開
 */
function expandObjectShorthand(content) {
  // { prop } -> { prop: prop }
  // { prop, } -> { prop: prop, }
  return content.replace(
    /{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*([,}])/g,
    '{ $1: $1$2'
  ).replace(
    /,\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*([,}])/g,
    ', $1: $1$2'
  );
}

/**
 * テンプレートリテラルの問題を修正
 */
function fixTemplateLiterals(content) {
  // 特に問題のあるパターンがあれば修正
  return content;
}

/**
 * アロー関数を通常の関数に変換（必要に応じて）
 */
function convertArrowFunctions(content) {
  // 簡単なアロー関数の変換
  // const func = () => {} -> function func() {}
  return content.replace(
    /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\(\s*\)\s*=>\s*{/g,
    'function $1() {'
  );
}

// HTMLファイルをコピー
function copyHtmlFiles() {
  const srcDir = './src';
  const files = fs.readdirSync(srcDir);

  files.forEach(file => {
    if (file.endsWith('.html')) {
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(distDir, file);
      const content = fs.readFileSync(srcPath, 'utf8');

      fs.writeFileSync(destPath, content);
      console.log(`📄 HTMLコピー完了: ${file}`);
    }
  });
}

// メイン処理
try {
  processJavaScriptFiles();
  copyHtmlFiles();
  console.log('🎉 ポストビルド処理が完了しました！');
} catch (error) {
  console.error('❌ ポストビルド処理でエラーが発生しました:', error);
  process.exit(1);
}
