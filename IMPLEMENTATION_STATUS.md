# 実装ステータス - 2024年12月11日

## 完了した作業

### 1. ✅ Threads API レスポンス確認の準備
- テストスクリプト `test-threads-api.sh` を改良
- 各メトリクス（views, likes, replies, reposts, quotes）の取得状況を詳細に表示
- テスト実行ガイド `docs/API_RESPONSE_CHECK.md` を作成

**実行方法:**
```bash
THREADS_API_KEY='your_api_key_here' bash test-threads-api.sh
```

**確認ポイント:**
- `views`（インプレッション数）が取得できるか
- `likes`（いいね数）が取得できるか
- コード実装は正しく `metric=views,likes,replies,reposts,quotes` をリクエストしている

### 2. ✅ テーブル構造を1テーブル設計に変更

**変更前:**
- `posts` (投稿マスタ)
- `post_metrics_hourly` (時系列メトリクス)

**変更後:**
- `posts` (投稿情報 + 時系列メトリクス統合)

**新しいテーブル構造:**
```
posts
├─ post_id (String) - 投稿ID
├─ content (String) - 投稿本文
├─ posted_at (DateTime) - 投稿日時
├─ captured_at (DateTime) - 取得日時
├─ likes (Number) - いいね数
├─ impressions (Number) - インプレッション数
├─ time_category (Number) - 表示カテゴリ (0, 1, 12, 24, 72)
├─ replies (Number) - リプライ数
├─ reposts (Number) - 再投稿数
├─ quotes (Number) - 引用数
├─ engagement_rate (String) - エンゲージメント率(%)
├─ created_at (DateTime) - レコード作成日時
└─ updated_at (DateTime) - レコード更新日時
```

**複合キー:** `post_id` + `time_category` (UNIQUE)

### 3. ✅ データ取得・更新ロジックの実装

**新しいバッチ処理フロー:**

```
1時間ごとに実行
↓
過去7日間の投稿を取得
↓
各投稿について:
  - 投稿からの経過時間を計算
  - 時間区分を判定 (0, 1, 12, 24, 72)
  - インサイトデータを取得
  - データを保存または更新
    ├─ time_category=0: 常に更新（最新データ）
    ├─ time_category=1: 1時間後の確定値（1回のみ作成）
    ├─ time_category=12: 12時間後の確定値（1回のみ作成）
    ├─ time_category=24: 24時間後の確定値（1回のみ作成）
    └─ time_category=72: 72時間後の確定値（1回のみ作成）
↓
7日より古いデータを削除
```

**実装ファイル:**
- `src/spreadsheetManager.ts`: テーブル作成、UPSERT処理
- `src/batchProcessor.ts`: バッチ処理ロジック
- `src/types.ts`: 型定義更新

**新しい関数:**
- `createPostsTable()`: 統合テーブル作成
- `upsertPostData()`: データ追加/更新
- `findPostRecord()`: レコード検索（post_id + time_category）
- `determineTimeCategory()`: 時間区分判定
- `fetchMetricsHourly()`: 1時間ごとのメトリクス収集
- `deleteOldPosts()`: 古いデータ削除

### 4. ✅ 仕様書の更新
- `docs/SPECIFICATION.md` を最新の設計に更新
- テーブル構造の説明を詳細化
- 時間区分の概念を明確化

## 設計のメリット

### 1. シンプルな構造
- 1つのテーブルで完結
- JOINが不要
- データの一貫性が保たれやすい

### 2. 効率的なデータ管理
- 1投稿につき最大5レコード
- 過去7日分のみ保持（自動削除）
- 必要な時点のデータのみ保存

### 3. フロントエンド表示に最適
- `time_category=0`で最新データ一覧を取得
- 特定`post_id`で全`time_category`を取得して時系列グラフ化

**一覧表示:**
```sql
WHERE time_category = 0
ORDER BY posted_at DESC
```

**時系列グラフ:**
```sql
WHERE post_id = '1234567890'
ORDER BY time_category ASC
```

## 次のステップ

### 1. API テスト実行（要ユーザーアクション）
```bash
THREADS_API_KEY='your_api_key' bash test-threads-api.sh
```

確認事項:
- [ ] `views` (インプレッション数) が取得できるか
- [ ] `likes` (いいね数) が取得できるか

### 2. Code.ts の統合
- 既存の `fetchMetricsHourly()` を新しい実装に置き換え
- `batchProcessor.ts` の関数を統合

### 3. トリガー設定
- 1時間ごとに `fetchMetricsHourly()` を実行
- 日次で `deleteOldPosts()` を実行

### 4. フロントエンド実装
- ダッシュボード: `time_category=0` でデータ一覧表示
- 時系列グラフ: 特定投稿の全`time_category`を取得してグラフ化

## 変更ファイル一覧

### 修正済み
- ✅ `src/spreadsheetManager.ts`
- ✅ `src/types.ts`
- ✅ `test-threads-api.sh`
- ✅ `docs/SPECIFICATION.md`

### 新規作成
- ✅ `src/batchProcessor.ts`
- ✅ `docs/API_RESPONSE_CHECK.md`
- ✅ `IMPLEMENTATION_STATUS.md`

### 要対応
- ⏳ `src/Code.ts` (既存の関数を新しい実装に置き換え)
- ⏳ `src/dashboard.html` (フロントエンドのデータ表示ロジック)

## 質問・確認事項

1. ✅ テーブル設計は要件を満たしていますか？
   - 1テーブルで投稿本文、投稿日時、投稿ID、取得日時、いいね、インプレッション数、表示カテゴリを管理
   - 1投稿につき最大5レコード（time_category = 0, 1, 12, 24, 72）
   - time_category=0は常に最新データ

2. 🔄 API テストの実行をお願いします
   - 実際にThreads APIがメトリクスを返すか確認が必要

3. 🔄 次の実装優先度
   - Code.tsの統合
   - フロントエンドの実装
   - トリガー設定
