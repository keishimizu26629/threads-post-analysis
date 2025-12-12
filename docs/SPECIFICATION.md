# Threads投稿分析ツール - 技術仕様書

## 📋 概要

### プロジェクト名
**Threads投稿分析ツール (Threads Post Analysis Tool)**

### 目的
Threads（Meta）の投稿データを定期的に収集・分析し、エンゲージメント指標を可視化するWebアプリケーション

### 対象ユーザー
- ThreadsでSNSマーケティングを行う個人・企業
- 投稿のパフォーマンスを数値で追跡したいクリエイター

---

## 🏗️ システムアーキテクチャ

### 全体構成

```
┌─────────────────────────────────────────────────┐
│           ユーザー（ブラウザ）                    │
└────────────────┬────────────────────────────────┘
                 │ HTTPS
                 ↓
┌─────────────────────────────────────────────────┐
│    Frontend: Google Apps Script Web App         │
│    - dashboard.html (UI)                        │
│    - JavaScript (Client-side)                   │
└────────────────┬────────────────────────────────┘
                 │ google.script.run
                 ↓
┌─────────────────────────────────────────────────┐
│    Backend: Google Apps Script (TypeScript)     │
│    - Code.ts (Main Entry)                       │
│    - threadsApi.ts (API Communication)          │
│    - dataProcessor.ts (Data Analysis)           │
│    - spreadsheetManager.ts (DB Operations)      │
│    - triggerManager.ts (Batch Jobs)             │
│    - reportGenerator.ts (Report Creation)       │
└────────────────┬────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ↓            ↓            ↓
┌─────────┐ ┌─────────┐ ┌─────────────────┐
│ Threads │ │ Props   │ │ Google Sheets   │
│   API   │ │ Service │ │   (Database)    │
└─────────┘ └─────────┘ └─────────────────┘
  外部API      設定保存     データ永続化
```

---

## 🖥️ Frontend仕様（GAS Webアプリ）

### 技術スタック
- **HTML5**: 構造
- **CSS3**: スタイリング（Material Design風）
- **Vanilla JavaScript**: インタラクション
- **GAS Client API**: `google.script.run` でサーバーサイド関数呼び出し

### 画面構成

#### 1. ダッシュボードタブ
**目的**: 現在の状態表示と主要アクション

| 要素 | 説明 | 機能 |
|------|------|------|
| フォロワー数表示 | 最新のフォロワー数を大きく表示 | リアルタイム取得 |
| 分析実行ボタン | 手動でバッチ分析を実行 | `runAnalysis()` 呼び出し |
| 最終更新日時 | 最後に分析した日時を表示 | PropertiesServiceから取得 |
| ステータス表示 | 実行中/完了/エラーの状態 | 非同期処理の進捗 |

#### 2. データタブ（メインテーブル）
**目的**: 投稿データの一覧表示

**テーブル構成**:

| カラム名 | 説明 | データ型 | 表示形式 |
|---------|------|---------|---------|
| 投稿日時 | 投稿が公開された日時 | DateTime | `YYYY-MM-DD HH:mm` |
| 投稿文 | 投稿のテキスト内容 | String | 最大50文字（以降は省略） |
| 文字数 | 投稿の文字数 | Number | 整数 |
| タイプ | 投稿タイプ | String | `TEXT`, `IMAGE`, `VIDEO`, `CAROUSEL` |
| いいね (12h) | 12時間後のいいね数 | Number | カンマ区切り |
| リプライ (12h) | 12時間後のリプライ数 | Number | カンマ区切り |
| シェア (12h) | 12時間後のシェア数 | Number | カンマ区切り |
| インプレッション (12h) | 12時間後のインプレッション数 | Number | カンマ区切り |
| エンゲージメント率 | `(いいね+リプライ+シェア) / インプレッション × 100` | Number | パーセント（小数点1桁） |

**機能**:
- **ソート**: 各カラムヘッダーをクリックで昇順/降順切り替え
- **ハイライト**: 平均値を超える数値を緑背景で強調
- **ページネーション**: 1ページ50件表示
- **検索**: 投稿文で絞り込み

#### 3. 設定タブ
**目的**: API設定とシステム設定

| 項目 | 説明 | バリデーション |
|------|------|--------------|
| Threads API Key | Threads APIのアクセストークン | 必須、空文字チェック |
| Threads User ID | 分析対象のユーザーID | 必須、数値のみ |
| Spreadsheet ID | データ保存先のスプレッドシートID | 必須、20文字以上、英数字・記号のみ |
| ハイライト閾値 | 平均値の何%以上を強調するか | 0-200%（デフォルト100%） |

**保存ボタン**: 各項目の保存ボタンで `PropertiesService` に保存

#### 4. グラフタブ（時系列可視化）
**目的**: 投稿ごとのメトリクス推移を折れ線グラフで表示

**機能**:
| 項目 | 説明 |
|------|------|
| 投稿選択ドロップダウン | 表示する投稿を選択 |
| メトリクス選択 | インプレッション、いいね、コメント、シェア、エンゲージメント率から選択 |
| 折れ線グラフ | Chart.jsで時系列グラフを描画 |
| マウスホバー | 各データポイントで詳細情報を表示（フォロワー数、経過時間など） |
| 複数投稿比較 | 最大5件の投稿を同時表示 |

**グラフ仕様**:
- **X軸**: 取得時刻（`captured_at`）または投稿からの経過時間（`hours_since_post`）
- **Y軸**: 選択したメトリクス
- **線の色**: 投稿ごとに異なる色（自動割り当て）
- **ツールチップ**: `投稿ID: xxx / 時刻: 2024-11-27 15:00 / インプレッション: 1,250 / フォロワー数: 1,520`

**実装例（Chart.js）**:
```javascript
async function loadTimeSeriesChart(postId) {
  // バックエンドからデータ取得
  const data = await google.script.run.withSuccessHandler((result) => {
    renderChart(result);
  }).getMetricsByPostId(postId);
}

function renderChart(metrics) {
  const ctx = document.getElementById('timeSeriesChart').getContext('2d');
  
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: metrics.map(m => formatDate(m.capturedAt)),
      datasets: [{
        label: 'インプレッション',
        data: metrics.map(m => m.impressions),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            afterBody: (context) => {
              const index = context[0].dataIndex;
              const metric = metrics[index];
              return [
                `フォロワー数: ${metric.followerCount.toLocaleString()}`,
                `投稿からの経過: ${metric.hoursSincePost}時間`,
                `エンゲージメント率: ${metric.engagementRate.toFixed(2)}%`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: '取得時刻' }
        },
        y: {
          title: { display: true, text: 'インプレッション数' },
          beginAtZero: true
        }
      }
    }
  });
}
```

