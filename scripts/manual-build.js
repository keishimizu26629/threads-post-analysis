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
  // 1. オプショナルパラメータの?を削除
  content = content.replace(/(\w+)\?\s*:/g, '$1:');
  content = content.replace(/(\w+)\?\s*\)/g, '$1)');

  // 2. 型注釈を包括的に削除
  // オブジェクト型注釈: { [key: string]: number } -> {}
  content = content.replace(/:\s*{\s*\[[^\]]+\]:\s*[^}]+}/g, '');

  // 関数パラメータ: (param: Type) -> (param)
  content = content.replace(/(\w+)\s*:\s*[A-Za-z_][A-Za-z0-9_.<>[\]|&\s?]*(?=\s*[,)])/g, '$1');

  // デフォルトパラメータ: param: Type = value -> param = value
  content = content.replace(/(\w+)\s*:\s*[A-Za-z_][A-Za-z0-9_.<>[\]|&\s?]*\s*=/g, '$1 =');

  // 変数宣言: let var: Type = -> let var =
  content = content.replace(/(let|const|var)\s+(\w+)\s*:\s*[A-Za-z_][A-Za-z0-9_.<>[\]|&\s?]*(?=\s*[=;])/g, '$1 $2');

  // 複雑な型注釈: const var: ComplexType = -> const var =
  content = content.replace(/(let|const|var)\s+(\w+)\s*:\s*{[^}]*}\s*=/g, '$1 $2 =');

  // 関数戻り値型: ): Type { -> ) {
  content = content.replace(/\)\s*:\s*[A-Za-z_][A-Za-z0-9_.<>[\]|&\s?]*\s*{/g, ') {');

  // 関数戻り値型（複雑な型）: ): { prop: Type } { -> ) {
  content = content.replace(/\)\s*:\s*{[^}]*}\s*{/g, ') {');

  // プロパティ型注釈: prop: Type; -> prop;
  content = content.replace(/(\w+)\s*:\s*[A-Za-z_][A-Za-z0-9_.<>[\]|&\s?]*;/g, '$1;');

  // クラスプロパティ宣言を削除: properties; -> (削除)
  content = content.replace(/^\s*\w+;\s*$/gm, '');

  // クラス内のプロパティ宣言を削除（より強力に）
  content = content.replace(/(class\s+\w+\s*{\s*)(\w+;\s*)+/g, '$1');

  // プロパティ宣言（代入なし）を削除: accessToken; -> (削除)
  content = content.replace(/^\s*\w+;\s*$/gm, '');

  // クラス内の単独プロパティ宣言を削除
  content = content.replace(/(\n\s+)(\w+);(\s*\n)/g, '$1$3');

  // 残ったプロパティ宣言を削除
  content = content.replace(/\s+\w+;\s*\n\s*constructor/g, '\n  constructor');

  // 3. インターフェース定義を削除
  content = content.replace(/interface\s+\w+\s*{[^}]*}/gs, '');

  // 4. export/importを削除
  content = content.replace(/export\s+/g, '');
  content = content.replace(/import.*from.*;\s*/g, '');

  // 5. "use strict"を削除
  content = content.replace(/["']use strict["'];\s*/g, '');

  // 6. アクセス修飾子を削除
  content = content.replace(/\b(private|public|protected)\s+/g, '');

  // 7. readonly修飾子を削除
  content = content.replace(/\breadonly\s+/g, '');

  // 8. 型アサーションを削除
  content = content.replace(/as\s+[A-Za-z_][A-Za-z0-9_.<>[\]|&\s]*/g, '');

  // 9. ジェネリクスを削除
  content = content.replace(/<[A-Za-z_][A-Za-z0-9_,\s<>]*>/g, '');

  // 10. ES6オブジェクト省略記法を修正: { success, message: ... } -> { success: success, message: ... }
  content = content.replace(/{\s*(\w+),\s*(\w+):/g, '{ $1: $1, $2:');
  content = content.replace(/{\s*(\w+)\s*}/g, '{ $1: $1 }');

  // 11. テンプレートリテラル内のオブジェクト省略記法を修正
  content = content.replace(/\${\s*(\w+):\s*(\w+)\s*}/g, '${$2}');

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
