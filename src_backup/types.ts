/**
 * Threads投稿分析ツール用の型定義
 * Google Apps Script環境での型安全性を向上
 */

// Threads API関連の型定義
interface ThreadsUserInfo {
  id: string;
  username: string;
  name?: string;
  threads_profile_picture_url?: string;
  threads_biography?: string;
}

interface ThreadsPost {
  id: string;
  media_product_type: 'THREADS';
  media_type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  permalink?: string;
  owner?: {
    id: string;
  };
  username?: string;
  text?: string;
  timestamp?: string;
  shortcode?: string;
  thumbnail_url?: string;
  children?: {
    data: ThreadsPost[];
  };
  is_quote_post?: boolean;
  like_count?: number;
  reply_count?: number;
}

interface ThreadsInsight {
  name: string;
  period: string;
  values: Array<{
    value: number;
    end_time: string;
  }>;
  title: string;
  description: string;
  id: string;
}

interface PostMetrics {
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  reach: number;
  impressions: number;
}

// API レスポンス型
interface ApiResponse<T = object> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 設定関連の型定義
interface AppSettings {
  apiKey?: string;
  refreshInterval: number;
  maxPostsToAnalyze: number;
  enableNotifications: boolean;
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
}

// 分析結果の型定義
interface AnalysisResult {
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalReplies: number;
  averageEngagement: number;
  topPosts: ThreadsPost[];
  timeSeriesData: Array<{
    date: string;
    views: number;
    likes: number;
    replies: number;
  }>;
  insights: {
    bestPostingTimes: string[];
    topHashtags: string[];
    engagementTrends: string;
  };
}

// GAS特有の型定義
interface GasWebAppRequest {
  parameter: { [key: string]: string };
  parameters: { [key: string]: string[] };
  contextPath: string;
  contentLength: number;
  queryString: string;
  postData?: {
    length: number;
    type: string;
    contents: string;
    name: string;
  };
}

// データ管理用の型定義
interface StoredData {
  key: string;
  value: object;
  timestamp: number;
  expiresAt?: number;
}

interface DataHistory {
  keys: string[];
  maxItems: number;
  lastUpdated: number;
}

// スプレッドシート関連の型定義
interface SpreadsheetConfig {
  id: string;
  name?: string;
  url?: string;
  sheetName: string;
  lastAccessed?: Date;
}

interface TimeSeriesData {
  timestamp: Date;
  postId: string;
  text: string;
  charCount: number;
  type: string;
  postDate: Date;
  impressions: number;
  likes: number;
  reposts: number;
  quotes: number;
  replies: number;
  totalEngagement: number;
  engagementRate: string;
  followerCount: number;
  fetchTime: Date;
}

interface PostDataForSpreadsheet {
  id: string;
  text: string;
  mediaType: string;
  timestamp: string;
  insights: {
    views: number;
    likes: number;
    reposts: number;
    quotes: number;
    replies: number;
    totalEngagement: number;
    engagementRate: string;
  };
  followerCount?: number;
}

interface SpreadsheetOperationResult {
  success: boolean;
  message: string;
  data?: object;
  rowsAffected?: number;
}

interface DataFilterOptions {
  postDate?: Date;
  hoursRange?: number;
  postId?: string;
  limit?: number;
  sortBy?: 'timestamp' | 'postDate' | 'fetchTime';
  sortOrder?: 'asc' | 'desc';
}

interface SpreadsheetStatistics {
  totalRows: number;
  lastUpdate: Date | null;
  sheetName: string;
  uniquePosts?: number;
  dateRange?: {
    earliest: Date;
    latest: Date;
  };
}