**データ取得API**:
```javascript
// WebアプリのdoGet()でJSON返却
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getMetrics') {
    const postId = e.parameter.postId;
    const data = getMetricsByPostId(postId);
    
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'getAllMetrics') {
    const data = getMetricsForLast7Days();
    
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // デフォルト: HTMLアプリ表示
  return HtmlService.createHtmlOutputFromFile('dashboard');
}
```

#### 5. レポートタブ（プレミアム版）
**目的**: 月次サマリーとランキング

| セクション | 説明 |
|-----------|------|
| 月間サマリー | 投稿数、平均エンゲージメント率、フォロワー増加数 |
| 人気投稿Top10 | エンゲージメント率が高い投稿 |
| 投稿時間帯分析 | 曜日・時間帯別の平均エンゲージメント率 |
| トレンド推移 | 過去3ヶ月の推移グラフ |

---

## 🔧 Backend仕様（Google Apps Script）

### 技術スタック
- **言語**: TypeScript（コンパイル→JavaScript）
- **ランタイム**: Google Apps Script V8
- **ビルドツール**: clasp（Google公式CLI）
- **依存関係管理**: npm（開発時のみ）

### ファイル構成

```
src/
├── appsscript.json          # GAS設定ファイル
├── Code.ts                  # エントリーポイント・doGet/doPost
├── types.ts                 # 型定義
├── dashboard.html           # フロントエンド
├── threadsApi.ts            # Threads API通信
├── dataProcessor.ts         # データ分析・加工
├── spreadsheetManager.ts    # スプレッドシート操作
├── dataManager.ts           # PropertiesService管理
├── triggerManager.ts        # トリガー（スケジューラー）管理
├── reportGenerator.ts       # レポート生成
└── gasUtils.ts              # 汎用ユーティリティ
```

### 主要モジュール仕様

#### 1. Code.ts（エントリーポイント）

**役割**: Webアプリのエンドポイント、外部からの呼び出しハンドリング

```typescript
// Webアプリ表示
function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput

// クライアントからのリクエスト処理
function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput

// API設定保存
function saveApiKey(apiKey: string): { success: boolean; message: string }
function saveUserId(userId: string): { success: boolean; message: string }
function saveSpreadsheetId(spreadsheetId: string): { success: boolean; message: string }

// 設定取得
function getApiKey(): string
function getUserId(): string
function getSpreadsheetId(): string | null

// 分析実行
function runAnalysis(): { success: boolean; message: string; data?: any }
function getLatestData(): any[]
function getFollowerCount(): number
```

#### 2. threadsApi.ts（Threads API通信）

**役割**: Threads Graph APIとの通信

```typescript
class ThreadsApi {
  private apiKey: string;
  private userId: string;
  
  constructor(apiKey: string, userId: string);
  
  // ユーザー情報取得
  getUserProfile(): {
    id: string;
    username: string;
    followers_count: number;
    profile_picture_url: string;
  }
  
  // 投稿一覧取得（ページネーション対応）
  getThreads(limit: number = 100, before?: string): {
    data: Thread[];
    paging?: {
      cursors: {
        before: string;
        after: string;
      };
    };
  }
  
  // 投稿詳細取得（インサイト含む）
  getThreadInsights(threadId: string): {
    id: string;
    text: string;
    timestamp: string;
    media_type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL';
    likes_count: number;
    replies_count: number;
    reposts_count: number;
    impressions: number;
    engagement_rate: number;
  }
  
  // レート制限処理
  private waitForRateLimit(): void;
  
  // エラーハンドリング
  private handleApiError(error: any): void;
}
```

**API仕様**:
- **ベースURL**: `https://graph.threads.net/v1.0`
- **認証**: Bearerトークン（APIキー）
- **レート制限**: 200リクエスト/時間
- **リトライ**: 429エラー時は60秒待機

#### 3. spreadsheetManager.ts（スプレッドシート操作）

**役割**: Google Sheetsをデータベースとして操作

```typescript
class SpreadsheetManager {
  private spreadsheetId: string;
  private sheet: GoogleAppsScript.Spreadsheet.Sheet;
  
  constructor(spreadsheetId: string);
  
  // シート初期化（ヘッダー作成）
  initializeSheet(sheetName: string): void;
  
  // データ追加（行単位）
  appendRow(data: any[]): void;
  
  // データ更新（既存行）
  updateRow(rowIndex: number, data: any[]): void;
  
  // データ取得（全件）
  getAllData(): any[][];
  
  // データ取得（条件付き）
  getDataByDate(startDate: Date, endDate: Date): any[][];
  
  // 投稿IDで検索
  findRowByThreadId(threadId: string): number | null;
  
  // データ削除
  deleteRow(rowIndex: number): void;
  
  // シートクリア
  clearSheet(keepHeader: boolean = true): void;
  
  // バッチ書き込み（高速化）
  batchWrite(data: any[][]): void;
}
```

**シート構成**:

| シート名 | 説明 | カラム |
|---------|------|--------|
| `posts` | 投稿データ統合テーブル | post_id, platform, account_id, posted_at, content, url, char_count, media_type, hashtags, time_category, impressions, likes, comments, shares, follower_count, engagement_rate, captured_at, created_at, updated_at |
| `profile` | プロフィール情報 | date, followers_count, username, profile_url |
| `config` | システム設定 | key, value, updated_at |
| `logs` | 実行ログ | timestamp, level, message, error |

#### 4. dataProcessor.ts（データ分析・加工）

**役割**: 取得したデータの加工・分析

```typescript
class DataProcessor {
  // エンゲージメント率計算
  calculateEngagementRate(likes: number, replies: number, shares: number, impressions: number): number;
  
  // 平均値計算
  calculateAverages(data: any[]): {
    avgLikes: number;
    avgReplies: number;
    avgShares: number;
    avgEngagementRate: number;
  }
  
  // ハイライト対象判定
  shouldHighlight(value: number, average: number, threshold: number = 1.0): boolean;
  
  // 投稿タイプ判定
  detectMediaType(text: string, mediaUrl?: string): 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  
  // 文字数カウント（絵文字対応）
  countCharacters(text: string): number;
  
  // 投稿時間帯分析
  analyzePostingTimes(data: any[]): {
    byHour: { [hour: string]: number };
    byDay: { [day: string]: number };
  }
  
  // トレンド分析
  analyzeTrend(data: any[], metric: string): {
    trend: 'up' | 'down' | 'stable';
    changeRate: number;
  }
}
```

#### 5. triggerManager.ts（トリガー管理）

**役割**: 定期実行のスケジューリング

