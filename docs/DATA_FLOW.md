# データフロー設計書

## 概要
本システムは **バッチ処理** でThreads APIからデータを取得してスプレッドシートに保存し、**Frontend** がそのデータを表示する2層構造になっています。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                     Threads API                              │
│                 (https://graph.threads.net)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ ① hourly batch (1時間ごと)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              Google Apps Script (GAS)                        │
│  ┌────────────────────────────────────────────────────┐     │
│  │ fetchMetricsHourly()                               │     │
│  │  ├─ 投稿一覧取得 ← API呼び出し                    │     │
│  │  ├─ 時間区分の決定（0, 1, 12, 24, 72）            │     │
│  │  └─ メトリクス収集                                │     │
│  │      └─ postsシート更新（統合テーブル）            │     │
│  └────────────────────────────────────────────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ データ保存
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              Google Spreadsheet (Database)                   │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ posts (統合テーブル)                                │     │
│  │ - post_id + time_category (複合PK)                  │     │
│  │ - posted_at, content, url                          │     │
│  │ - time_category (0, 1, 12, 24, 72)                 │     │
│  │ - impressions, likes, comments, shares             │     │
│  │ - engagement_rate                                   │     │
│  └─────────────────────────────────────────────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ ② Frontend読み込み
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                GAS Web App (Frontend)                        │
│  ┌────────────────────────────────────────────────────┐     │
│  │ dashboard.html                                     │     │
│  │  ├─ doGet() ← スプレッドシートから読み込み        │     │
│  │  └─ Chart.js でグラフ表示                         │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## データフロー詳細

### 1. バッチ処理（1時間ごと実行）

#### 関数: `fetchMetricsHourly()`

**ステップ1: 投稿一覧取得**
```javascript
Threads API: GET /me/threads?limit=100
  ↓
各投稿を順に確認
```

**ステップ2: 時間区分の決定とメトリクス収集**
```javascript
各投稿に対して:
  1. 投稿日時から経過時間を計算
  2. 時間区分を決定（0, 1, 12, 24, 72）
  3. Threads API: GET /{post_id}/insights
  4. posts シートに保存
     - post_id + time_category で重複チェック
     - 既存レコードがあれば更新、なければ追加
```

**ステップ3: 古いデータ削除**
```javascript
deleteOldPosts(sheet, 7)  // 7日以上前のデータを削除
```

### 2. Frontend表示

#### 関数: `doGet(e)`

```javascript
// パターンA: HTMLページ表示
if (!e.parameter.action) {
  return HtmlService.createHtmlOutputFromFile('dashboard');
}

// パターンB: JSON API
if (e.parameter.action === 'getAllMetrics') {
  return getMetricsForLast7Days();  // スプレッドシートから読み込み
}

if (e.parameter.action === 'getMetrics' && e.parameter.postId) {
  return getMetricsByPostId(postId);  // スプレッドシートから読み込み
}
```

## データベース仕様

### postsシート（投稿データ統合テーブル）

| 列 | 名称 | 説明 |
|----|------|------|
| A | post_id | 投稿ID |
| B | platform | プラットフォーム名（'threads'） |
| C | account_id | アカウントID（username） |
| D | posted_at | 投稿日時 |
| E | content | 投稿内容 |
| F | url | 投稿URL |
| G | char_count | 文字数 |
| H | media_type | メディアタイプ（TEXT/IMAGE/VIDEO/CAROUSEL） |
| I | hashtags | ハッシュタグ（カンマ区切り） |
| J | time_category | 時間区分（0=リアルタイム, 1, 12, 24, 72） |
| K | impressions | インプレッション数 |
| L | likes | いいね数 |
| M | comments | コメント数 |
| N | shares | シェア数 |
| O | follower_count | フォロワー数 |
| P | engagement_rate | エンゲージメント率（%） |
| Q | captured_at | データ取得日時 |
| R | created_at | レコード作成日時 |
| S | updated_at | レコード更新日時 |

**複合主キー:** post_id + time_category

**時間区分の定義**:
- **0（リアルタイム）**: 投稿直後、または1, 12, 24, 72時間に該当しない場合
- **1**: 投稿から1時間経過時点
- **12**: 投稿から12時間経過時点
- **24**: 投稿から24時間経過時点
- **72**: 投稿から72時間経過時点

## API制限と対策

### Threads API制限
- **取得可能な投稿数:** 最大100件/リクエスト
- **レート制限:** 明示されていないが、連続呼び出しは避ける

### 実装済みの対策
1. **リトライ機能:** `fetchUserPostsWithRetry()`, `fetchPostInsightsWithRetry()`
2. **遅延処理:** 各投稿のインサイト取得間に18秒の待機時間
3. **指数バックオフ:** リトライ時の待機時間を指数的に増加

## 実行スケジュール

| トリガー | 関数 | 頻度 | 説明 |
|---------|------|------|------|
| Time-driven | `fetchMetricsHourly()` | 1時間ごと | メトリクス収集 |
| Manual | `addOrUpdatePosts()` | 手動 | 投稿マスタのみ更新 |

## トラブルシューティング

### 問題: データが取得できない

**原因:** Threads APIから投稿が取得できていない、またはスプレッドシートに保存されていない

**解決策:**
1. `fetchMetricsHourly()`を手動実行してログを確認
2. APIキーが有効か確認
3. スプレッドシートIDが正しいか確認

### 問題: 時間区分が正しく設定されない

**確認事項:**
1. 投稿日時（posted_at）が正しく記録されているか
2. 経過時間の計算ロジックを確認
3. 時間区分の判定ロジック（1, 12, 24, 72時間の範囲）を確認

### 問題: メトリクスが更新されない

**確認事項:**
1. トリガーが正しく設定されているか
2. APIキーが有効か
3. スプレッドシートIDが正しいか
4. GASの実行ログを確認
5. post_id + time_categoryの重複チェックが正しく動作しているか確認

## 参考リンク
- [Threads API ドキュメント](https://developers.facebook.com/docs/threads)
- [Google Apps Script ドキュメント](https://developers.google.com/apps-script)
- [Chart.js ドキュメント](https://www.chartjs.org/)
