# 🚀 手動データ取得機能

## 概要

バッチ処理（自動実行）とは別に、**手動でデータを取得・保存できるボタン**を追加しました。

---

## 📍 場所

ダッシュボードの**「設定」タブ** → **「🧪 手動データ取得」セクション**

---

## 🔘 ボタンの種類

### 1. 🚀 データ取得・保存を実行

**機能**: 
- Threads APIから投稿データを取得
- インサイト情報も同時に取得
- スプレッドシートに自動保存
- バッチ処理と同じ処理を手動で実行

**使い方**:
1. APIキーとスプレッドシートIDが設定済みであることを確認
2. 「🚀 データ取得・保存を実行」ボタンをクリック
3. 処理中は「⏳ 実行中...」と表示される
4. 完了すると「✅ データ取得・保存成功！ X件保存しました」と表示
5. テーブルが自動でリフレッシュされる

**注意**:
- 実行中はボタンが無効化されます
- 処理には10〜30秒かかります
- 失敗した場合はエラーメッセージが表示されます

---

### 2. 📊 API接続テスト（表示のみ）

**機能**:
- Threads APIに接続してデータを取得
- 取得したデータを画面に表示
- **スプレッドシートには保存しない**（テスト用）

**使い方**:
1. APIキーが設定済みであることを確認
2. 「📊 API接続テスト（表示のみ）」ボタンをクリック
3. 取得したデータが画面に表示される

**用途**:
- API接続が正常に動作するか確認
- APIキーが正しいか確認
- データの形式を確認

---

## 🔄 データフロー

```
[ユーザーがボタンクリック]
       ↓
[manualFetchAndSave() 実行]
       ↓
[hourlyBatchDataCollection() を呼び出し]
       ↓
[Threads APIからデータ取得]
       ↓
[スプレッドシートに保存]
       ↓
[結果を画面に表示]
       ↓
[テーブル自動リフレッシュ]
```

---

## 💻 技術仕様

### フロントエンド (dashboard.html)

```javascript
function manualFetchAndSave() {
  addDebugLog('🚀 手動データ取得・保存開始', 'info');
  showTestStatus('loading', '🔄 実行中...');

  // ボタンを無効化
  document.getElementById('manual-fetch-btn').disabled = true;
  document.getElementById('manual-fetch-btn').textContent = '⏳ 実行中...';

  google.script.run
    .withSuccessHandler(function (result) {
      document.getElementById('manual-fetch-btn').disabled = false;
      document.getElementById('manual-fetch-btn').textContent = '🚀 データ取得・保存を実行';

      if (result.success) {
        showTestStatus('success', '✅ データ取得・保存成功！ ' + (result.count || 0) + '件保存しました');
        addDebugLog('✅ 手動実行成功: ' + (result.count || 0) + '件', 'success');
        
        // テーブルをリフレッシュ
        refreshTableData();
      } else {
        showTestStatus('error', '❌ 失敗: ' + result.message);
        addDebugLog('❌ 手動実行失敗: ' + result.message, 'error');
      }
    })
    .withFailureHandler(function (error) {
      document.getElementById('manual-fetch-btn').disabled = false;
      document.getElementById('manual-fetch-btn').textContent = '🚀 データ取得・保存を実行';
      
      showTestStatus('error', '❌ エラー: ' + error.message);
      addDebugLog('❌ 手動実行エラー: ' + error.message, 'error');
    })
    .hourlyBatchDataCollection();
}
```

### バックエンド (Code.ts)

```typescript
function hourlyBatchDataCollection(): { success: boolean; message?: string; count?: number } {
  const executionId = Utilities.getUuid();
  const startTime = new Date();
  
  try {
    // APIキーとスプレッドシートIDの確認
    // Threads APIからデータ取得
    // スプレッドシートに保存
    // ログ記録
    
    return { success: true, message: logMessage, count: processedPosts.length };
    
  } catch (error) {
    return { success: false, message: 'バッチ処理エラー: ' + errorMessage };
  }
}
```

**変更点**:
- 戻り値の型を `void` から `{ success: boolean; message?: string; count?: number }` に変更
- 各エラーケースで適切な戻り値を返すように修正
- 成功時に処理件数を返すように修正

---

## 🆚 バッチ処理との違い

| 項目 | 手動実行 | バッチ処理（自動実行） |
|------|----------|---------------------|
| 実行タイミング | ユーザーがボタンクリック | 1時間毎に自動実行 |
| 実行方法 | 画面からワンクリック | トリガーによる自動実行 |
| 結果表示 | 画面に即座に表示 | ログシートに記録 |
| 用途 | テスト・手動更新 | 定期的なデータ収集 |
| データ保存 | ✅ 保存する | ✅ 保存する |
| 処理内容 | 🔄 同じ | 🔄 同じ |

**共通点**:
- 同じ `hourlyBatchDataCollection()` 関数を使用
- データ取得・保存の処理内容は完全に同じ
- ログも同様に記録される

---

## 📊 使用例

### ケース1: 初回設定後の動作確認

1. APIキーとスプレッドシートIDを設定
2. 「🚀 データ取得・保存を実行」をクリック
3. 正常に動作するか確認
4. スプレッドシートを開いてデータが保存されているか確認

### ケース2: APIキーの変更後

1. 新しいAPIキーを設定
2. 「📊 API接続テスト（表示のみ）」をクリック
3. 正常に接続できるか確認
4. 「🚀 データ取得・保存を実行」で実際にデータを保存

### ケース3: 緊急データ更新

1. 自動バッチ処理を待たずにデータを更新したい
2. 「🚀 データ取得・保存を実行」をクリック
3. 最新データが即座に取得・保存される

---

## 🛡️ エラーハンドリング

### エラー1: APIキーが未設定

```
❌ 失敗: APIキーが設定されていません
```

**解決策**: 設定タブでAPIキーを入力して保存

### エラー2: スプレッドシートIDが未設定

```
❌ 失敗: スプレッドシートIDが設定されていません
```

**解決策**: 設定タブでスプレッドシートIDを入力して保存

### エラー3: API接続エラー

```
❌ 失敗: 投稿データの取得に失敗: Invalid access token
```

**解決策**: APIキーが正しいか確認、必要に応じて再取得

### エラー4: スプレッドシート保存エラー

```
❌ 失敗: スプレッドシートへの保存に失敗: Permission denied
```

**解決策**: スプレッドシートの編集権限を確認

---

## 📝 ログ記録

手動実行でも自動実行と同様に、`logs`シートに詳細ログが記録されます。

**記録内容**:
- 実行ID
- 実行日時
- ログレベル (SUCCESS / ERROR)
- 処理タイプ (BATCH_COMPLETED / API_KEY_NOT_SET 等)
- メッセージ
- 実行時間 (ミリ秒)
- 処理件数
- エラー詳細

---

## 🎯 まとめ

✅ **手動実行ボタンを追加**: 「🚀 データ取得・保存を実行」  
✅ **API接続テストボタンを改善**: 「📊 API接続テスト（表示のみ）」  
✅ **バッチ処理関数を改良**: 戻り値を返すように修正  
✅ **UIフィードバック**: ボタン状態、ローディング、成功/エラー表示  
✅ **自動リフレッシュ**: 成功時にテーブルを自動更新  
✅ **スプレッドシートID設定の重複を解消**: 1箇所に統合  

**使いやすさが大幅に向上しました！**