```typescript
class TriggerManager {
  // 日次トリガー設定（毎日9:00）
  static setupDailyTrigger(functionName: string, hour: number): void;
  
  // 週次トリガー設定（月曜10:00）
  static setupWeeklyTrigger(functionName: string, weekDay: GoogleAppsScript.Script.WeekDay, hour: number): void;
  
  // 月次トリガー設定（1日10:00）
  static setupMonthlyTrigger(functionName: string, dayOfMonth: number, hour: number): void;
  
  // 既存トリガー削除
  static deleteTrigger(functionName: string): void;
  
  // 全トリガー一覧取得
  static listAllTriggers(): GoogleAppsScript.Script.Trigger[];
  
  // トリガー削除（全て）
  static deleteAllTriggers(): void;
}
```

**デフォルト設定**:
- **日次バッチ**: 毎日9:00に `runDailyAnalysis()` 実行
- **週次レポート**: 月曜10:00に `generateWeeklyReport()` 実行
- **月次レポート**: 毎月1日10:00に `generateMonthlyReport()` 実行

#### 6. reportGenerator.ts（レポート生成）

**役割**: 分析レポートの生成

```typescript
class ReportGenerator {
  // 週次レポート生成
  generateWeeklyReport(startDate: Date, endDate: Date): {
    totalPosts: number;
    averageEngagement: number;
    topPost: any;
    followerGrowth: number;
  }
  
  // 月次レポート生成
  generateMonthlyReport(year: number, month: number): {
    totalPosts: number;
    averageEngagement: number;
    topPosts: any[];
    postingTimeAnalysis: any;
    trend: any;
  }
  
  // レポートをHTMLで出力
  exportToHtml(report: any): string;
  
  // レポートをメール送信
  sendReportEmail(recipient: string, report: any): void;
}
```

#### 7. gasUtils.ts（汎用ユーティリティ）

```typescript
// PropertiesService安全操作
function getPropertySafely(key: string, defaultValue?: string): string;
function setPropertySafely(key: string, value: string): boolean;
function deletePropertySafely(key: string): boolean;

// 日時操作
function formatDate(date: Date, format: string): string;
function addHours(date: Date, hours: number): Date;
function isWithinTimeRange(date: Date, startDate: Date, endDate: Date): boolean;

// ログ出力
function logInfo(message: string): void;
function logError(message: string, error: any): void;
function logWarning(message: string): void;

// データバリデーション
function validateApiKey(apiKey: string): boolean;
function validateSpreadsheetId(id: string): boolean;
function validateUserId(userId: string): boolean;
```

---

## 🗄️ Database仕様（Google Sheets）

### スプレッドシート構成

#### 🎯 時間区分ベースのデータ収集設計思想

このシステムでは、**投稿ごとのメトリクスを時間区分（0, 1, 12, 24, 72時間）で管理**する設計を採用しています。

**設計方針**:
- ✅ **1つのテーブルで管理**: 投稿情報とメトリクスを統合
- ✅ **時間区分カラム（time_category）**: 
  - `0` = 最新データ（常に更新される）
  - `1` = 投稿1時間後の確定値
  - `12` = 投稿12時間後の確定値
  - `24` = 投稿24時間後の確定値
  - `72` = 投稿72時間後の確定値
- ✅ **効率的なデータ管理**: 1投稿につき最大5レコード
- ✅ **シンプルな構造**: 複数シートのJOINが不要
- ✅ **フロントエンド対応**: `time_category=0`で最新データ一覧表示、特定`post_id`で時系列グラフ表示

**データ保存期間**: 過去7日分（自動削除）

**複合キー**: `post_id` + `time_category` (UNIQUE)

---

#### シート: `posts`（投稿データ統合テーブル）

**役割**: 投稿情報と時系列メトリクスを1つのテーブルで管理

| カラム | 列名 | データ型 | 説明 | 例 |
|-------|------|---------|------|-----|
| A | post_id | String | 投稿ID（複合キーの一部） | `1234567890123456789` |
| B | content | String | 投稿本文 | `こんにちは！今日は...` |
| C | posted_at | DateTime | 投稿日時（JST） | `2024-12-11 10:00:00` |
| D | captured_at | DateTime | 取得日時 | `2024-12-11 11:00:00` |
| E | likes | Number | いいね数 | `45` |
| F | impressions | Number | インプレッション数（views） | `1250` |
| G | time_category | Number | 表示カテゴリ（複合キーの一部）<br>0=最新データ, 1/12/24/72=各時点の確定値 | `0` |
| H | replies | Number | リプライ数 | `8` |
| I | reposts | Number | 再投稿数 | `3` |
| J | quotes | Number | 引用数 | `1` |
| K | engagement_rate | String | エンゲージメント率（%） | `4.48` |
| L | created_at | DateTime | レコード作成日時 | `2024-12-11 11:00:00` |
| M | updated_at | DateTime | レコード更新日時 | `2024-12-11 12:00:00` |

**複合キー**: `post_id` + `time_category` (UNIQUE)

**1投稿あたりのレコード数**: 最大5レコード
- `time_category=0`: 最新データ（常に更新）
- `time_category=1`: 投稿1時間後の確定値
- `time_category=12`: 投稿12時間後の確定値
- `time_category=24`: 投稿24時間後の確定値
- `time_category=72`: 投稿72時間後の確定値

**時間区分の定義**:
- **0（リアルタイム）**: 投稿直後、または1, 12, 24, 72時間に該当しない場合
- **1**: 投稿から1時間経過時点
- **12**: 投稿から12時間経過時点
- **24**: 投稿から24時間経過時点
- **72**: 投稿から72時間経過時点

**データ更新ロジック**:
1. 投稿一覧を取得し、各投稿の投稿日時を確認
2. 現在時刻から投稿日時を引き、経過時間を計算
3. 経過時間が1, 12, 24, 72時間のいずれかに該当する場合:
   - 該当する時間区分のレコードが存在するか確認（`post_id` + `time_category`）
   - 存在する場合は更新、存在しない場合は新規追加
4. 経過時間が1, 12, 24, 72時間に該当しない場合:
   - `time_category = 0` のレコードを更新（存在しない場合は追加）

**データ追加タイミング**: 
- 1時間ごとの定期実行時に新規投稿を検知し、メトリクスを取得
- 手動で「分析実行」ボタンを押した時

---

#### シート: `account_metrics_hourly`（時系列アカウントメトリクス）※任意

**役割**: アカウント全体のメトリクスを1時間単位で記録

| カラム | 列名 | データ型 | 説明 | 例 |
|-------|------|---------|------|-----|
| A | account_id | String | アカウントID | `987654321` |
| B | captured_at | DateTime | 取得時刻（1時間単位） | `2024-11-27 15:00:00` |
| C | follower_count | Number | フォロワー数 | `1520` |
| D | total_impressions | Number | 1時間で発生した合計インプレッション | `3500` |
| E | profile_views | Number | プロフィールビュー数 | `120` |
| F | total_posts | Number | 累計投稿数 | `450` |

**キー**: `account_id` + `captured_at`

---

#### シート: `profile`（プロフィール情報）※レガシー

