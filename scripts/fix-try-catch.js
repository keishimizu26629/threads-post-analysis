/**
 * dist/Code.jsのtry-catchブロックを修正
 */

const fs = require('fs');
const path = require('path');

const codeJsPath = path.join(__dirname, '../dist/Code.js');

console.log('🔧 try-catchブロック修正を開始...');

let content = fs.readFileSync(codeJsPath, 'utf8');

// 1. function name() { return ... } catch (error) パターンを修正
// tryが欠けている関数を検出して追加
content = content.replace(
  /(function \w+\([^)]*\) \{)\n(?!  try \{)((?:(?!function|catch)[\s\S])*?)(  \} catch \(error\))/gm,
  '$1\n  try {\n$2$3'
);

// 2. 戻り値型の残骸を削除: function name() { type: type } {
content = content.replace(/function (\w+)\([^)]*\) \{[^{]+\} \{/g, 'function $1() {');

// 3. 不正な型注釈を削除
content = content.replace(/\{ success: boolean; message: string \}/g, '');
content = content.replace(/\{ success: boolean; data\?: \w+; message\?: string \}/g, '');
content = content.replace(/\{ success: boolean; message\?: string; count\?: number \}/g, '');
content = content.replace(/\{ success: boolean; data\?: any; message\?: string \}/g, '');

// 4. オブジェクト短縮記法の削除（文字列リテラル内の値が残る問題）
// { success, message ) → { success: false, message: '...' })
// { success, data ) → { success: true, data: data })
content = content.replace(/\{ success, message\s*\)/g, '{ success: false, message: \'postIdが指定されていません\' })');
content = content.replace(/\{ success, data\s*\)/g, '{ success: true, data: data })');
content = content.replace(/\{ success, error,\s*\}/g, '{ success: false, error: errorMessage }');

fs.writeFileSync(codeJsPath, content);

console.log('✅ try-catchブロック修正完了');
