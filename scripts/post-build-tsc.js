/**
 * tscビルド後の後処理
 * - HTMLファイルとappsscript.jsonをdistにコピー
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const distDir = path.join(__dirname, '../dist');

console.log('🔧 tscビルド後処理を開始...');

// distディレクトリが存在しない場合は作成
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// HTMLファイルをコピー
const htmlFiles = fs.readdirSync(srcDir).filter(file => file.endsWith('.html'));
htmlFiles.forEach(file => {
  const srcPath = path.join(srcDir, file);
  const distPath = path.join(distDir, file);
  fs.copyFileSync(srcPath, distPath);
  console.log(`📄 HTMLコピー完了: ${file}`);
});

// appsscript.jsonをコピー
const appsscriptPath = path.join(srcDir, 'appsscript.json');
if (fs.existsSync(appsscriptPath)) {
  const distAppsscriptPath = path.join(distDir, 'appsscript.json');
  fs.copyFileSync(appsscriptPath, distAppsscriptPath);
  console.log('⚙️ appsscript.jsonコピー完了');
}

console.log('✅ tscビルド後処理完了');