**役割**: 日次のプロフィール情報を保存（後方互換性のため残す）

| カラム | 列名 | データ型 | 説明 | 例 |
|-------|------|---------|------|-----|
| A | date | Date | 記録日 | `2024-11-27` |
| B | followers_count | Number | フォロワー数 | `1520` |
| C | username | String | ユーザー名 | `@example` |
| D | profile_url | String | プロフィールURL | `https://threads.net/@example` |

---

#### シート: `config`（システム設定）

| カラム | 列名 | データ型 | 説明 | 例 |
|-------|------|---------|------|-----|
| A | key | String | 設定キー | `last_run_time` |
| B | value | String | 設定値 | `2024-11-27 15:00:00` |
| C | updated_at | DateTime | 更新日時 | `2024-11-27 15:00:00` |

**設定キー一覧**:
- `last_run_time`: 最終実行時刻
- `avg_likes`: 平均いいね数
- `avg_engagement_rate`: 平均エンゲージメント率
- `data_retention_days`: データ保存期間（デフォルト: 7日）

---

#### シート: `logs`（実行ログ）

| カラム | 列名 | データ型 | 説明 | 例 |
|-------|------|---------|------|-----|
| A | timestamp | DateTime | ログ日時 | `2024-11-27 15:00:15` |
| B | level | String | ログレベル | `INFO`, `ERROR`, `WARNING` |
| C | message | String | メッセージ | `時系列データ収集完了: 15件` |
| D | function_name | String | 関数名 | `fetchMetricsHourly` |
| E | error | String | エラー詳細（あれば） | `API rate limit exceeded` |

### データアクセスパターン

#### 1. 時間区分ベースのメトリクス収集（1時間ごと）

**処理フロー**:
```typescript
function fetchMetricsHourly(): { success: boolean; message: string; count: number } {
  try {
    const now = new Date();
    const sheet = SpreadsheetApp.getActive().getSheetByName('posts');
    
    // 1. Threads APIから投稿一覧を取得
    const threads = threadsApi.getThreads(100);
    
    let updatedCount = 0;
    
    // 2. 各投稿を順に確認
    for (const thread of threads.data) {
      const postedAt = new Date(thread.timestamp);
      
      // 投稿からの経過時間を計算（時間単位）
      const hoursSincePost = Math.floor(
        (now.getTime() - postedAt.getTime()) / (1000 * 60 * 60)
      );
      
      // 時間区分を決定
      let timeCategory: number;
      if (hoursSincePost >= 1 && hoursSincePost < 2) {
        timeCategory = 1;
      } else if (hoursSincePost >= 12 && hoursSincePost < 13) {
        timeCategory = 12;
      } else if (hoursSincePost >= 24 && hoursSincePost < 25) {
        timeCategory = 24;
      } else if (hoursSincePost >= 72 && hoursSincePost < 73) {
        timeCategory = 72;
      } else {
        timeCategory = 0; // リアルタイムまたは該当しない場合
      }
      
      // 3. メトリクスをAPI取得
      const insights = threadsApi.getThreadInsights(thread.id);
      
      // 4. 既存レコードを検索（post_id + time_category）
      const existingRow = findPostRow(sheet, thread.id, timeCategory);
      
      const rowData = [
        thread.id,                                    // post_id
        'threads',                                    // platform
        thread.account_id,                            // account_id
        postedAt,                                     // posted_at
        thread.text,                                  // content
        `https://threads.net/@${thread.username}/post/${thread.id}`, // url
        dataProcessor.countCharacters(thread.text),   // char_count
        thread.media_type,                            // media_type
        extractHashtags(thread.text).join(','),      // hashtags
        timeCategory,                                 // time_category
        insights.impressions,                         // impressions
        insights.likes_count,                         // likes
        insights.replies_count,                       // comments
        insights.reposts_count,                       // shares
        insights.follower_count,                      // follower_count
        dataProcessor.calculateEngagementRate(
          insights.likes_count,
          insights.replies_count,
          insights.reposts_count,
          insights.impressions
        ),                                           // engagement_rate
        now,                                          // captured_at
        existingRow ? null : now,                     // created_at（既存の場合は更新しない）
        now                                           // updated_at
      ];
      
      if (existingRow === null) {
        // 新規レコードを追加
        sheet.appendRow(rowData);
        updatedCount++;
      } else {
        // 既存レコードを更新（created_atは保持）
        const existingCreatedAt = sheet.getRange(existingRow, 18).getValue(); // R列: created_at
        rowData[17] = existingCreatedAt; // created_atを保持
        sheet.getRange(existingRow, 1, 1, 19).setValues([rowData]);
        updatedCount++;
      }
      
      // レート制限対策: 18秒間隔
      Utilities.sleep(18000);
    }
    
    // 5. 7日より古いデータを削除
    deleteOldPosts(sheet, 7);
    
    // 6. ログ記録
    logInfo(`メトリクス収集完了: ${updatedCount}件`, 'fetchMetricsHourly');
    
    return { success: true, message: `${updatedCount}件のメトリクスを収集しました`, count: updatedCount };
    
  } catch (error) {
    logError('メトリクス収集エラー', error, 'fetchMetricsHourly');
    return { success: false, message: `エラー: ${error.message}`, count: 0 };
  }
}

// 既存レコードを検索（post_id + time_category）
function findPostRow(sheet: GoogleAppsScript.Spreadsheet.Sheet, postId: string, timeCategory: number): number | null {
  const values = sheet.getDataRange().getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === postId && values[i][9] === timeCategory) { // A列: post_id, J列: time_category
      return i + 1; // 1-based index
    }
  }
  
  return null;
}

