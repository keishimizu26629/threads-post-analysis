/**
 * Threads API関連の処理
 */

/**
 * Threads APIクライアントクラス
 */
class ThreadsApiClient {
  private accessToken: string;
  private baseUrl: string = 'https://graph.threads.net';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * ユーザーの投稿一覧を取得
   */
  getUserPosts(userId: string, limit: number = 25): any {
    try {
      const url = `${this.baseUrl}/${userId}/threads?fields=id,media_type,media_url,permalink,text,timestamp,username&limit=${limit}&access_token=${this.accessToken}`;

      const response = UrlFetchApp.fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.getResponseCode() !== 200) {
        throw new Error(`API呼び出しエラー: ${response.getResponseCode()}`);
      }

      return JSON.parse(response.getContentText());
    } catch (error) {
      console.error('Threads API呼び出しエラー:', error);
      throw error;
    }
  }

  /**
   * 投稿の詳細情報を取得
   */
  getPostDetails(postId: string): any {
    try {
      const url = `${this.baseUrl}/${postId}?fields=id,media_type,media_url,permalink,text,timestamp,username,like_count,reply_count&access_token=${this.accessToken}`;

      const response = UrlFetchApp.fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.getResponseCode() !== 200) {
        throw new Error(`API呼び出しエラー: ${response.getResponseCode()}`);
      }

      return JSON.parse(response.getContentText());
    } catch (error) {
      console.error('投稿詳細取得エラー:', error);
      throw error;
    }
  }

  /**
   * ユーザー情報を取得
   */
  getUserInfo(userId: string): any {
    try {
      const url = `${this.baseUrl}/${userId}?fields=id,username,name,threads_profile_picture_url,threads_biography&access_token=${this.accessToken}`;

      const response = UrlFetchApp.fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.getResponseCode() !== 200) {
        throw new Error(`API呼び出しエラー: ${response.getResponseCode()}`);
      }

      return JSON.parse(response.getContentText());
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
      throw error;
    }
  }
}
