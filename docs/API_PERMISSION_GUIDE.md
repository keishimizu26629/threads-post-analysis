# Threads API 権限設定ガイド

## テスト結果サマリー

### ✅ 成功した機能
- ユーザー情報取得: **成功**
- 投稿一覧取得: **成功** (10件取得)

### ❌ 失敗した機能
- **インサイト取得: 失敗**

エラーメッセージ:
```
Unsupported get request. Object with ID '18104933881588833' does not exist, 
cannot be loaded due to missing permissions, or does not support this operation
```

## 原因: 権限不足

Threads APIのインサイトデータを取得するには、アクセストークンに以下の権限が必要です:

### 必要な権限
- ✅ `threads_basic` - 基本情報（ユーザー情報、投稿一覧）
- ✅ `threads_content_publish` - 投稿の公開
- ❌ **`threads_manage_insights`** - **インサイトデータの取得（これが不足している可能性）**

## 解決方法

### 1. Meta Developers Consoleで権限を確認

1. [Meta for Developers](https://developers.facebook.com/) にアクセス
2. 「マイアプリ」から該当のアプリを選択
3. 左メニューから「Threads」→「設定」を選択
4. 「権限とレビュー」セクションを確認

### 2. 必要な権限を追加

もし `threads_manage_insights` 権限がない場合:

1. 「権限を追加」をクリック
2. `threads_manage_insights` を検索
3. リクエストを送信（審査が必要な場合があります）

### 3. 新しいアクセストークンを生成

権限を追加したら、**新しいアクセストークンを生成**してください:

1. Meta Developers Console
2. 「ツール」→「アクセストークン」
3. 「新しいトークンを生成」
4. 必要な権限を全て選択
   - `threads_basic`
   - `threads_content_publish`
   - `threads_manage_insights` ← **重要！**

### 4. 新しいトークンでテスト

```bash
THREADS_API_KEY='新しいトークン' bash test-threads-api.sh
```

## 代替案: 古い投稿で試す

最新の投稿（24時間以内）はまだインサイトが集計されていない可能性があります。

テストスクリプトを修正して、より古い投稿（2-3日前）でインサイト取得を試してみることもできます。

```bash
# 投稿IDを手動で指定してテスト
FIRST_POST_ID="17859498555557541"  # 2025-12-09の投稿
curl -s "https://graph.threads.net/v1.0/${FIRST_POST_ID}/insights?metric=views,likes,replies,reposts,quotes&access_token=${THREADS_API_KEY}" | jq '.'
```

## よくある質問

### Q: `threads_manage_insights` 権限はすぐに使えますか？
A: アプリの種類によっては、Meta の審査が必要な場合があります。審査には数日かかることがあります。

### Q: 審査なしで使える方法はありますか？
A: 「開発モード」のアプリであれば、審査なしで権限を追加できる場合があります。ただし、使用できるアカウントが制限されます。

### Q: インサイトデータが取得できない他の理由は？
A: 以下の可能性もあります:
- 投稿が新しすぎる（24-48時間経過していない）
- ビジネスアカウントではない（個人アカウントの場合、インサイトが制限される可能性）
- APIの仕様変更

## 次のステップ

1. ✅ ユーザー情報と投稿一覧は正常に取得できている
2. ❌ インサイト取得に権限が必要
3. 🔄 **権限を追加して新しいアクセストークンを生成**
4. 🔄 再度テストを実行

権限の追加が完了したら、再度テストを実行してください！