// 古いデータを削除
function deleteOldPosts(sheet: GoogleAppsScript.Spreadsheet.Sheet, retentionDays: number): void {
  const values = sheet.getDataRange().getValues();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  // 削除対象行を逆順で削除（行番号がずれないように）
  for (let i = values.length - 1; i >= 1; i--) {
    const postedAt = new Date(values[i][3]); // D列: posted_at
    if (postedAt < cutoffDate) {
      sheet.deleteRow(i + 1);
    }
  }
}
```

#### 2. 投稿ごとのメトリクス取得（時間区分別）

```typescript
function getMetricsByPostId(postId: string): any[] {
  const sheet = SpreadsheetApp.getActive().getSheetByName('posts');
  const values = sheet.getDataRange().getValues();
  
  const result = [];
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === postId) { // A列: post_id
      result.push({
        postId: values[i][0],
        timeCategory: values[i][9],        // J列: time_category
        impressions: values[i][10],          // K列: impressions
        likes: values[i][11],                // L列: likes
        comments: values[i][12],             // M列: comments
        shares: values[i][13],               // N列: shares
        followerCount: values[i][14],        // O列: follower_count
        engagementRate: values[i][15],       // P列: engagement_rate
        capturedAt: values[i][16]            // Q列: captured_at
      });
    }
  }
  
  // 時間区分順にソート（0, 1, 12, 24, 72）
  result.sort((a, b) => a.timeCategory - b.timeCategory);
  
  return result;
}
```

#### 3. 特定時間区分のメトリクス取得

```typescript
function getMetricsByTimeCategory(timeCategory: number): any[] {
  const sheet = SpreadsheetApp.getActive().getSheetByName('posts');
  const values = sheet.getDataRange().getValues();
  
  const result = [];
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][9] === timeCategory) { // J列: time_category
      result.push({
        postId: values[i][0],
        postedAt: values[i][3],
        content: values[i][4],
        impressions: values[i][10],
        likes: values[i][11],
        comments: values[i][12],
        shares: values[i][13],
        engagementRate: values[i][15]
      });
    }
  }
  
  return result;
}
```

#### 5. 月次レポート用データ取得

```typescript
// 1. 期間指定でデータ取得
const startDate = new Date(2024, 10, 1); // 2024年11月1日
const endDate = new Date(2024, 10, 30); // 2024年11月30日
const monthData = spreadsheetManager.getDataByDate(startDate, endDate);

// 2. データ分析
const report = reportGenerator.generateMonthlyReport(2024, 11);

// 3. レポート保存
spreadsheetManager.appendRow([
  'monthly_report',
  JSON.stringify(report),
  new Date()
]);
```

---

## 🔐 セキュリティ仕様

### 1. 認証・認可

#### Webアプリのアクセス制御
- **実行ユーザー**: スクリプト所有者（`USER_DEPLOYING`）
- **アクセス権限**: 匿名アクセス可能（`ANYONE_ANONYMOUS`）
- **理由**: 個人用ツールのため、URLを知っている人のみアクセス可能で十分

**変更方法**:
```json
// appsscript.json
{
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"  // または "MYSELF"（本人のみ）
  }
}
```

### 2. APIキーの安全な保管

#### PropertiesServiceの使用
```typescript
// 保存（暗号化）
PropertiesService.getScriptProperties().setProperty('THREADS_API_KEY', apiKey);

// 取得
const apiKey = PropertiesService.getScriptProperties().getProperty('THREADS_API_KEY');

// 削除
PropertiesService.getScriptProperties().deleteProperty('THREADS_API_KEY');
```

#### セキュリティ特性
- ✅ **サーバーサイド保存**: Googleのサーバーで暗号化
- ✅ **GitHubに含まれない**: コードと分離
- ✅ **ブラウザに非露出**: HTMLソースコードに表示されない
- ✅ **プロジェクト固有**: 他のGASプロジェクトからアクセス不可

#### 注意事項
- ❌ **プロジェクト共有禁止**: GASプロジェクトを他者と共有しない
- ⚠️ **定期的なローテーション**: 3-6ヶ月ごとにAPIキーを更新
- 🔒 **漏洩時の対応**: 即座にThreads Developer Consoleで無効化

### 3. スプレッドシートのアクセス制御

#### 推奨設定
- **共有設定**: 「リンクを知っている全員（閲覧のみ）」または「特定のユーザーのみ」
- **編集権限**: スクリプト所有者のみ
- **理由**: データの不正改ざん防止

#### スクリプトからのアクセス
```typescript
// スプレッドシートIDを使用してアクセス
const spreadsheet = SpreadsheetApp.openById(spreadsheetId);

// 権限チェック
if (!spreadsheet) {
  throw new Error('スプレッドシートにアクセスできません');
}
```

### 4. エラーハンドリングとログ

#### エラーハンドリングパターン
```typescript
function safeApiCall<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (error) {
    console.error('エラーが発生しました:', error);
    logError('API呼び出しエラー', error);
    return fallback;
  }
}
```

#### ログ記録
```typescript
function logError(message: string, error: any): void {
  const logSheet = SpreadsheetApp.openById(getSpreadsheetId()).getSheetByName('logs');
  logSheet.appendRow([
    new Date(),
    'ERROR',
    message,
    JSON.stringify(error)
  ]);
}
```

---

## 🔄 バッチ処理仕様

### トリガー一覧

| トリガー名 | 実行頻度 | 実行時刻 | 関数名 | 目的 |
|-----------|---------|---------|--------|------|
| 時系列メトリクス収集 | 1時間ごと | 毎時0分 | `fetchMetricsHourly()` | 過去7日以内の全投稿のメトリクスを収集 |
| 日次分析 | 毎日 | 9:00 | `runDailyAnalysis()` | 新規投稿の追加、プロフィール情報更新 |
| 週次レポート | 毎週月曜 | 10:00 | `generateWeeklyReport()` | 週次サマリーレポート生成 |
| 月次レポート | 毎月1日 | 10:00 | `generateMonthlyReport()` | 月次詳細レポート生成 |

---

### 時間区分ベースのメトリクス収集（1時間ごと）

#### `fetchMetricsHourly()`の処理フロー

```
1. Threads APIから投稿一覧を取得
   └─ threadsApi.getThreads(100)

2. 各投稿を順に確認
   ├─ 投稿日時から経過時間を計算
   └─ 時間区分を決定（0, 1, 12, 24, 72）

3. 各投稿のメトリクスをAPI取得
   ├─ threadsApi.getThreadInsights(post_id)
   ├─ レート制限対策: 18秒間隔（200リクエスト/時間）
   └─ フォロワー数も同時に取得

4. postsシートに保存
   ├─ 重複チェック（post_id × time_category）
   ├─ 既存レコードがあれば更新
   └─ なければ新規追加

5. 古いデータの削除
   ├─ posted_at < (現在 - 7日) のデータを削除
   └─ データ肥大化防止

6. ログ記録
   └─ 収集件数、エラーをlogsシートに記録
```

#### トリガー設定方法

```javascript
function setupHourlyTrigger() {
  // 既存のトリガーを削除
  TriggerManager.deleteTrigger('fetchMetricsHourly');
  
  // 1時間ごとのトリガーを設定
  ScriptApp.newTrigger('fetchMetricsHourly')
    .timeBased()
    .everyHours(1)
    .create();
  
  console.log('時系列メトリクス収集トリガーを設定しました');
}
```

#### 実行時間の目安

| 投稿数 | API呼び出し時間 | データ保存時間 | 合計 |
|-------|----------------|---------------|------|
| 10件 | 約3分 | 約10秒 | **約3分10秒** |
| 30件 | 約9分 | 約30秒 | **約9分30秒** |
| 50件 | 約15分 | 約50秒 | **約15分50秒** |

**注意**: GASの最大実行時間は6分（無料版）または30分（Workspace）。投稿数が多い場合はバッチ分割を検討。

---

### 日次バッチ（毎日9:00実行）

#### `runDailyAnalysis()`の処理フロー

```
1. 設定チェック
   ├─ APIキーの存在確認
   ├─ スプレッドシートIDの存在確認
   └─ エラーの場合は処理中断

