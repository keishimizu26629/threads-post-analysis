# 🔄 動的データ読み込み機能

## 📋 概要

Webアプリ起動時に**スプレッドシートから自動的にデータを取得**してテーブルに表示する機能を実装しました。

### ✅ 変更内容

1. **デフォルトデータ削除**: HTMLテーブルの固定データ（サンプル投稿）を削除
2. **動的テーブル構築**: スプレッドシートのデータから動的にテーブルを生成
3. **起動時自動ロード**: Webアプリを開いた瞬間にデータを取得・表示

---

## 🔧 実装詳細

### フロントエンド (dashboard.html)

#### 1. HTMLテーブル構造の変更

**変更前**:
```html
<thead>
  <tr>
    <th>項目 / 投稿日時</th>
    <th>11/10<br />12:00</th>  <!-- 固定データ -->
    <th>11/11<br />20:00</th>  <!-- 固定データ -->
    <th>11/12<br />18:30</th>  <!-- 固定データ -->
  </tr>
</thead>
<tbody>
  <tr class="post-text-row">
    <th>投稿文</th>
    <td class="data-cell" data-metric="post_text"></td>  <!-- 固定セル -->
    <td class="data-cell" data-metric="post_text"></td>  <!-- 固定セル -->
    <td class="data-cell" data-metric="post_text"></td>  <!-- 固定セル -->
  </tr>
  <!-- ... -->
</tbody>
```

**変更後**:
```html
<thead>
  <tr id="table-header-row">
    <th>項目 / 投稿日時</th>
    <!-- スプレッドシートから取得したデータで動的に生成 -->
  </tr>
</thead>
<tbody id="table-body">
  <tr class="post-text-row">
    <th>投稿文</th>
    <!-- スプレッドシートから取得したデータで動的に生成 -->
  </tr>
  <tr>
    <th>文字数</th>
    <!-- スプレッドシートから取得したデータで動的に生成 -->
  </tr>
  <!-- ... -->
</tbody>
```

#### 2. 起動時データロード

```javascript
window.onload = function () {
  initializeApplication();
  setupStickyColumns();
  setupDateColumns();
  setupScrollSync();
  
  // スプレッドシートからデータを自動ロード
  loadInitialDataFromSpreadsheet();

  // 現在時刻を投稿日時入力フィールドのデフォルト値に設定
  var now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('post-datetime-input').value = now.toISOString().slice(0, 16);
};
```

#### 3. データ取得関数

```javascript
/**
 * スプレッドシートから初期データをロード
 */
function loadInitialDataFromSpreadsheet() {
  console.log('📥 スプレッドシートから初期データをロード開始');
  
  google.script.run
    .withSuccessHandler(function (result) {
      if (result.success && result.data && result.data.length > 0) {
        console.log('✅ データ取得成功:', result.data.length + '件');
        buildTableFromSpreadsheetData(result.data);
        updatePostTextCells();
      } else {
        console.log('ℹ️ データが見つかりません。空のテーブルを表示します。');
        showEmptyTableMessage();
      }
    })
    .withFailureHandler(function (error) {
      console.error('❌ データ取得エラー:', error);
      showEmptyTableMessage();
    })
    .getAllSpreadsheetData();
}
```

#### 4. テーブル構築関数

```javascript
/**
 * スプレッドシートデータからテーブルを構築
 */
function buildTableFromSpreadsheetData(data) {
  if (!data || data.length === 0) {
    showEmptyTableMessage();
    return;
  }

  // ヘッダー行を構築
  var headerRow = document.getElementById('table-header-row');
  headerRow.innerHTML = '<th>項目 / 投稿日時</th>';
  
  data.forEach(function (post) {
    var th = document.createElement('th');
    var postDate = new Date(post.timestamp);
    var dateStr = (postDate.getMonth() + 1) + '/' + postDate.getDate() + '<br />' +
                  postDate.getHours() + ':' + String(postDate.getMinutes()).padStart(2, '0');
    th.innerHTML = dateStr;
    th.classList.add('date-column');
    headerRow.appendChild(th);
  });

  // 各メトリック行にセルを追加
  var metrics = [
    { name: 'post_text', field: 'text' },
    { name: 'character_count', field: 'character_count' },
    { name: 'post_type', field: 'media_type' },
    { name: 'impressions', field: 'insights.views' },
    { name: 'likes', field: 'insights.likes' },
    { name: 'reposts', field: 'insights.reposts' },
    { name: 'replies', field: 'insights.replies' },
    { name: 'total_engagement', field: 'insights.total_engagement' },
    { name: 'engagement_rate', field: 'insights.engagement_rate' },
    { name: 'follower_count', field: 'insights.follower_count' }
  ];

  var tbody = document.getElementById('table-body');
  var rows = tbody.querySelectorAll('tr');
  
  metrics.forEach(function (metric) {
    var targetRow = findRowByMetric(rows, metric.name);
    
    if (targetRow) {
      // 新しいデータセルを追加
      data.forEach(function (post) {
        var td = document.createElement('td');
        td.classList.add('data-cell');
        td.setAttribute('data-metric', metric.name);
        
        var value = getNestedValue(post, metric.field);
        
        if (metric.name === 'post_text') {
          td.setAttribute('data-full-text', value || '');
          td.textContent = truncateText(value || '', 50);
          td.style.cursor = 'pointer';
          td.onclick = function () {
            showPostTextModal(this.getAttribute('data-full-text'));
          };
        } else if (metric.name === 'engagement_rate') {
          td.textContent = value ? value.toFixed(2) + '%' : '-';
        } else {
          td.textContent = value !== null && value !== undefined ? value : '-';
        }
        
        targetRow.appendChild(td);
      });
    }
  });

  // colspan を更新
  updateColspans(data.length);
}
```

