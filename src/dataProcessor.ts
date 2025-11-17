/**
 * データ処理・分析関連の処理
 */

// GAS環境では import/export は使用できないため、型定義のみ参照

/**
 * データプロセッサークラス
 */
class DataProcessor {
  /**
   * 投稿データを分析する
   */
  static analyzePostData(posts: any[]): object {
    try {
      const analysis = {
        totalPosts: posts.length,
        postsByType: this.categorizePostsByType(posts),
        engagementStats: this.calculateEngagementStats(posts),
        timeAnalysis: this.analyzePostingTimes(posts),
        contentAnalysis: this.analyzeContent(posts),
      };

      return analysis;
    } catch (error) {
      console.error('データ分析エラー:', error);
      throw error;
    }
  }

  /**
   * 投稿タイプ別に分類
   */
  private static categorizePostsByType(posts: any[]): object {
    const categories = {
      text: 0,
      image: 0,
      video: 0,
      carousel: 0,
    };

    posts.forEach(post => {
      switch (post.media_type) {
        case 'TEXT':
          categories.text++;
          break;
        case 'IMAGE':
          categories.image++;
          break;
        case 'VIDEO':
          categories.video++;
          break;
        case 'CAROUSEL_ALBUM':
          categories.carousel++;
          break;
      }
    });

    return categories;
  }

  /**
   * エンゲージメント統計を計算
   */
  private static calculateEngagementStats(posts: any[]): object {
    const stats = {
      totalLikes: 0,
      totalReplies: 0,
      averageLikes: 0,
      averageReplies: 0,
      maxLikes: 0,
      maxReplies: 0,
    };

    if (posts.length === 0) return stats;

    posts.forEach(post => {
      const likes = post.like_count || 0;
      const replies = post.reply_count || 0;

      stats.totalLikes += likes;
      stats.totalReplies += replies;

      if (likes > stats.maxLikes) stats.maxLikes = likes;
      if (replies > stats.maxReplies) stats.maxReplies = replies;
    });

    stats.averageLikes = Math.round((stats.totalLikes / posts.length) * 100) / 100;
    stats.averageReplies = Math.round((stats.totalReplies / posts.length) * 100) / 100;

    return stats;
  }

  /**
   * 投稿時間を分析
   */
  private static analyzePostingTimes(posts: any[]): object {
    const hourlyDistribution: number[] = [];
    for (let i = 0; i < 24; i++) {
      hourlyDistribution[i] = 0;
    }
    const dailyDistribution = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };

    posts.forEach(post => {
      if (post.timestamp) {
        const date = new Date(post.timestamp);
        const hour = date.getHours();
        const dayNames = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ];
        const dayName = dayNames[date.getDay()];

        hourlyDistribution[hour]++;
        (dailyDistribution as any)[dayName]++;
      }
    });

    return {
      hourlyDistribution,
      dailyDistribution,
    };
  }

  /**
   * コンテンツ分析
   */
  private static analyzeContent(posts: any[]): object {
    const analysis = {
      averageTextLength: 0,
      hashtagCount: 0,
      mentionCount: 0,
      urlCount: 0,
      commonWords: [] as Array<{ word: string; count: number }>,
    };

    let totalTextLength = 0;
    let textPostCount = 0;
    const wordFrequency: { [key: string]: number } = {};

    posts.forEach(post => {
      if (post.text) {
        totalTextLength += post.text.length;
        textPostCount++;

        // ハッシュタグをカウント
        const hashtags = post.text.match(/#\w+/g);
        if (hashtags) analysis.hashtagCount += hashtags.length;

        // メンションをカウント
        const mentions = post.text.match(/@\w+/g);
        if (mentions) analysis.mentionCount += mentions.length;

        // URLをカウント
        const urls = post.text.match(/https?:\/\/[^\s]+/g);
        if (urls) analysis.urlCount += urls.length;

        // 単語頻度を計算（簡易版）
        const words = post.text.toLowerCase().match(/\b\w+\b/g);
        if (words) {
          words.forEach((word: string) => {
            if (word.length > 3) {
              // 3文字以上の単語のみ
              wordFrequency[word] = (wordFrequency[word] || 0) + 1;
            }
          });
        }
      }
    });

    if (textPostCount > 0) {
      analysis.averageTextLength = Math.round(totalTextLength / textPostCount);
    }

    // 頻出単語トップ10を取得
    const wordEntries = Object.keys(wordFrequency)
      .map(word => ({ word, count: wordFrequency[word] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    analysis.commonWords = wordEntries;

    return analysis;
  }
}
