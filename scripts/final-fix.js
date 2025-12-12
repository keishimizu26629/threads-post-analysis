/**
 * 最終修正: 全てのシンタックスエラーを修正
 */

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '../dist/Code.js');

console.log('🔧 最終修正を開始...');

let content = fs.readFileSync(distPath, 'utf8');

// 1. 重複したreturn文を削除
content = content.replace(/return \{ success: true, data: data \};: true, data \};/g, 'return { success: true, data: data };');
content = content.replace(/return \{ success: true, data: data \};\s*success: true, data: data \};/g, 'return { success: true, data: data };');

// 2. 壊れたオブジェクトリテラルを修正
// success, data ) → success: true, data: data })
content = content.replace(/\{ success, data \)/g, '{ success: true, data: data })');
content = content.replace(/\{ success, message \)/g, '{ success: false, message: \'Error\' })');

// 3. 型注釈の残骸を全て削除
content = content.replace(/: boolean/g, '');
content = content.replace(/: string/g, '');
content = content.replace(/: number/g, '');
content = content.replace(/: object/g, '');
content = content.replace(/: any/g, '');
content = content.replace(/\?: /g, '');

// 4. 空白の多い行を整理
content = content.replace(/\n\n\n+/g, '\n\n');

// 5. 保存
fs.writeFileSync(distPath, content);

console.log('✅ 最終修正完了');