2. プロフィール情報更新
   ├─ threadsApi.getUserProfile() 呼び出し
   ├─ フォロワー数取得
   └─ profileシートに保存

3. 新規投稿データ取得
   ├─ threadsApi.getThreads(100) 呼び出し
   ├─ 過去24時間の投稿を対象
   └─ postsシートに追加

4. 既存投稿のインサイト更新
   ├─ 12時間前、24時間前、72時間前、7日前の投稿を抽出
   ├─ threadsApi.getThreadInsights(threadId) 呼び出し
   └─ postsシートを更新

5. 平均値計算
   ├─ dataProcessor.calculateAverages() 呼び出し
   ├─ 過去30日分の平均を計算
   └─ configシートに保存

6. ログ記録
   ├─ 処理時間、取得件数を記録
   └─ logsシートに保存
```

#### 実装例
```typescript
function runDailyAnalysis(): { success: boolean; message: string } {
  try {
    // 1. 設定チェック
    const apiKey = getApiKey();
    const userId = getUserId();
    const spreadsheetId = getSpreadsheetId();
    
    if (!apiKey || !userId || !spreadsheetId) {
      throw new Error('設定が不完全です');
    }
    
    // 2. 初期化
    const api = new ThreadsApi(apiKey, userId);
    const manager = new SpreadsheetManager(spreadsheetId);
    const processor = new DataProcessor();
    
    // 3. プロフィール更新
    const profile = api.getUserProfile();
    manager.initializeSheet('profile');
    manager.appendRow([
      new Date(),
      profile.followers_count,
      profile.username,
      `https://threads.net/@${profile.username}`
    ]);
    
    // 4. 新規投稿取得
    const threads = api.getThreads(100);
    for (const thread of threads.data) {
      const existingRow = manager.findRowByThreadId(thread.id);
      if (existingRow === null) {
        manager.appendRow([
          thread.id,
          thread.timestamp,
          thread.text,
          processor.countCharacters(thread.text),
          thread.media_type,
          0, 0, 0, 0, 0, // 初期値
          new Date(),
          new Date()
        ]);
      }
    }
    
    // 5. インサイト更新
    const now = new Date();
    const allData = manager.getAllData();
    
    for (let i = 1; i < allData.length; i++) {
      const postDate = new Date(allData[i][1]);
      const hoursSincePost = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSincePost >= 12 && hoursSincePost < 13) {
        const insights = api.getThreadInsights(allData[i][0]);
        manager.updateRow(i + 1, [
          allData[i][0],
          allData[i][1],
          allData[i][2],
          allData[i][3],
          allData[i][4],
          insights.likes_count,
          insights.replies_count,
          insights.reposts_count,
          insights.impressions,
          processor.calculateEngagementRate(
            insights.likes_count,
            insights.replies_count,
            insights.reposts_count,
            insights.impressions
          ),
          allData[i][10],
          new Date()
        ]);
      }
    }
    
    // 6. 平均値計算
    const averages = processor.calculateAverages(allData);
    setPropertySafely('avg_likes', averages.avgLikes.toString());
    setPropertySafely('avg_engagement_rate', averages.avgEngagementRate.toString());
    
    // 7. ログ記録
    logInfo('日次分析が完了しました');
    
    return { success: true, message: '分析が完了しました' };
    
  } catch (error) {
    logError('日次分析エラー', error);
    return { success: false, message: `エラー: ${error.message}` };
  }
}
```

### 週次バッチ（月曜10:00実行）

#### `generateWeeklyReport()`の処理フロー

```
1. 期間設定
   └─ 前週の月曜〜日曜

2. データ取得
   └─ spreadsheetManager.getDataByDate() で1週間分取得

3. レポート生成
   ├─ 総投稿数
   ├─ 平均エンゲージメント率
   ├─ 最も反応が良かった投稿
   └─ フォロワー増加数

4. メール送信（オプション）
   └─ reportGenerator.sendReportEmail()
```

### 月次バッチ（毎月1日10:00実行）

#### `generateMonthlyReport()`の処理フロー

```
1. 期間設定
   └─ 前月1日〜末日

2. データ取得
   └─ spreadsheetManager.getDataByDate() で1ヶ月分取得

3. 詳細分析
   ├─ 月間サマリー
   ├─ 人気投稿Top10
   ├─ 投稿時間帯分析
   └─ トレンド推移

4. レポート保存
   └─ HTMLファイルとして出力
```

---

## 🚀 デプロイ手順

### 1. 開発環境セットアップ

```bash
# リポジトリクローン
git clone <repository-url>
cd threads_post_analysis

# Node.js依存関係インストール
npm install

# claspでGoogleアカウントにログイン
clasp login

# Google Apps Script APIを有効化
# https://script.google.com/home/usersettings
```

### 2. GASプロジェクト作成

```bash
# 新しいプロジェクトを作成
clasp create --title "Threads投稿分析ツール" --type standalone

# .clasp.jsonが自動生成される
```

### 3. TypeScriptビルド＆デプロイ

```bash
# TypeScriptをコンパイル
npm run build

# GASにプッシュ
clasp push

# または一括実行
npm run push
```

### 4. Webアプリデプロイ

1. GASエディタを開く: `clasp open`
2. 「デプロイ」→「新しいデプロイ」をクリック
3. 「種類を選択」→「ウェブアプリ」を選択
4. 設定:
   - **説明**: `初回デプロイ`
   - **次のユーザーとして実行**: `自分`
   - **アクセスできるユーザー**: `全員`（または `自分のみ`）
5. 「デプロイ」をクリック
6. **デプロイID**と**WebアプリのURL**をコピー

### 5. スプレッドシート作成

1. Google Sheetsで新しいスプレッドシートを作成
2. シート名を以下に変更:
   - `posts`
   - `profile`
   - `config`
   - `logs`
3. スプレッドシートのURLからIDをコピー:
   ```
   https://docs.google.com/spreadsheets/d/{スプレッドシートID}/edit
   ```

### 6. Webアプリで初期設定

1. WebアプリのURLにアクセス
2. 「設定」タブを開く
3. 以下を入力:
   - **Threads API Key**: Threads Developer Consoleで取得
   - **Threads User ID**: 自分のThreadsユーザーID
   - **Spreadsheet ID**: 手順5でコピーしたID
4. 各「保存」ボタンをクリック

### 7. トリガー設定

GASエディタで以下のスクリプトを実行:

```javascript
function setupAllTriggers() {
  // 日次バッチ（毎日9:00）
  TriggerManager.setupDailyTrigger('runDailyAnalysis', 9);
  
  // 週次レポート（月曜10:00）
  TriggerManager.setupWeeklyTrigger('generateWeeklyReport', ScriptApp.WeekDay.MONDAY, 10);
  
  // 月次レポート（毎月1日10:00）
  TriggerManager.setupMonthlyTrigger('generateMonthlyReport', 1, 10);
  
  console.log('全てのトリガーを設定しました');
}
```

### 8. 動作確認

1. ダッシュボードタブで「分析を実行」ボタンをクリック
2. 数秒後、「データ」タブに投稿データが表示されることを確認
3. スプレッドシートにデータが保存されていることを確認

---

## 🧪 テスト

### 手動テスト項目

#### フロントエンド
- [ ] ダッシュボードタブが正しく表示される
- [ ] データタブでテーブルが表示される
- [ ] 設定タブでAPIキーを保存できる
- [ ] 分析実行ボタンが動作する
- [ ] ソート機能が動作する
- [ ] ハイライト機能が動作する

#### バックエンド
- [ ] `runAnalysis()` が正常に実行される
- [ ] Threads APIから投稿データを取得できる
- [ ] スプレッドシートにデータが保存される
- [ ] エラーハンドリングが動作する
- [ ] トリガーが正しく設定される

### GASエディタでのテスト

```javascript
// APIキー保存テスト
function testSaveApiKey() {
  const result = saveApiKey('test_api_key_12345');
  console.log(result);
}

