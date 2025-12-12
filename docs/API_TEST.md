# Threads API テストガイド

## 概要
Threads APIをcurlでテストして、過去7日間の投稿が正しく取得できることを確認します。

## 前提条件
- Threads API アクセストークンを取得済みであること
- `jq`コマンドがインストールされていること（JSON整形用）

## テスト方法

### 1. 環境変数の設定

```bash
export THREADS_API_KEY='your_access_token_here'
```

### 2. ユーザー情報を取得

```bash
curl -s "https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url,threads_biography&access_token=${THREADS_API_KEY}" | jq '.'
```

**期待される出力:**
```json
{
  "id": "12345678901234567",
  "username": "your_username",
  "name": "Your Name",
  "threads_profile_picture_url": "https://...",
  "threads_biography": "Your bio"
}
```

### 3. 投稿一覧を取得（limit=100）

```bash
curl -s "https://graph.threads.net/v1.0/me/threads?fields=id,media_product_type,media_type,media_url,permalink,username,text,timestamp,shortcode,thumbnail_url,children,is_quote_post&limit=100&access_token=${THREADS_API_KEY}" | jq '.'
```

**期待される出力:**
```json
{
  "data": [
    {
      "id": "post_id_1",
      "media_product_type": "THREADS",
      "media_type": "TEXT",
      "username": "your_username",
      "text": "投稿内容",
      "timestamp": "2025-11-27T10:30:00+0000",
      "permalink": "https://www.threads.net/@your_username/post/..."
    },
    ...
  ],
  "paging": {
    "cursors": {
      "before": "...",
      "after": "..."
    }
  }
}
```

### 4. 投稿数をカウント

```bash
curl -s "https://graph.threads.net/v1.0/me/threads?fields=id,timestamp&limit=100&access_token=${THREADS_API_KEY}" | jq '.data | length'
```

### 5. 過去7日間の投稿をフィルタリング

**macOS:**
```bash
SEVEN_DAYS_AGO=$(date -u -v-7d +%s)
echo "7日前のタイムスタンプ: ${SEVEN_DAYS_AGO}"

curl -s "https://graph.threads.net/v1.0/me/threads?fields=id,timestamp&limit=100&access_token=${THREADS_API_KEY}" | \
  jq --arg cutoff "$SEVEN_DAYS_AGO" '.data | map(select((.timestamp | fromdateiso8601) > ($cutoff | tonumber))) | length'
```

**Linux:**
```bash
SEVEN_DAYS_AGO=$(date -u -d '7 days ago' +%s)
echo "7日前のタイムスタンプ: ${SEVEN_DAYS_AGO}"

curl -s "https://graph.threads.net/v1.0/me/threads?fields=id,timestamp&limit=100&access_token=${THREADS_API_KEY}" | \
  jq --arg cutoff "$SEVEN_DAYS_AGO" '.data | map(select((.timestamp | fromdateiso8601) > ($cutoff | tonumber))) | length'
```

### 6. 自動テストスクリプトを実行

```bash
THREADS_API_KEY='your_access_token_here' bash test-threads-api.sh
```

## トラブルシューティング

### エラー: "Invalid OAuth access token"
- アクセストークンの有効期限が切れている可能性があります
- 正しいアクセストークンを使用しているか確認してください

### エラー: "Rate limit exceeded"
- APIの呼び出し制限に達しています
- 少し時間を置いてから再度実行してください

### 投稿が0件
- 過去7日間に投稿がない可能性があります
- `limit`パラメータを増やしてみてください（最大100）
- フィルタ条件を確認してください

## Threads API 制限事項

| 項目 | 制限 |
|------|------|
| 取得可能な投稿数（1回） | 最大100件 |
| レート制限 | 明示されていないが、過度な呼び出しは避けるべき |
| 日付フィルタ | APIレベルでは未対応（クライアント側でフィルタリング必要） |

## 参考リンク
- [Threads API ドキュメント](https://developers.facebook.com/docs/threads)
- [Graph API リファレンス](https://developers.facebook.com/docs/graph-api)
