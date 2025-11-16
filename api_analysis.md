# Threads API データ構造分析

## API検証結果

### 1. ユーザー情報 (`/me`)
```json
{
  "id": "25293224843697491",
  "username": "rugby_no_jikan",
  "name": "りょうたコーチ（三原亮太）| プロラグビーコーチ",
  "threads_profile_picture_url": "https://...",
  "threads_biography": "ラグビーが好きすぎるプロラグビーコーチ🏉..."
}
```

### 2. 投稿一覧 (`/me/threads`)
```json
{
  "data": [
    {
      "id": "18097354066831962",
      "media_product_type": "THREADS",
      "media_type": "TEXT_POST",
      "permalink": "https://www.threads.com/@rugby_no_jikan/post/DRHI1xwkg9u",
      "username": "rugby_no_jikan",
      "text": "投稿内容...",
      "timestamp": "2025-11-16T09:00:20+0000",
      "shortcode": "DRHI1xwkg9u",
      "is_quote_post": false
    }
  ],
  "paging": {
    "cursors": {
      "before": "...",
      "after": "..."
    },
    "next": "https://graph.threads.net/v1.0/..."
  }
}
```

### 3. 投稿インサイト (`/{media-id}/insights`)
```json
{
  "data": [
    {
      "name": "views",
      "period": "lifetime",
      "values": [{"value": 1450}],
      "title": "閲覧",
      "description": "投稿が表示された回数です。"
    },
    {
      "name": "likes",
      "period": "lifetime",
      "values": [{"value": 106}],
      "title": "いいね！"
    },
    {
      "name": "replies",
      "period": "lifetime",
      "values": [{"value": 1}],
      "title": "返信"
    },
    {
      "name": "reposts",
      "period": "lifetime",
      "values": [{"value": 0}],
      "title": "再投稿"
    },
    {
      "name": "quotes",
      "period": "lifetime",
      "values": [{"value": 0}],
      "title": "引用"
    }
  ]
}
```

## HTMLテーブルとのマッピング

### 現在のHTMLテーブル項目 → API対応

| HTMLテーブル項目 | API対応 | 取得方法 |
|---|---|---|
| **基本情報** | | |
| 投稿文 | `text` | `/me/threads` |
| 文字数 | `text.length` | 計算 |
| タイプ | `media_type` | `/me/threads` |
| **12時間後データ** | | |
| インプ(12h) | `views` | `/{id}/insights` |
| いいね(12h) | `likes` | `/{id}/insights` |
| 再投稿/引用(12h) | `reposts + quotes` | `/{id}/insights` |
| リプライ(12h) | `replies` | `/{id}/insights` |
| Eng総数(12h) | `likes + reposts + quotes + replies` | 計算 |
| Eng率(12h) | `Eng総数 / views * 100` | 計算 |
| 総フォロワー(12h) | ❌ **取得不可** | - |

### 取得できないデータ

1. **総フォロワー数の時系列データ**
   - APIでは現在のフォロワー数のみ取得可能
   - 12時間後、24時間後の変化は追跡不可

2. **時間別データ**
   - APIは`lifetime`（累計）データのみ
   - 12時間後、24時間後の区別なし

3. **24時間後データ**
   - 現在のAPIでは対応不可

## 実装方針

### Phase 2で実装する機能

1. **基本データ取得**
   ```javascript
   // 投稿一覧取得
   const posts = await fetchUserPosts();

   // 各投稿のインサイト取得
   for (const post of posts.data) {
     const insights = await fetchPostInsights(post.id);
     // データ変換・保存
   }
   ```

2. **データ変換ロジック**
   ```javascript
   function convertApiDataToTableData(post, insights) {
     return {
       postText: post.text,
       charCount: post.text.length,
       mediaType: post.media_type === 'TEXT_POST' ? 'テキスト' : '画像',
       timestamp: new Date(post.timestamp),
       views: getInsightValue(insights, 'views'),
       likes: getInsightValue(insights, 'likes'),
       replies: getInsightValue(insights, 'replies'),
       reposts: getInsightValue(insights, 'reposts'),
       quotes: getInsightValue(insights, 'quotes'),
       // 計算項目
       totalEngagement: likes + replies + reposts + quotes,
       engagementRate: (totalEngagement / views * 100).toFixed(2)
     };
   }
   ```

3. **HTMLテーブル更新**
   - 仮データを実データに置き換え
   - 取得できない項目は「-」または非表示
   - エラー時のフォールバック表示

### 制限事項の対応

1. **フォロワー数**
   - 現在のフォロワー数のみ表示
   - 「総フォロワー(現在)」に項目名変更

2. **時間別データ**
   - 「12時間後」「24時間後」の区別を削除
   - 「累計データ」として表示

3. **データ更新頻度**
   - APIの制限により、リアルタイム更新は不可
   - 定期実行（1時間〜数時間間隔）を推奨

## 次のステップ

1. HTMLテーブル構造の調整
2. GAS関数の実装
3. テストボタンの追加
4. エラーハンドリングの実装
