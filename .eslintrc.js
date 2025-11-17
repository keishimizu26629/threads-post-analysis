module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'script',
    project: './tsconfig.json'
  },
  env: {
    node: true,
    es6: true
  },
  globals: {
    // Google Apps Script globals
    'PropertiesService': 'readonly',
    'HtmlService': 'readonly',
    'ContentService': 'readonly',
    'UrlFetchApp': 'readonly',
    'Utilities': 'readonly',
    'ScriptApp': 'readonly',
    'DriveApp': 'readonly',
    'SpreadsheetApp': 'readonly',
    'Charts': 'readonly',
    'console': 'readonly'
  },
  rules: {
    'prettier/prettier': 'error',
    // GAS環境では型情報が不完全なため、anyの使用を警告レベルに下げる
    '@typescript-eslint/no-explicit-any': 'off', // GAS環境では必要に応じてanyを使用
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        // GAS特有の関数（doGet, doPost等）とユーティリティ関数は未使用警告を無視
        varsIgnorePattern: '^(doGet|doPost|include|main|runDailyAnalysis|generateWeeklyReport|saveApiKey|hasApiKey|deleteApiKey|testThreadsApiConnection|fetchAndUpdateTableData|getPostData|updateSettings|runAnalysis|getAnalysisData|fetchUserInfo|fetchUserPosts|fetchPostInsights|convertInsightsToMetrics|DataManager|DataProcessor|ReportGenerator|TriggerManager|setPropertiesSafely|deletePropertySafely|fetchUrlSafely|formatDateSafely|isExecutionTimeExceeded|getSpreadsheetSafely|getSheetSafely|debugLog|logError)$',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }
    ],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'no-console': 'off',
    // GAS環境での特別なルール
    'no-var': 'error', // varの使用を禁止（letまたはconstを使用）
    'prefer-const': 'error', // 再代入されない変数はconstを使用
    'no-unused-expressions': 'off' // GASでは式文が有効な場合がある
  }
};
