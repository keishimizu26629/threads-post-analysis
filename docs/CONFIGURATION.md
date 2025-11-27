# 📝 設定情報の保持方法

## 🔐 APIキーとスプレッドシートIDの管理

このアプリケーションでは、機密情報を**Google Apps ScriptのPropertiesService**を使用して安全に保存しています。

---

## 🗄️ PropertiesServiceとは

Google Apps Scriptが提供する永続化ストレージサービスです。

### 特徴

- ✅ **暗号化**: データは自動的に暗号化されて保存
- ✅ **プロジェクト固有**: 各GASプロジェクト専用のストレージ
- ✅ **永続化**: スクリプト実行後もデータが保持される
- ✅ **高速**: メモリキャッシュで高速アクセス
- ✅ **セキュア**: GitHubなどにコードをpushしても機密情報は含まれない

---

## 📍 保存場所と仕組み

```typescript
// APIキーの保存
PropertiesService.getScriptProperties().setProperty('THREADS_API_KEY', apiKey);

// スプレッドシートIDの保存
PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', spreadsheetId);
```

### 保存先

**Google Apps Scriptのバックエンドサーバー**に保存されます。

- ❌ コードファイルには含まれない
- ❌ GitHubリポジトリには含まれない
- ✅ GASプロジェクト固有の安全な領域に保存

---

## 🔑 保存されるデータ

### 1. Threads APIキー

| プロパティキー | 説明 | 形式 |
|--------------|------|------|
| `THREADS_API_KEY` | Threads APIのアクセストークン | 文字列 (トリミング済み) |

**保存関数**: `saveApiKey(apiKey: string)`

```typescript
function saveApiKey(apiKey: string): { success: boolean; message: string } {
  try {
    if (!apiKey || apiKey.trim() === '') {
      return { success: false, message: 'APIキーが空です' };
    }

    PropertiesService.getScriptProperties().setProperty('THREADS_API_KEY', apiKey.trim());
    return { success: true, message: 'APIキーを保存しました' };
  } catch (error) {
    console.error('APIキー保存エラー:', error);
    return { success: false, message: 'APIキーの保存に失敗しました' };
  }
}
```

**取得関数**: `getApiKey(): string`

```typescript
function getApiKey(): string {
  try {
    return PropertiesService.getScriptProperties().getProperty('THREADS_API_KEY') || '';
  } catch (error) {
    console.error('APIキー取得エラー:', error);
    return '';
  }
}
```

---

### 2. スプレッドシートID

| プロパティキー | 説明 | 形式 |
|--------------|------|------|
| `SPREADSHEET_ID` | データ保存先のGoogleスプレッドシートID | 英数字、ハイフン、アンダースコア（20文字以上） |

**保存関数**: `saveSpreadsheetId(spreadsheetId: string)`

```typescript
function saveSpreadsheetId(spreadsheetId: string): { success: boolean; message: string } {
  try {
    if (!spreadsheetId || spreadsheetId.trim() === '') {
      return { success: false, message: 'スプレッドシートIDが空です' };
    }

    // スプレッドシートIDの形式チェック
    const trimmedId = spreadsheetId.trim();
    if (trimmedId.length < 20 || !/^[a-zA-Z0-9_-]+$/.test(trimmedId)) {
      return { success: false, message: '無効なスプレッドシートIDです' };
    }

    PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', trimmedId);
    console.log('スプレッドシートIDを保存しました:', trimmedId);
    return { success: true, message: 'スプレッドシートIDを保存しました' };
  } catch (error) {
    console.error('スプレッドシートID保存エラー:', error);
    return { success: false, message: 'スプレッドシートIDの保存に失敗しました' };
  }
}
```

**取得関数**: `getSpreadsheetId(): string | null`

```typescript
function getSpreadsheetId(): string | null {
  try {
    return PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  } catch (error) {
    console.error('スプレッドシートID取得エラー:', error);
    return null;
  }
}
```

---

## 🖥️ ユーザーインターフェース

### ダッシュボードの「設定」タブ

ユーザーは以下の操作が可能です：

1. **APIキーの入力**
   - テキストフィールドに入力
   - 「保存」ボタンでPropertiesServiceに保存

2. **スプレッドシートIDの入力**
   - テキストフィールドに入力
   - 形式バリデーション（20文字以上、英数字・記号のみ）
   - 「保存」ボタンでPropertiesServiceに保存

3. **現在の設定確認**
   - APIキー: 保存済みかどうかの状態表示（値は非表示）
   - スプレッドシートID: 保存済みの値を表示

