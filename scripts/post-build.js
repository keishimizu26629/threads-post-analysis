/**
 * ビルド後処理スクリプト
 * dist/Code.jsの構文エラーを修正
 */

const fs = require('fs');
const path = require('path');

const codeJsPath = path.join(__dirname, '../dist/Code.js');

console.log('🔧 ビルド後処理を開始...');

// Code.jsを読み込み
let content = fs.readFileSync(codeJsPath, 'utf8');

// 1. 戻り値型の残骸を削除
// function name() { success: boolean; ... } { を function name() { に修正
content = content.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*\{[^{]+\{/g, 'function $1($2) {');

// 2. default) を default: に修正
content = content.replace(/default\)/g, 'default:');

// 3. 短縮プロパティを展開
// { success, data } を { success: true, data: result } に修正
content = content.replace(/JSON\.stringify\(\{\s*success,\s*data\s*\}\)/g, 'JSON.stringify({ success: true, data: result })');
content = content.replace(/JSON\.stringify\(\{\s*success,\s*error,\s*\}\)/g, 'JSON.stringify({ success: false, error: errorMessage })');

// 4. 誤って削除されたHTMLタグを修正
content = content.replace(/エラーが発生しました<\/h1>/g, '<h1>エラーが発生しました</h1>');
content = content.replace(/\$\{errorMessage\}<\/p>/g, '<p>${errorMessage}</p>');

// 5. 欠落したdefaultケースを追加
content = content.replace(
  /(case 'dashboard':[\s\S]*?\.setXFrameOptionsMode\(HtmlService\.XFrameOptionsMode\.ALLOWALL\);)\s*\}/g,
  `$1

      default:
        return HtmlService.createTemplateFromFile('dashboard')
          .evaluate()
          .setTitle('Threads投稿分析ツール')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }`
);

// 6. 欠落したdefaultケースをdoPostにも追加
content = content.replace(
  /(case 'getBatchExecutionStatus':[\s\S]*?break;)\s*\}/g,
  `$1

      default:
        throw new Error(\`未知のアクション: \${action}\`);
    }`
);

// 保存
fs.writeFileSync(codeJsPath, content);

console.log('✅ ビルド後処理が完了しました！');
