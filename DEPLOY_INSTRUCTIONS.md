# デプロイ手順

バッチ処理機能の実装が完了しましたが、TypeScriptからJavaScriptへの自動変換で構文エラーが発生しています。

以下の手順で手動デプロイを行ってください。

## 🚀 手動デプロイ手順

### 1. ターミナルを開く

```bash
cd /Users/keisukeshimizu/Development/operational_improvement/threads_post_analysis
```

### 2. clasp pushを実行

```bash
clasp push --force
```

もし構文エラーが出た場合は、以下の方法を試してください。

### 3. Google Apps Scriptエディタで直接編集

#### 方法A: claspコマンドでエディタを開く

```bash
clasp open
```

#### 方法B: 直接URLにアクセス

スクリプトID: `1gdJRvOdkDN-7vDUn4IfNkh07GYYyAFY84xbvryZjpRAxprypX6ZU_OpC`

URL: https://script.google.com/d/1gdJRvOdkDN-7vDUn4IfNkh07GYYyAFY84xbvryZjpRAxprypX6ZU_OpC/edit

### 4. srcファイルをコピー&ペースト

Google Apps Scriptエディタで、以下のファイルを個別にコピー&ペーストしてください：

1. **Code.gs** ← `src/Code.ts`の内容をコピー
2. **threadsApi.gs** ← `src/threadsApi.ts`の内容をコピー
3. **dataManager.gs** ← `src/dataManager.ts`の内容をコピー
4. **spreadsheetManager.gs** ← `src/spreadsheetManager.ts`の内容をコピー
5. **dataProcessor.gs** ← `src/dataProcessor.ts`の内容をコピー
6. **dashboard.html** ← `src/dashboard.html`の内容をコピー

**注意**: TypeScriptのコードをそのままコピーすると型エラーが出ますが、Google Apps Scriptは実行時に型を無視するため、ほとんどのコードは動作します。

### 5. 型注釈を手動で削除（必要な場合）

エラーが出た関数の型注釈を手動で削除してください：

#### 例：
```typescript
// 変更前
function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput {

// 変更後
function doGet(e) {
```

```typescript
// 変更前
function saveApiKey(apiKey: string): { success: boolean; message: string } {

// 変更後
function saveApiKey(apiKey) {
```

## 📝 実装完了した機能

### バッチ処理機能

1. **hourlyBatchDataCollection()** - 1時間毎の自動データ収集
2. **logBatchExecution()** - バッチ実行ログ記録
3. **cleanupOldLogs()** - 古いログの自動削除（90日以上前）
4. **getBatchExecutionStatusReal()** - バッチ実行統計の取得
5. **fetchUserPostsWithRetry()** - リトライ機能付き投稿取得
6. **fetchPostInsightsWithRetry()** - リトライ機能付きインサイト取得

### フロントエンドUI

- バッチ実行統計表示
- 最新10件のログ表示
- システム健全性表示
- リアルタイム更新機能

## 🧪 デプロイ後のテスト

### 1. 手動テスト

Google Apps Scriptエディタで以下を実行：

```javascript
testBatchExecution();
```

### 2. 自動トリガー設定

Webアプリの「設定」タブから：
1. 「自動実行を開始」ボタンをクリック
2. 1時間毎にバッチ処理が自動実行されます

### 3. 実行状況確認

「設定」タブの「実行状況を更新」ボタンをクリックして、統計情報とログを確認してください。

## ⚠️ トラブルシューティング

### 問題: 型エラーが出る

**解決策**: 該当行の型注釈（`: Type`）を削除してください。

### 問題: インポートエラーが出る

**解決策**: `import/export`文を削除してください。GASではモジュールシステムを使用しません。

### 問題: クラスが見つからない

**解決策**: すべてのファイルが正しくアップロードされているか確認してください。

## 📞 サポート

デプロイで問題が発生した場合は、以下の情報を提供してください：

1. エラーメッセージの全文
2. どのファイルでエラーが発生したか
3. エラーが発生した行番号

---

**実装完了日**: 2024年11月26日  
**プロジェクト進捗**: 75% (Phase 1-3 完了)
