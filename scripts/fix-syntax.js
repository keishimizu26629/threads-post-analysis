/**
 * 構文エラー修正スクリプト
 */

const fs = require('fs');
const path = require('path');

const codeJsPath = path.join(__dirname, '../dist/Code.js');

console.log('🔧 構文エラーを修正中...');

let content = fs.readFileSync(codeJsPath, 'utf8');

// 1. 関数定義の戻り値型を削除（残っているもの）
// function name() { type; type; ... } { を function name() { に変更
const lines = content.split('\n');
const fixedLines = lines.map(line => {
  // function name() { ... } { のパターン
  if (line.match(/^function\s+\w+\([^)]*\)\s*\{[^{]+\{/)) {
    return line.replace(/^(function\s+\w+\([^)]*\))\s*\{[^{]+\{/, '$1 {');
  }
  return line;
});

content = fixedLines.join('\n');

// 2. tryが欠落している関数を修正
// doPost関数のtryを追加
content = content.replace(
  /function doPost\(e\) \{\s*\/\/ eがundefinedの場合のハンドリング/,
  'function doPost(e) {\n  try {\n    // eがundefinedの場合のハンドリング'
);

// 3. include関数のtryを追加
content = content.replace(
  /function include\(filename\) \{\s*return HtmlService/,
  'function include(filename) {\n  try {\n    return HtmlService'
);

// 4. その他の関数にtryがあるか確認して追加
const functionsNeedingTry = [
  'saveApiKey',
  'getApiKey', 
  'hasApiKey',
  'deleteApiKey',
  'saveSpreadsheetId',
  'getSpreadsheetId',
  'hasSpreadsheetId',
  'deleteSpreadsheetId',
  'testSpreadsheetAccess',
  'testThreadsApiConnection',
  'fetchAndUpdateTableData',
  'getPostData',
  'saveDataToSpreadsheet',
  'batchSaveDataToSpreadsheet',
  'getTimeSeriesData',
  'getSpreadsheetStatistics',
  'fetchAndSaveToSpreadsheet',
  'updateSettings',
  'runAnalysis',
  'getAnalysisData',
  'getSystemStatus',
  'initializeSpreadsheetDatabase',
  'setupBatchTrigger',
  'getBatchTriggerStatus',
  'removeBatchTrigger',
  'getBatchExecutionStatus',
];

functionsNeedingTry.forEach(funcName => {
  // function name(...) { の直後にtryがない場合は追加
  const regex = new RegExp(`function ${funcName}\\([^)]*\\) \\{\\s*(?!try)`, 'g');
  content = content.replace(regex, `function ${funcName}($&) {\n  try {`);
});

// 5. catchとの対応を確認（簡易版）
// 各関数の最後にcatchがあるか確認は難しいので、手動確認が必要

fs.writeFileSync(codeJsPath, content);

console.log('✅ 構文エラー修正完了！');

// 構文チェック
const { execSync } = require('child_process');
try {
  execSync('node -c Code.js', { cwd: path.join(__dirname, '../dist'), stdio: 'inherit' });
  console.log('✅ 構文チェック OK！');
} catch (error) {
  console.error('❌ まだ構文エラーがあります');
  process.exit(1);
}
