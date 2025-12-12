# Threads API レスポンス確認ガイド

## 概要
Threads APIで「いいね」と「インプレッション数（views）」が実際に取得できるか確認するためのガイドです。

## テスト方法

### 1. テストスクリプトを実行

```bash
cd /Users/keisukeshimizu/Development/operational_improvement/threads_post_analysis
THREADS_API_KEY='your_api_key_here' bash test-threads-api.sh
```

### 2. 確認ポイント

テストスクリプトは以下の情報を表示します:

#### ユーザー情報取得
```json
{
  "id": "1234567890",
  "username": "your_username",
  "name": "Your Name"
}
```

#### 投稿一覧取得
```json
{
  "data": [
    {
      "id": "post_id_1",
      "text": "投稿内容",
      "timestamp": "2024-12-11T10:00:00+0000",
      ...
    }
  ]
}
```

#### インサイトデータ取得（重要）
```json
{
  "data": [
    {
      "name": "views",
      "values": [{"value": 1250}]
    },
    {
      "name": "likes",
      "values": [{"value": 45}]
    },
    {
      "name": "replies",
      "values": [{"value": 8}]
    },
    {
      "name": "reposts",
      "values": [{"value": 3}]
    },
    {
      "name": "quotes",
      "values": [{"value": 1}]
    }
  ]
}
```

### 3. 期待される結果

✅ **成功の場合:**
```
取得できたメトリクス:
  ✅ views: 1250
  ✅ likes: 45
  ✅ replies: 8
  ✅ reposts: 3
  ✅ quotes: 1
```

❌ **失敗の場合:**
```
取得できたメトリクス:
  ❌ views: 取得できませんでした
  ❌ likes: 取得できませんでした
  ...
```

## トラブルシューティング

### エラー: "Invalid OAuth access token"
- アクセストークンの有効期限が切れています
- Threads Developer Consoleで新しいトークンを生成してください

### エラー: "Insufficient permissions"
- アクセストークンに必要な権限がありません
- `threads_basic`, `threads_content_publish`, `threads_manage_insights` 権限を確認してください

### メトリクスが取得できない
以下の原因が考えられます:
1. **投稿が古すぎる**: Threads APIは過去一定期間の投稿のみインサイトを提供
2. **権限不足**: インサイトデータは投稿者本人のアクセストークンでのみ取得可能
3. **API制限**: レート制限に達している可能性

## 次のステップ

テストが成功したら、以下を確認してください:

1. ✅ `views`（インプレッション数）が取得できているか
2. ✅ `likes`（いいね数）が取得できているか
3. ✅ その他のメトリクス（`replies`, `reposts`, `quotes`）も取得できているか

すべて取得できている場合、現在の実装で問題ありません。