#### 5. ユーティリティ関数

```javascript
/**
 * ネストされたオブジェクトから値を取得
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce(function (current, key) {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

/**
 * colspanを更新
 */
function updateColspans(dataCount) {
  var colspan = dataCount + 1; // +1 for header column
  var freeHeader = document.getElementById('free-data-header');
  if (freeHeader) {
    freeHeader.setAttribute('colspan', colspan);
  }
  
  var premiumHeaders = document.querySelectorAll('.time-header-row.premium-row th');
  premiumHeaders.forEach(function (header) {
    header.setAttribute('colspan', colspan);
  });
  
  var spacerRows = document.querySelectorAll('.spacer-row td');
  spacerRows.forEach(function (cell) {
    cell.setAttribute('colspan', colspan);
  });
}

/**
 * 空のテーブルメッセージを表示
 */
function showEmptyTableMessage() {
  var tbody = document.getElementById('table-body');
  var messageRow = document.createElement('tr');
  var messageCell = document.createElement('td');
  messageCell.setAttribute('colspan', '10');
  messageCell.style.textAlign = 'center';
  messageCell.style.padding = '40px';
  messageCell.style.color = '#666';
  messageCell.innerHTML = '📭 データがありません<br><br>「設定」タブでAPIキーとスプレッドシートIDを設定後、<br>「🚀 データ取得・保存を実行」ボタンでデータを取得してください。';
  messageRow.appendChild(messageCell);
  tbody.insertBefore(messageRow, tbody.firstChild);
}
```

---

### バックエンド (Code.ts)

#### getAllSpreadsheetData() 関数

```typescript
/**
 * スプレッドシートから全データを取得
 * Webアプリ起動時に使用
 */
function getAllSpreadsheetData(): { success: boolean; message?: string; data?: any[] } {
  try {
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
      return { success: false, message: 'スプレッドシートIDが設定されていません' };
    }

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const dataSheet = spreadsheet.getSheetByName('threads_data');
    
    if (!dataSheet) {
      console.log('threads_dataシートが見つかりません');
      return { success: true, data: [] };
    }

    const lastRow = dataSheet.getLastRow();
    if (lastRow < 2) {
      console.log('データが存在しません');
      return { success: true, data: [] };
    }

    // ヘッダー行を取得
    const headers = dataSheet.getRange(1, 1, 1, dataSheet.getLastColumn()).getValues()[0];
    
    // データ行を取得
    const dataRange = dataSheet.getRange(2, 1, lastRow - 1, headers.length);
    const values = dataRange.getValues();

    // データをオブジェクト配列に変換
    const data = values.map((row: any[]) => {
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        obj[header] = row[index];
      });
      
      // insights をパース
      if (obj.insights && typeof obj.insights === 'string') {
        try {
          obj.insights = JSON.parse(obj.insights);
        } catch (e) {
          console.error('insights パースエラー:', e);
          obj.insights = {};
        }
      }
      
      return obj;
    });

    // タイムスタンプ順でソート（新しい順）
    data.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    });

    console.log(`✅ スプレッドシートから${data.length}件のデータを取得しました`);
    return { success: true, data: data };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('スプレッドシートデータ取得エラー:', error);
    return { success: false, message: 'データ取得エラー: ' + errorMessage };
  }
}
```

---

## 🔄 データフロー

