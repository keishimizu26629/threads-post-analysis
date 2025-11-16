module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
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
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'no-console': 'off'
  }
};