// データ取得テスト
function testGetThreads() {
  const api = new ThreadsApi(getApiKey(), getUserId());
  const threads = api.getThreads(10);
  console.log(threads);
}

// スプレッドシート書き込みテスト
function testSpreadsheetWrite() {
  const manager = new SpreadsheetManager(getSpreadsheetId());
  manager.initializeSheet('posts');
  manager.appendRow(['test_id', new Date(), 'テスト投稿', 5, 'TEXT', 0, 0, 0, 0, 0, new Date(), new Date()]);
}
```

---

## 📊 パフォーマンス仕様

### 処理時間の目標

| 処理 | 目標時間 | 備考 |
|-----|---------|------|
| Webアプリ初回表示 | < 3秒 | HTMLロード＋初期データ取得 |
| データタブ表示 | < 2秒 | 100件のデータ表示 |
| 分析実行（100件） | < 30秒 | API呼び出し＋データ保存 |
| 月次レポート生成 | < 60秒 | 1ヶ月分（最大3000件）の分析 |

### 最適化手法

#### 1. バッチ書き込み
```typescript
// 悪い例（1行ずつ書き込み）
for (const data of dataArray) {
  sheet.appendRow(data); // 毎回API呼び出し
}

// 良い例（一括書き込み）
const batchData = dataArray.map(d => [d.id, d.name, d.value]);
sheet.getRange(2, 1, batchData.length, batchData[0].length).setValues(batchData);
```

#### 2. キャッシュの活用
```typescript
const cache = CacheService.getScriptCache();

// キャッシュから取得
let data = cache.get('follower_count');
if (!data) {
  // APIから取得
  data = api.getUserProfile().followers_count;
  // 1時間キャッシュ
  cache.put('follower_count', data, 3600);
}
```

#### 3. レート制限対応
```typescript
private waitForRateLimit(): void {
  const lastCallTime = parseInt(CacheService.getScriptCache().get('last_api_call') || '0');
  const now = Date.now();
  const minInterval = 18000; // 18秒（200リクエスト/時間）
  
  if (now - lastCallTime < minInterval) {
    Utilities.sleep(minInterval - (now - lastCallTime));
  }
  
  CacheService.getScriptCache().put('last_api_call', now.toString(), 3600);
}
```

---

## ⚠️ 運用注意点 & 拡張案

### 運用上の注意点

#### 1. API制限とレート対策

| 項目 | 制限 | 対策 |
|------|------|------|
| Threads API | 200リクエスト/時間 | 18秒間隔で呼び出し |
| GAS実行時間 | 6分（無料）/ 30分（Workspace） | 投稿数が多い場合はバッチ分割 |
| スプレッドシート書き込み | 制限なし | バッチ書き込みで高速化 |

**投稿数が多い場合の対策**:
```javascript
function fetchMetricsHourlyBatch() {
  const posts = getRecentPosts(7);
  const batchSize = 15; // 1回のバッチで15件まで（約4.5分）
  
  const batches = [];
  for (let i = 0; i < posts.length; i += batchSize) {
    batches.push(posts.slice(i, i + batchSize));
  }
  
  // 最初のバッチのみ実行（次回のトリガーで続きを実行）
  const batchIndex = parseInt(PropertiesService.getScriptProperties().getProperty('batch_index') || '0');
  
  if (batchIndex < batches.length) {
    fetchMetricsBatch(batches[batchIndex]);
    PropertiesService.getScriptProperties().setProperty('batch_index', (batchIndex + 1).toString());
  } else {
    // 全バッチ完了
    PropertiesService.getScriptProperties().setProperty('batch_index', '0');
  }
}
```

#### 2. データ肥大化対策

**問題**: `post_metrics_hourly`シートが肥大化する

**対策**:
- ✅ **7日以上のデータは自動削除**: `deleteOldMetrics()`で実装済み
- ✅ **月次バックアップ**: 月初に別シート（`archive_YYYYMM`）にコピー
- ✅ **BigQueryへエクスポート**: 長期保存が必要な場合はBigQueryへ移行

```javascript
function archiveMonthlyData() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('post_metrics_hourly');
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const archiveSheetName = `archive_${lastMonth.getFullYear()}${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  const archiveSheet = SpreadsheetApp.getActive().insertSheet(archiveSheetName);
  
  // データをコピー
  const values = sheet.getDataRange().getValues();
  const archiveData = values.filter((row, index) => {
    if (index === 0) return true; // ヘッダー
    const capturedAt = new Date(row[1]);
    return capturedAt.getMonth() === lastMonth.getMonth();
  });
  
  archiveSheet.getRange(1, 1, archiveData.length, archiveData[0].length).setValues(archiveData);
}
```

#### 3. タイムゾーン統一

**重要**: スプレッドシートとGASのタイムゾーンを **JST（Asia/Tokyo）** に統一

**設定方法**:
1. **appsscript.json**:
```json
{
  "timeZone": "Asia/Tokyo"
}
```

2. **スプレッドシートのタイムゾーン**:
   - ファイル → 設定 → タイムゾーン → `(GMT+09:00) 東京`

#### 4. エラー通知

**推奨**: バッチ処理でエラーが発生した場合、メール通知を送信

```javascript
function sendErrorNotification(error: any, functionName: string): void {
  const recipient = Session.getActiveUser().getEmail();
  const subject = `【エラー】Threads分析ツール - ${functionName}`;
  const body = `