---

## 🔄 データフロー

```
┌─────────────────┐
│  ユーザー入力   │
│  (dashboard.html)│
└────────┬────────┘
         │
         │ doPost()
         ↓
┌─────────────────┐
│  Code.ts        │
│  saveApiKey()   │
│  saveSpreadsheet│
│  Id()           │
└────────┬────────┘
         │
         │ setProperty()
         ↓
┌─────────────────┐
│ PropertiesService│
│ (GASバックエンド) │
└────────┬────────┘
         │
         │ getProperty()
         ↓
┌─────────────────┐
│  各種機能        │
│  - バッチ処理    │
│  - API呼び出し   │
│  - データ保存    │
└─────────────────┘
```

---

## 🛡️ セキュリティ対策

### 1. バリデーション

- APIキー: 空文字チェック、トリミング
- スプレッドシートID: 長さチェック（20文字以上）、形式チェック（英数字・記号のみ）

### 2. エラーハンドリング

```typescript
try {
  PropertiesService.getScriptProperties().setProperty(key, value);
  return { success: true, message: '保存しました' };
} catch (error) {
  console.error('保存エラー:', error);
  return { success: false, message: '保存に失敗しました' };
}
```

### 3. APIキーの非表示

- フロントエンドでは「保存済み」の状態のみ表示
- APIキーの実際の値は表示しない
- マスク表示: `●●●●●●●●●●●●`

---

## 📚 関連ファイル

### 実装ファイル

| ファイル | 説明 |
|---------|------|
| `src/Code.ts` | メインのAPI管理関数 |
| `src/dataManager.ts` | PropertiesServiceラッパークラス |
| `src/gasUtils.ts` | プロパティ操作のユーティリティ関数 |
| `src/spreadsheetManager.ts` | スプレッドシートID取得ロジック |
| `src/dashboard.html` | 設定UI（フロントエンド） |

### 主要な関数

```typescript
// Code.ts
- saveApiKey(apiKey: string)
- getApiKey(): string
- hasApiKey(): boolean
- deleteApiKey()
- saveSpreadsheetId(spreadsheetId: string)
- getSpreadsheetId(): string | null
- hasSpreadsheetId(): boolean
- deleteSpreadsheetId()

// gasUtils.ts
- getPropertySafely(key: string, defaultValue?: string): string
- setPropertySafely(key: string, value: string): boolean
- setPropertiesSafely(properties: object): boolean
- deletePropertySafely(key: string): boolean
```

---

## 🔍 デバッグ方法

### PropertiesServiceの内容を確認

Google Apps Scriptエディタで以下のスクリプトを実行：

```javascript
function debugProperties() {
  const props = PropertiesService.getScriptProperties();
  const allProps = props.getProperties();
  
  console.log('=== PropertiesService の内容 ===');
  console.log('THREADS_API_KEY:', allProps.THREADS_API_KEY ? '設定済み' : '未設定');
  console.log('SPREADSHEET_ID:', allProps.SPREADSHEET_ID || '未設定');
  console.log('全プロパティ:', Object.keys(allProps));
}
```

### 設定を手動でクリア

```javascript
function clearAllProperties() {
  const props = PropertiesService.getScriptProperties();
  props.deleteAllProperties();
  console.log('全てのプロパティを削除しました');
}
```

---

## ❓ よくある質問

### Q1: APIキーを変更するには？

A: ダッシュボードの「設定」タブで新しいAPIキーを入力して「保存」をクリックしてください。既存の値は上書きされます。

### Q2: 複数のプロジェクトで同じAPIキーを使えますか？

A: いいえ。PropertiesServiceはプロジェクト固有なので、各GASプロジェクトごとに設定が必要です。

### Q3: APIキーが漏洩するリスクは？

A: PropertiesServiceはGASのバックエンドで暗号化されて保存されます。コードをGitHubにpushしても含まれないため、安全です。

### Q4: スプレッドシートIDはどこで確認できますか？

A: GoogleスプレッドシートのURLから取得できます：
```
https://docs.google.com/spreadsheets/d/【この部分がID】/edit
```

### Q5: PropertiesServiceの容量制限は？

A: 1つのプロパティは最大9KBまで。合計で500KBまで保存可能です。このアプリケーションでは十分です。

---

**✅ まとめ**: APIキーとスプレッドシートIDは**PropertiesService**で安全に管理されており、コード内にハードコードされていません。ユーザーはダッシュボードから簡単に設定・変更できます。
