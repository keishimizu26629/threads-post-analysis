/**
 * Threads API関連の処理
 */

// ヘルパー関数：ユーザー情報を取得
function fetchUserInfo(apiKey: string): { success: boolean; data?: object; message?: string } {
  try {
    const url = 'https://graph.threads.net/v1.0/me';
    const params = {
      fields: 'id,username,name,threads_profile_picture_url,threads_biography',
      access_token: apiKey,
    };

    const response = UrlFetchApp.fetch(`${url}?${buildQueryString(params)}`);

    if (response.getResponseCode() !== 200) {
      return {
        success: false,
        message: `HTTP ${response.getResponseCode()}: ${response.getContentText()}`,
      };
    }

    const data = JSON.parse(response.getContentText());
    return { success: true, data: data };
  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: errorMessage };
  }
}

// ヘルパー関数：投稿一覧を取得
function fetchUserPosts(
  apiKey: string,
  limit: number = 25
): { success: boolean; data?: object; message?: string } {
  try {
    const url = 'https://graph.threads.net/v1.0/me/threads';
    const params = {
      fields:
        'id,media_product_type,media_type,media_url,permalink,username,text,timestamp,shortcode,thumbnail_url,children,is_quote_post',
      limit: limit.toString(),
      access_token: apiKey,
    };

    const response = UrlFetchApp.fetch(`${url}?${buildQueryString(params)}`);

    if (response.getResponseCode() !== 200) {
      return {
        success: false,
        message: `HTTP ${response.getResponseCode()}: ${response.getContentText()}`,
      };
    }

    const result = JSON.parse(response.getContentText());
    return { success: true, data: result.data || [] };
  } catch (error) {
    console.error('投稿一覧取得エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: errorMessage };
  }
}

// ヘルパー関数：投稿のインサイトを取得
function fetchPostInsights(
  apiKey: string,
  postId: string
): { success: boolean; data?: object; message?: string } {
  try {
    const url = `https://graph.threads.net/v1.0/${postId}/insights`;
    const params = {
      metric: 'views,likes,replies,reposts,quotes',
      access_token: apiKey,
    };

    const response = UrlFetchApp.fetch(`${url}?${buildQueryString(params)}`);

    if (response.getResponseCode() !== 200) {
      return {
        success: false,
        message: `HTTP ${response.getResponseCode()}: ${response.getContentText()}`,
      };
    }

    const result = JSON.parse(response.getContentText());
    return { success: true, data: result.data || [] };
  } catch (error) {
    console.error('投稿インサイト取得エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: errorMessage };
  }
}

// ヘルパー関数：クエリ文字列を構築
function buildQueryString(params: { [key: string]: string }): string {
  return Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

// データ変換関数：インサイトをメトリクスに変換
function convertInsightsToMetrics(insights: object[]): object {
  const metrics = {
    views: 0,
    likes: 0,
    replies: 0,
    reposts: 0,
    quotes: 0,
    totalEngagement: 0,
    engagementRate: '0.00',
  };

  if (!insights || !Array.isArray(insights)) {
    return metrics;
  }

  // インサイトデータから値を抽出
  insights.forEach((insight: any) => {
    if (insight.values && insight.values.length > 0) {
      const value = insight.values[0].value || 0;
      switch (insight.name) {
        case 'views':
          metrics.views = value;
          break;
        case 'likes':
          metrics.likes = value;
          break;
        case 'replies':
          metrics.replies = value;
          break;
        case 'reposts':
          metrics.reposts = value;
          break;
        case 'quotes':
          metrics.quotes = value;
          break;
      }
    }
  });

  // エンゲージメント総数を計算
  metrics.totalEngagement = metrics.likes + metrics.replies + metrics.reposts + metrics.quotes;

  // エンゲージメント率を計算
  if (metrics.views > 0) {
    metrics.engagementRate = ((metrics.totalEngagement / metrics.views) * 100).toFixed(2);
  }

  return metrics;
}