エラーが発生しました。

関数名: ${functionName}
時刻: ${new Date().toLocaleString('ja-JP')}
エラー: ${error.message}
スタックトレース: ${error.stack}

ログを確認してください。
  `;
  
  MailApp.sendEmail(recipient, subject, body);
}
```

---

### 将来の拡張案

#### 1. BigQuery連携

**目的**: 長期データの保存と高速分析

**実装方針**:
- GASから定期的にBigQueryにデータをエクスポート
- Looker StudioでダッシュボードPlaを作成

```javascript
function exportToBigQuery() {
  const projectId = 'your-project-id';
  const datasetId = 'threads_analysis';
  const tableId = 'post_metrics_hourly';
  
  const sheet = SpreadsheetApp.getActive().getSheetByName('post_metrics_hourly');
  const values = sheet.getDataRange().getValues();
  
  // BigQuery APIで挿入（省略）
}
```

#### 2. Firestore連携

**目的**: リアルタイム性の向上

**実装方針**:
- GASからFirestoreにデータを保存
- Webアプリでリアルタイム更新

#### 3. マルチアカウント対応

**目的**: 複数のThreadsアカウントを一元管理

**実装方針**:
- `accounts`シートを追加
- UIでアカウント切り替え機能を実装

#### 4. 競合分析機能

**目的**: 競合アカウントのメトリクスも収集・比較

**実装方針**:
- Threads APIで他アカウントの公開データを取得
- 比較グラフを表示

#### 5. AI分析機能

**目的**: 投稿内容とエンゲージメントの相関分析

**実装方針**:
- Gemini APIで投稿文をトピック分類
- トピックごとのエンゲージメント率を分析
- おすすめの投稿時間・内容を提案

---

### パフォーマンス最適化チェックリスト

- [ ] バッチ書き込みを使用している
- [ ] 不要なAPI呼び出しを削減している
- [ ] CacheServiceを活用している
- [ ] レート制限に対応している
- [ ] 古いデータを定期的に削除している
- [ ] スプレッドシートの範囲を適切に指定している（`getDataRange()`の乱用を避ける）

---

## 📝 開発ガイドライン

### コーディング規約

#### 命名規則
- **関数名**: キャメルケース（`getUserProfile`, `calculateEngagementRate`）
- **クラス名**: パスカルケース（`ThreadsApi`, `SpreadsheetManager`）
- **定数**: アッパースネークケース（`API_BASE_URL`, `MAX_RETRIES`）
- **ファイル名**: キャメルケース（`threadsApi.ts`, `dataProcessor.ts`）

#### コメント
- 日本語で記述
- 関数の上に説明コメントを必ず記述
- 複雑なロジックには行内コメントを追加

```typescript
/**
 * エンゲージメント率を計算する
 * @param likes いいね数
 * @param replies リプライ数
 * @param shares シェア数
 * @param impressions インプレッション数
 * @returns エンゲージメント率（%）
 */
function calculateEngagementRate(
  likes: number,
  replies: number,
  shares: number,
  impressions: number
): number {
  if (impressions === 0) return 0;
  
  // エンゲージメント = (いいね + リプライ + シェア) / インプレッション × 100
  const totalEngagement = likes + replies + shares;
  return (totalEngagement / impressions) * 100;
}
```

#### エラーハンドリング
- 必ず `try-catch` ブロックを使用
- エラーメッセージはユーザーフレンドリーに
- エラーログは詳細に記録

```typescript
function safeOperation(): { success: boolean; message: string; data?: any } {
  try {
    // 処理
    const result = performOperation();
    return { success: true, message: '成功しました', data: result };
  } catch (error) {
    console.error('操作エラー:', error);
    logError('safeOperation', error);
    return { success: false, message: 'エラーが発生しました' };
  }
}
```

### Git運用

#### ブランチ戦略
- `main`: 本番用（デプロイ可能な状態）
- `develop`: 開発用（次のリリース準備）
- `feature/*`: 機能追加用
- `fix/*`: バグ修正用

#### コミットメッセージ
```
[種類] 簡潔な説明

詳細な説明（必要に応じて）
```

**種類**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: コードフォーマット
- `refactor`: リファクタリング
- `test`: テスト追加
- `chore`: その他（ビルド設定など）

**例**:
```
feat: 週次レポート生成機能を追加

- ReportGeneratorクラスにgenerateWeeklyReport()を実装
- 週次トリガーを追加
- レポートHTMLテンプレートを作成
```

---

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. 「スプレッドシートにアクセスできません」

**原因**: スプレッドシートIDが間違っている、または権限がない

**解決方法**:
1. スプレッドシートのURLからIDを再確認
2. スプレッドシートの共有設定で自分が編集権限を持っているか確認
3. GASプロジェクトとスプレッドシートが同じGoogleアカウントか確認

#### 2. 「API呼び出しでエラーが発生しました」

**原因**: APIキーが無効、またはレート制限に達した

**解決方法**:
1. Threads Developer ConsoleでAPIキーの有効性を確認
2. APIキーを再生成して設定し直す
3. レート制限（200リクエスト/時間）を超えていないか確認
4. 1時間待ってから再実行

#### 3. 「トリガーが実行されない」

**原因**: トリガーが正しく設定されていない

**解決方法**:
1. GASエディタで「トリガー」メニューを開く
2. 設定されているトリガーを確認
3. 必要に応じて削除して再設定
4. 実行ログでエラーを確認

#### 4. 「データが表示されない」

**原因**: データ取得に失敗している、またはシート構造が間違っている

**解決方法**:
1. GASエディタで `runAnalysis()` を手動実行してログを確認
2. スプレッドシートのシート名が `posts`, `profile`, `config`, `logs` になっているか確認
3. データタブのJavaScriptコンソールでエラーを確認

---

## 📚 参考リンク

### 公式ドキュメント
- [Google Apps Script公式ドキュメント](https://developers.google.com/apps-script)
- [Threads API公式ドキュメント](https://developers.facebook.com/docs/threads)
- [Google Sheets API](https://developers.google.com/sheets/api)

### ツール
- [clasp（Google公式CLI）](https://github.com/google/clasp)
- [Apps Script Dashboard](https://script.google.com/home)
- [Threads Developer Console](https://developers.facebook.com/)

### このプロジェクトのドキュメント
- [設定情報の保持方法](./CONFIGURATION.md)
- [セキュリティ仕様](./security.md)
- [手動実行ガイド](./MANUAL_EXECUTION.md)
- [動的データ読み込み](./DYNAMIC_DATA_LOADING.md)

---

## 📄 ライセンス

MIT License

---

## 📞 サポート

問題や質問がある場合は、GitHubのIssueを作成してください。

---

**最終更新**: 2024年11月27日
**バージョン**: 1.0.0
**作成者**: プロジェクトチーム