```
┌─────────────────────────────┐
│  ユーザーがWebアプリを開く    │
└──────────┬──────────────────┘
           │
           ↓
┌─────────────────────────────┐
│  window.onload 実行          │
│  loadInitialDataFromSpreadsheet() │
└──────────┬──────────────────┘
           │
           ↓
┌─────────────────────────────┐
│  google.script.run           │
│  .getAllSpreadsheetData()    │
└──────────┬──────────────────┘
           │
           ↓
┌─────────────────────────────┐
│  Code.ts                     │
│  getAllSpreadsheetData()     │
│  - スプレッドシートID確認    │
│  - threads_dataシートを開く  │
│  - 全データを取得             │
│  - JSONパース                │
│  - ソート（新しい順）         │
└──────────┬──────────────────┘
           │
           ↓
┌─────────────────────────────┐
│  データ返却                   │
│  { success: true, data: [...] }│
└──────────┬──────────────────┘
           │
           ↓
┌─────────────────────────────┐
│  buildTableFromSpreadsheetData()│
│  - ヘッダー行を動的生成       │
│  - データセルを動的生成       │
│  - colspanを更新             │
└──────────┬──────────────────┘
           │
           ↓
┌─────────────────────────────┐
│  テーブル表示完了             │
│  （スプレッドシートのデータ） │
└─────────────────────────────┘
```

---

## 📊 表示されるデータ

### テーブルヘッダー

- **項目 / 投稿日時**: 固定
- **各投稿の日時**: スプレッドシートの`timestamp`から生成
  - 例: `11/26 14:30`

### テーブル行

| メトリック名 | スプレッドシートのフィールド | 表示形式 |
|------------|--------------------------|---------|
| 投稿文 | `text` | 50文字でトランケート、クリックでモーダル表示 |
| 文字数 | `character_count` | 数値 |
| タイプ | `media_type` | TEXT/IMAGE/VIDEO |
| インプ(12h) | `insights.views` | 数値 |
| いいね(12h) | `insights.likes` | 数値 |
| 再投稿/引用(12h) | `insights.reposts` | 数値 |
| リプライ(12h) | `insights.replies` | 数値 |
| Eng総数(12h) | `insights.total_engagement` | 数値 |
| Eng率(12h) | `insights.engagement_rate` | パーセント表示（小数点2桁） |
| 総フォロワー(12h) | `insights.follower_count` | 数値 |

---

## 🎯 ユースケース

### ケース1: 初回起動（データなし）

1. Webアプリを開く
2. `getAllSpreadsheetData()`が実行される
3. スプレッドシートにデータがない
4. 空のメッセージが表示される

```
📭 データがありません

「設定」タブでAPIキーとスプレッドシートIDを設定後、
「🚀 データ取得・保存を実行」ボタンでデータを取得してください。
```

### ケース2: データあり

1. Webアプリを開く
2. `getAllSpreadsheetData()`が実行される
3. スプレッドシートから3件のデータを取得
4. テーブルが動的に構築される

**表示例**:

| 項目 / 投稿日時 | 11/26 14:30 | 11/25 10:00 | 11/24 18:45 |
|---------------|------------|------------|------------|
| 投稿文 | こんにちは... | 今日は... | お疲れ様... |
| 文字数 | 120 | 85 | 95 |
| インプ(12h) | 1,250 | 890 | 1,100 |
| いいね(12h) | 45 | 32 | 38 |

### ケース3: データ更新後

1. 「🚀 データ取得・保存を実行」ボタンをクリック
2. 新しいデータがスプレッドシートに保存される
3. `refreshTableData()`が自動実行される
4. テーブルが最新データで更新される

---

## 🆚 変更前後の比較

| 項目 | 変更前 | 変更後 |
|------|--------|--------|
| テーブルデータ | HTMLに固定 | スプレッドシートから動的取得 |
| 起動時の表示 | 固定サンプルデータ | 実際のスプレッドシートデータ |
| データ更新 | 手動でリロード必要 | 自動リフレッシュ |
| 空データ時 | 空のセル表示 | メッセージ表示 |
| 投稿数 | 固定3列 | 可変（データ件数に応じて） |

---

## ✅ メリット

1. **リアルタイム反映**: スプレッドシートの最新データが常に表示される
2. **柔軟性**: 投稿数に応じてテーブルが自動調整される
3. **UX向上**: データがない場合は分かりやすいメッセージを表示
4. **保守性向上**: HTMLに固定データを書く必要がない

---

## 🚀 デプロイ完了

```bash
✅ Pushed 11 files.
└─ dist/Code.js (getAllSpreadsheetData 追加)
└─ dist/dashboard.html (動的テーブル構築機能追加)
```

**すべて完了！Webアプリを開くと自動的にスプレッドシートからデータが読み込まれます。**
