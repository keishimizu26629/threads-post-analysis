#!/bin/bash

# Threads API テストスクリプト
# 使用方法: THREADS_API_KEY='your_api_key' bash test-threads-api.sh

if [ -z "$THREADS_API_KEY" ]; then
  echo "エラー: THREADS_API_KEY環境変数が設定されていません"
  echo "使用方法: THREADS_API_KEY='your_api_key' bash test-threads-api.sh"
  echo ""
  echo "または、以下のコマンドで直接実行:"
  echo "  THREADS_API_KEY='your_key_here' bash test-threads-api.sh"
  exit 1
fi

API_KEY="${THREADS_API_KEY}"
BASE_URL="https://graph.threads.net/v1.0"

echo "=== Threads API テスト ==="
echo "実行日時: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 1. ユーザー情報を取得
echo "1. ユーザー情報を取得"
echo "URL: ${BASE_URL}/me?fields=id,username,name,threads_profile_picture_url,threads_biography&access_token=***"
USER_INFO=$(curl -s "${BASE_URL}/me?fields=id,username,name,threads_profile_picture_url,threads_biography&access_token=${API_KEY}")
echo "$USER_INFO" | jq '.'
echo ""

# エラーチェック
if echo "$USER_INFO" | jq -e '.error' > /dev/null 2>&1; then
  echo "❌ ユーザー情報取得エラー:"
  echo "$USER_INFO" | jq '.error'
  exit 1
fi

USER_ID=$(echo "$USER_INFO" | jq -r '.id // empty')
if [ -z "$USER_ID" ]; then
  echo "❌ ユーザーIDが取得できませんでした"
  exit 1
fi

echo "✅ ユーザーID: ${USER_ID}"
echo ""

# 2. 投稿一覧を取得
echo "2. 投稿一覧を取得（limit=10）"
echo "URL: ${BASE_URL}/me/threads?fields=id,media_product_type,media_type,media_url,permalink,username,text,timestamp,shortcode,thumbnail_url,children,is_quote_post&limit=10&access_token=***"
POSTS_RESPONSE=$(curl -s "${BASE_URL}/me/threads?fields=id,media_product_type,media_type,media_url,permalink,username,text,timestamp,shortcode,thumbnail_url,children,is_quote_post&limit=10&access_token=${API_KEY}")
echo "$POSTS_RESPONSE" | jq '.'
echo ""

# エラーチェック
if echo "$POSTS_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo "❌ 投稿一覧取得エラー:"
  echo "$POSTS_RESPONSE" | jq '.error'
  exit 1
fi

POST_COUNT=$(echo "$POSTS_RESPONSE" | jq '.data | length')
echo "✅ 取得した投稿数: ${POST_COUNT}件"
echo ""

if [ "$POST_COUNT" -eq 0 ]; then
  echo "⚠️ 投稿が0件です。インサイト取得テストをスキップします。"
  exit 0
fi

# 最初の投稿IDを取得
FIRST_POST_ID=$(echo "$POSTS_RESPONSE" | jq -r '.data[0].id // empty')
if [ -z "$FIRST_POST_ID" ]; then
  echo "❌ 投稿IDが取得できませんでした"
  exit 1
fi

echo "✅ 最初の投稿ID: ${FIRST_POST_ID}"
echo ""

# 3. 投稿のインサイトを取得
echo "3. 投稿のインサイトを取得"
echo "URL: ${BASE_URL}/${FIRST_POST_ID}/insights?metric=views,likes,replies,reposts,quotes&access_token=***"
INSIGHTS_RESPONSE=$(curl -s "${BASE_URL}/${FIRST_POST_ID}/insights?metric=views,likes,replies,reposts,quotes&access_token=${API_KEY}")
echo "$INSIGHTS_RESPONSE" | jq '.'
echo ""

# エラーチェック
if echo "$INSIGHTS_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo "❌ インサイト取得エラー:"
  echo "$INSIGHTS_RESPONSE" | jq '.error'
  echo ""
  echo "⚠️ インサイト取得に失敗しました。以下を確認してください:"
  echo "  - アクセストークンが投稿者本人のものか"
  echo "  - APIの権限設定が正しいか"
  echo "  - 投稿が24時間以内のものか（古い投稿はインサイトが取得できない場合があります）"
else
  INSIGHTS_COUNT=$(echo "$INSIGHTS_RESPONSE" | jq '.data | length')
  echo "✅ 取得したインサイト数: ${INSIGHTS_COUNT}件"
  echo ""
  
  # インサイトデータの構造を確認
  echo "インサイトデータ詳細:"
  echo "$INSIGHTS_RESPONSE" | jq '.data[] | {name: .name, values: .values}'
  echo ""
  
  # 各メトリクスの値を抽出
  echo "取得できたメトリクス:"
  for metric in views likes replies reposts quotes; do
    VALUE=$(echo "$INSIGHTS_RESPONSE" | jq -r ".data[] | select(.name == \"$metric\") | .values[0].value // \"N/A\"")
    if [ "$VALUE" != "N/A" ]; then
      echo "  ✅ ${metric}: ${VALUE}"
    else
      echo "  ❌ ${metric}: 取得できませんでした"
    fi
  done
fi

echo ""
echo "=== テスト完了 ==="
echo ""
echo "📝 結果サマリー:"
echo "  - ユーザー情報: $([ -n "$USER_ID" ] && echo "✅ 取得成功" || echo "❌ 取得失敗")"
echo "  - 投稿一覧: $([ "$POST_COUNT" -gt 0 ] && echo "✅ ${POST_COUNT}件取得" || echo "❌ 取得失敗")"
if [ "$POST_COUNT" -gt 0 ]; then
  echo "  - インサイト: $(echo "$INSIGHTS_RESPONSE" | jq -e '.error' > /dev/null 2>&1 && echo "❌ 取得失敗" || echo "✅ 取得成功")"
fi
