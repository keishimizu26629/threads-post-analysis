/**
 * Threads投稿分析ツール - Webアプリケーション版
 * Google Apps ScriptでWebアプリとして動作するThreads投稿分析システム
 */

// GAS環境では import/export は使用できないため、型定義のみ参照
// 実際のクラスはグローバルスコープで利用可能

/**
 * WebアプリのGETリクエストを処理
 * HTMLページまたはJSON APIを返す
 */
function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput | GoogleAppsScript.Content.TextOutput {
  try {
    // eがundefinedの場合（テスト実行時）のハンドリング
    const action = (e && e.parameter && e.parameter.action) || '';
    const page = (e && e.parameter && e.parameter.page) || 'dashboard';

    // JSON API エンドポイント
    if (action === 'getMetrics') {
      const postId = e.parameter.postId;
      if (!postId) {
        return ContentService
          .createTextOutput(JSON.stringify({ success: false, message: 'postIdが指定されていません' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const data = getMetricsByPostId(postId);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, data: data }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'getAllMetrics') {
      const data = getMetricsForLast7Days();
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, data: data }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // HTML ページ
    switch (page) {
      case 'dashboard':
        return HtmlService.createTemplateFromFile('dashboard')
          .evaluate()
          .setTitle('Threads投稿分析ツール')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

      default:
        return HtmlService.createTemplateFromFile('dashboard')
          .evaluate()
          .setTitle('Threads投稿分析ツール')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
  } catch (error) {
    console.error('doGet エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return HtmlService.createHtmlOutput(`
      <h1>エラーが発生しました</h1>
      <p>${errorMessage}</p>
    `);
  }
}

/**
 * WebアプリのPOSTリクエストを処理
 * APIエンドポイントとして機能
 */
function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  try {
    // eがundefinedの場合のハンドリング
    if (!e || !e.parameter) {
      throw new Error('Invalid request parameters');
    }

    const action = e.parameter.action;
    const data = JSON.parse((e.postData && e.postData.contents) || '{}');

    let result;

    switch (action) {
      case 'getPostData':
        result = getPostData();
        break;

      case 'updateSettings':
        result = updateSettings(data);
        break;

      case 'runAnalysis':
        result = runAnalysis();
        break;

      case 'getAnalysisData':
        result = getAnalysisData();
        break;

      case 'getSystemStatus':
        result = getSystemStatus();
        break;

      case 'initializeSpreadsheetDatabase':
        result = initializeSpreadsheetDatabase();
        break;

      case 'setupBatchTrigger':
        result = setupBatchTrigger();
        break;

      case 'getBatchTriggerStatus':
        result = getBatchTriggerStatus();
        break;

      case 'removeBatchTrigger':
        result = removeBatchTrigger();
        break;

      case 'getBatchExecutionStatus':
        result = getBatchExecutionStatus();
        break;

      case 'getAllSpreadsheetData':
        result = getAllSpreadsheetData();
        break;
      case 'migrateThreadsDataToNewSchema':
        result = migrateThreadsDataToNewSchema();
        break;
      case 'deleteThreadsDataSheet':
        result = deleteThreadsDataSheet();
        break;

      case 'getSettings':
        result = getSettings();
        break;

      case 'saveApiKey':
        result = saveApiKey(data.apiKey || '');
        break;

      case 'getApiKey':
        result = { apiKey: getApiKey() };
        break;

      case 'saveSpreadsheetId':
        result = saveSpreadsheetId(data.spreadsheetId || '');
        break;

      case 'getSpreadsheetId':
        result = { spreadsheetId: getSpreadsheetId() };
        break;

      case 'testSpreadsheetAccess':
        result = testSpreadsheetAccess();
        break;

      case 'testThreadsApiConnection':
        result = testThreadsApiConnection();
        break;

      case 'fetchMetricsHourly':
        result = fetchMetricsHourly();
        break;

      case 'getTimeSeriesData':
        result = getTimeSeriesData(data.postDateString, data.hours || 12);
        break;

      case 'getSpreadsheetStatistics':
        result = getSpreadsheetStatistics();
        break;

      default:
        throw new Error(`未知のアクション: ${action}`);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, data: result })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('doPost エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: errorMessage,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * HTMLファイルの内容を取得（include用）
 * HTMLテンプレート内で <?!= include('filename'); ?> として使用
 */
function include(filename: string): string {
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch (error) {
    console.error(`HTMLファイル読み込みエラー (${filename}):`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `<!-- HTMLファイル '${filename}' の読み込みに失敗しました: ${errorMessage} -->`;
  }
}

// API キー管理機能
function saveApiKey(apiKey: string): { success: boolean; message: string } {
  try {
    if (!apiKey || apiKey.trim() === '') {
      return { success: false, message: 'APIキーが空です' };
    }

    PropertiesService.getScriptProperties().setProperty('THREADS_API_KEY', apiKey.trim());
    return { success: true, message: 'APIキーを保存しました' };
  } catch (error) {
    console.error('APIキー保存エラー:', error);
    return { success: false, message: 'APIキーの保存に失敗しました' };
  }
}

function getApiKey(): string {
  try {
    return PropertiesService.getScriptProperties().getProperty('THREADS_API_KEY') || '';
  } catch (error) {
    console.error('APIキー取得エラー:', error);
    return '';
  }
}

function hasApiKey(): boolean {
  const apiKey = getApiKey();
  return apiKey !== null && apiKey !== '';
}

function deleteApiKey(): { success: boolean; message: string } {
  try {
    PropertiesService.getScriptProperties().deleteProperty('THREADS_API_KEY');
    return { success: true, message: 'APIキーを削除しました' };
  } catch (error) {
    console.error('APIキー削除エラー:', error);
    return { success: false, message: 'APIキーの削除に失敗しました' };
  }
}

// スプレッドシートID管理機能
function saveSpreadsheetId(spreadsheetId: string): { success: boolean; message: string } {
  try {
    if (!spreadsheetId || spreadsheetId.trim() === '') {
      return { success: false, message: 'スプレッドシートIDが空です' };
    }

    // スプレッドシートIDの形式チェック
    const trimmedId = spreadsheetId.trim();
    if (trimmedId.length < 20 || !/^[a-zA-Z0-9_-]+$/.test(trimmedId)) {
      return { success: false, message: '無効なスプレッドシートIDです' };
    }

    PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', trimmedId);
    console.log('スプレッドシートIDを保存しました:', trimmedId);
    return { success: true, message: 'スプレッドシートIDを保存しました' };
  } catch (error) {
    console.error('スプレッドシートID保存エラー:', error);
    return { success: false, message: 'スプレッドシートIDの保存に失敗しました' };
  }
}

function getSpreadsheetId(): string | null {
  try {
    return PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  } catch (error) {
    console.error('スプレッドシートID取得エラー:', error);
    return null;
  }
}

function hasSpreadsheetId(): boolean {
  const spreadsheetId = getSpreadsheetId();
  return spreadsheetId !== null && spreadsheetId !== '';
}

function deleteSpreadsheetId(): { success: boolean; message: string } {
  try {
    PropertiesService.getScriptProperties().deleteProperty('SPREADSHEET_ID');
    return { success: true, message: 'スプレッドシートIDを削除しました' };
  } catch (error) {
    console.error('スプレッドシートID削除エラー:', error);
    return { success: false, message: 'スプレッドシートIDの削除に失敗しました' };
  }
}

function testSpreadsheetAccess(): { success: boolean; message?: string; data?: object } {
  try {
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
      return { success: false, message: 'スプレッドシートIDが設定されていません' };
    }

    // スプレッドシートにアクセスを試行
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const name = spreadsheet.getName();

    console.log('スプレッドシート接続成功:', name);
    return {
      success: true,
      data: {
        name: name,
        id: spreadsheetId,
        url: spreadsheet.getUrl(),
      },
    };
  } catch (error) {
    console.error('スプレッドシート接続テストエラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: 'スプレッドシートへの接続に失敗しました: ' + errorMessage };
  }
}

// Threads API テスト機能
function testThreadsApiConnection(): { success: boolean; message?: string; data?: object } {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return { success: false, message: 'APIキーが設定されていません' };
    }

    // ユーザー情報を取得
    const userInfo = fetchUserInfo(apiKey);
    if (!userInfo.success) {
      return { success: false, message: 'ユーザー情報の取得に失敗: ' + userInfo.message };
    }

    // 投稿一覧を取得（最大100件）
    const postsResult = fetchUserPostsWithRetry(apiKey, 100);
    if (!postsResult.success) {
      return { success: false, message: '投稿一覧の取得に失敗: ' + postsResult.message };
    }

    const allPosts = Array.isArray(postsResult.data) ? postsResult.data : [];
    
    // 7日前までの投稿をフィルタリング
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoTimestamp = Math.floor(sevenDaysAgo.getTime() / 1000);
    
    const recentPosts = allPosts.filter((post: any) => {
      if (!post.timestamp) return false;
      // timestampはISO8601形式の文字列またはUnixタイムスタンプの可能性がある
      let postTimestamp: number;
      if (typeof post.timestamp === 'string') {
        postTimestamp = Math.floor(new Date(post.timestamp).getTime() / 1000);
      } else {
        postTimestamp = post.timestamp;
      }
      return postTimestamp >= sevenDaysAgoTimestamp;
    });

    return {
      success: true,
      data: {
        user: userInfo.data,
        posts: recentPosts,
        totalPosts: allPosts.length,
        recentPostsCount: recentPosts.length,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('API接続テストエラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: 'API接続テストでエラーが発生しました: ' + errorMessage };
  }
}

function fetchAndUpdateTableData(): { success: boolean; message?: string; data?: object } {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return { success: false, message: 'APIキーが設定されていません' };
    }

    // 投稿一覧を取得（最新3件）
    const postsResult = fetchUserPosts(apiKey, 3);
    if (!postsResult.success) {
      return { success: false, message: '投稿データの取得に失敗: ' + postsResult.message };
    }

    const posts = postsResult.data as any[];
    const processedPosts = [];

    // 各投稿のインサイトを取得
    for (const post of posts) {
      try {
        const insightsResult = fetchPostInsights(apiKey, post.id);
        const insightsData = insightsResult.success ? insightsResult.data : null;

        // データ変換
        const processedPost = {
          id: post.id,
          text: post.text,
          timestamp: post.timestamp,
          mediaType: post.media_type,
          insights: insightsData
            ? convertInsightsToMetrics([insightsData])
            : convertInsightsToMetrics([]),
        };

        processedPosts.push(processedPost);
      } catch (error) {
        console.error(`投稿 ${post.id} のインサイト取得エラー:`, error);
        // エラーが発生した投稿もデフォルト値で追加
        processedPosts.push({
          id: post.id,
          text: post.text,
          timestamp: post.timestamp,
          mediaType: post.media_type,
          insights: {
            views: 0,
            likes: 0,
            replies: 0,
            reposts: 0,
            quotes: 0,
            totalEngagement: 0,
            engagementRate: '0.00',
          },
        });
      }
    }

    return {
      success: true,
      data: {
        posts: processedPosts,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('テーブルデータ更新エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: 'テーブルデータの更新でエラーが発生しました: ' + errorMessage,
    };
  }
}

/**
 * 投稿データを取得
 */
function getPostData(): { success: boolean; data?: object; error?: string } {
  try {
    const dataManager = new DataManager();
    const data = dataManager.getStoredPostData();
    return { success: true, data };
  } catch (error) {
    console.error('投稿データ取得エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

/**
 * スプレッドシートにデータを保存
 */
function saveDataToSpreadsheet(postData: object): { success: boolean; message: string } {
  try {
    const dataManager = new DataManager();
    return dataManager.saveToSpreadsheet(postData);
  } catch (error) {
    console.error('スプレッドシートデータ保存エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: 'データ保存エラー: ' + errorMessage };
  }
}

/**
 * スプレッドシートに複数データを一括保存
 */
function batchSaveDataToSpreadsheet(postDataArray: object[]): {
  success: boolean;
  message: string;
  count?: number;
} {
  try {
    const dataManager = new DataManager();
    return dataManager.batchSaveToSpreadsheet(postDataArray);
  } catch (error) {
    console.error('スプレッドシート一括データ保存エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: 'データ一括保存エラー: ' + errorMessage };
  }
}

/**
 * スプレッドシートから時系列データを取得
 */
function getTimeSeriesData(
  postDateString: string,
  hours: number = 12
): { success: boolean; data?: object[]; message?: string } {
  try {
    if (!postDateString) {
      return { success: false, message: '投稿日時が指定されていません' };
    }

    const postDate = new Date(postDateString);
    if (isNaN(postDate.getTime())) {
      return { success: false, message: '無効な投稿日時です' };
    }

    const dataManager = new DataManager();
    const data = dataManager.getTimeSeriesDataFromSpreadsheet(postDate, hours);

    return {
      success: true,
      data: data,
      message: `${data.length}件のデータを取得しました`,
    };
  } catch (error) {
    console.error('時系列データ取得エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: '時系列データ取得エラー: ' + errorMessage };
  }
}

/**
 * スプレッドシートの統計情報を取得
 */
function getSpreadsheetStatistics(): { success: boolean; data?: object; message?: string } {
  try {
    const dataManager = new DataManager();
    const stats = dataManager.getSpreadsheetStatistics();

    return {
      success: true,
      data: stats,
      message: '統計情報を取得しました',
    };
  } catch (error) {
    console.error('スプレッドシート統計情報取得エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: '統計情報取得エラー: ' + errorMessage };
  }
}

/**
 * Threads APIからデータを取得してスプレッドシートに保存
 */
function fetchAndSaveToSpreadsheet(): { success: boolean; message: string; data?: object } {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return { success: false, message: 'APIキーが設定されていません' };
    }

    if (!hasSpreadsheetId()) {
      return { success: false, message: 'スプレッドシートIDが設定されていません' };
    }

    // 投稿一覧を取得（最新3件）
    const postsResult = fetchUserPosts(apiKey, 3);
    if (!postsResult.success) {
      return { success: false, message: '投稿データの取得に失敗: ' + postsResult.message };
    }

    const posts = postsResult.data as any[];
    const processedPosts = [];

    // 各投稿のインサイトを取得
    for (const post of posts) {
      try {
        const insightsResult = fetchPostInsights(apiKey, post.id);
        const insightsData = insightsResult.success ? insightsResult.data : null;

        // データ変換
        const processedPost = {
          id: post.id,
          text: post.text,
          timestamp: post.timestamp,
          mediaType: post.media_type,
          insights: insightsData
            ? convertInsightsToMetrics([insightsData])
            : convertInsightsToMetrics([]),
        };

        processedPosts.push(processedPost);
      } catch (error) {
        console.error(`投稿 ${post.id} のインサイト取得エラー:`, error);
        // エラーが発生した投稿もデフォルト値で追加
        processedPosts.push({
          id: post.id,
          text: post.text,
          timestamp: post.timestamp,
          mediaType: post.media_type,
          insights: {
            views: 0,
            likes: 0,
            replies: 0,
            reposts: 0,
            quotes: 0,
            totalEngagement: 0,
            engagementRate: '0.00',
          },
        });
      }
    }

    // スプレッドシートに保存
    const saveResult = batchSaveDataToSpreadsheet(processedPosts);

    return {
      success: saveResult.success,
      message: saveResult.message,
      data: {
        postsProcessed: processedPosts.length,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('データ取得・保存エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: 'データ取得・保存でエラーが発生しました: ' + errorMessage };
  }
}

/**
 * 設定を取得
 */
function getSettings(): object {
  try {
    const dataManager = new DataManager();
    return dataManager.getSettings();
  } catch (error) {
    console.error('設定取得エラー:', error);
    throw error;
  }
}

/**
 * 設定を更新
 */
function updateSettings(settings: object): boolean {
  try {
    const dataManager = new DataManager();
    dataManager.saveSettings(settings);
    return true;
  } catch (error) {
    console.error('設定更新エラー:', error);
    throw error;
  }
}

/**
 * 分析を実行
 */
function runAnalysis(): object {
  try {
    console.log('Threads投稿分析を開始します');

    // 設定の読み込み
    const dataManager = new DataManager();
    const config = dataManager.getSettings() as any;

    if (!config.accessToken || !config.userId) {
      throw new Error('アクセストークンまたはユーザーIDが設定されていません');
    }

    // Threads APIからデータを取得
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('APIキーが設定されていません');
    }

    const threadsData = fetchUserPosts(apiKey, config.postLimit || 25);
    if (!threadsData.success) {
      throw new Error('投稿データの取得に失敗: ' + threadsData.message);
    }

    // データを処理・分析
    const analysisResult = DataProcessor.analyzePostData((threadsData.data as any[]) || []);

    // 結果を保存
    dataManager.saveAnalysisResult(analysisResult);
    dataManager.savePostData((threadsData.data as any[]) || []);

    console.log('分析が完了しました');
    return analysisResult;
  } catch (error) {
    console.error('分析実行エラー:', error);
    throw error;
  }
}

/**
 * 分析データを取得
 */
function getAnalysisData(): object {
  try {
    const dataManager = new DataManager();
    return dataManager.getAnalysisResult();
  } catch (error) {
    console.error('分析データ取得エラー:', error);
    throw error;
  }
}

/**
 * システム状態を取得
 */
function getSystemStatus(): { success: boolean; data?: any; message?: string } {
  try {
    const hasApiKey = getApiKey() !== null && getApiKey() !== '';
    const hasSpreadsheetId = getSpreadsheetId() !== null && getSpreadsheetId() !== '';

    return {
      success: true,
      data: {
        apiKeyConfigured: hasApiKey,
        spreadsheetConfigured: hasSpreadsheetId,
        systemReady: hasApiKey && hasSpreadsheetId
      }
    };
  } catch (error) {
    console.error('システム状態取得エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: 'システム状態の取得に失敗しました: ' + errorMessage };
  }
}

/**
 * スプレッドシートデータベースを初期化
 */
function initializeSpreadsheetDatabase(): { success: boolean; message: string } {
  try {
    console.log('initializeSpreadsheetDatabase: 開始');
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
      console.error('initializeSpreadsheetDatabase: スプレッドシートIDが設定されていません');
      return { success: false, message: 'スプレッドシートIDが設定されていません' };
    }

    console.log('initializeSpreadsheetDatabase: スプレッドシートID:', spreadsheetId);
    const manager = new SpreadsheetManager();
    const result = manager.initializeDatabase();

    console.log('initializeSpreadsheetDatabase: 結果:', result.success ? '成功' : '失敗');
    if (result.success) {
      console.log('initializeSpreadsheetDatabase: メッセージ:', result.message);
    } else {
      console.error('initializeSpreadsheetDatabase: エラーメッセージ:', result.message);
    }

    return result;
  } catch (error) {
    console.error('データベース初期化エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: 'データベース初期化に失敗しました: ' + errorMessage };
  }
}

/**
 * バッチトリガーを設定
 */
function setupBatchTrigger(): { success: boolean; message: string } {
  try {
    // 設定確認
    const hasApiKey = getApiKey() !== null && getApiKey() !== '';
    const hasSpreadsheetId = getSpreadsheetId() !== null && getSpreadsheetId() !== '';

    if (!hasApiKey) {
      return { success: false, message: 'APIキーが設定されていません' };
    }

    if (!hasSpreadsheetId) {
      return { success: false, message: 'スプレッドシートIDが設定されていません' };
    }

    // 既存のトリガーを削除（両方の関数名をチェック）
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      const handlerName = trigger.getHandlerFunction();
      if (handlerName === 'hourlyBatchDataCollection' || handlerName === 'fetchMetricsHourly') {
        ScriptApp.deleteTrigger(trigger);
      }
    });

    // 新しいトリガーを作成（fetchMetricsHourlyを使用）
    ScriptApp.newTrigger('fetchMetricsHourly')
      .timeBased()
      .everyHours(1)
      .create();

    return { success: true, message: '1時間毎のバッチ処理トリガーを設定しました（fetchMetricsHourly）' };
  } catch (error) {
    console.error('バッチトリガー設定エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: 'バッチトリガー設定に失敗しました: ' + errorMessage };
  }
}

/**
 * バッチトリガーの状態を取得
 */
function getBatchTriggerStatus(): { success: boolean; data?: any; message?: string } {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    const batchTriggers = triggers.filter(
      trigger => {
        const handlerName = trigger.getHandlerFunction();
        return handlerName === 'hourlyBatchDataCollection' || handlerName === 'fetchMetricsHourly';
      }
    );

    // 詳細なトリガー情報を取得
    const triggerDetails = batchTriggers.map(trigger => {
      return {
        handlerFunction: trigger.getHandlerFunction(),
        triggerSource: trigger.getTriggerSource(),
        eventType: trigger.getEventType(),
        uniqueId: trigger.getUniqueId()
      };
    });

    // 全てのトリガーも取得（デバッグ用）
    const allTriggers = triggers.map(trigger => {
      return {
        handlerFunction: trigger.getHandlerFunction(),
        triggerSource: trigger.getTriggerSource(),
        eventType: trigger.getEventType(),
        uniqueId: trigger.getUniqueId()
      };
    });

    return {
      success: true,
      data: {
        isActive: batchTriggers.length > 0,
        triggerCount: batchTriggers.length,
        batchTriggers: triggerDetails,
        allTriggers: allTriggers
      }
    };
  } catch (error) {
    console.error('バッチトリガー状態取得エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: 'バッチトリガー状態の取得に失敗しました: ' + errorMessage };
  }
}

/**
 * バッチトリガーを削除
 */
function removeBatchTrigger(): { success: boolean; message: string } {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    let removedCount = 0;

    triggers.forEach(trigger => {
      const handlerName = trigger.getHandlerFunction();
      if (handlerName === 'hourlyBatchDataCollection' || handlerName === 'fetchMetricsHourly') {
        ScriptApp.deleteTrigger(trigger);
        removedCount++;
      }
    });

    return {
      success: true,
      message: `バッチトリガーを削除しました (${removedCount}個のトリガーを削除)`
    };
  } catch (error) {
    console.error('バッチトリガー削除エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: 'バッチトリガー削除に失敗しました: ' + errorMessage };
  }
}

/**
 * バッチ実行状況を取得
 */
function getBatchExecutionStatus(): { success: boolean; data?: any; message?: string } {
  return getBatchExecutionStatusReal();
}

/**
 * 1時間毎のバッチデータ収集
 * トリガーによって自動実行される
 */
function hourlyBatchDataCollection(): { success: boolean; message?: string; count?: number } {
  const executionId = Utilities.getUuid();
  const startTime = new Date();
  
  console.log(`[${executionId}] バッチデータ収集開始: ${startTime.toISOString()}`);
  
  try {
    // 設定確認
    const apiKey = getApiKey();
    if (!apiKey) {
      logBatchExecution(executionId, 'ERROR', 'API_KEY_NOT_SET', 
        'APIキーが設定されていません', null, 0, 'APIキーが未設定');
      console.error('APIキーが設定されていません');
      return { success: false, message: 'APIキーが設定されていません' };
    }
    
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
      logBatchExecution(executionId, 'ERROR', 'SPREADSHEET_NOT_SET',
        'スプレッドシートIDが設定されていません', null, 0, 'スプレッドシートIDが未設定');
      console.error('スプレッドシートIDが設定されていません');
      return { success: false, message: 'スプレッドシートIDが設定されていません' };
    }
    
    // 投稿一覧を取得（最新3件）
    console.log(`[${executionId}] Threads API: 投稿一覧取得開始`);
    const postsResult = fetchUserPostsWithRetry(apiKey, 3, 3);
    
    if (!postsResult.success) {
      logBatchExecution(executionId, 'ERROR', 'FETCH_POSTS_FAILED',
        '投稿データの取得に失敗しました', null, 0, postsResult.message || '不明なエラー');
      console.error('投稿データの取得に失敗:', postsResult.message);
      return { success: false, message: '投稿データの取得に失敗: ' + postsResult.message };
    }
    
    const posts = postsResult.data as any[];
    console.log(`[${executionId}] 投稿データ取得成功: ${posts.length}件`);
    
    if (posts.length === 0) {
      logBatchExecution(executionId, 'INFO', 'NO_POSTS',
        '取得できる投稿がありませんでした', null, 0, null);
      console.log('取得できる投稿がありません');
      return { success: true, message: '取得できる投稿がありません', count: 0 };
    }
    
    // 各投稿のインサイトを取得
    const processedPosts: any[] = [];
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`[${executionId}] 投稿 ${i + 1}/${posts.length}: ${post.id}`);
      
      try {
        // インサイト取得（リトライ付き）
        const insightsResult = fetchPostInsightsWithRetry(apiKey, post.id, 3);
        const insightsData = insightsResult.success ? insightsResult.data : null;
        
        // データ変換
        const processedPost = {
          id: post.id,
          text: post.text || '',
          timestamp: post.timestamp,
          mediaType: post.media_type || 'TEXT',
          insights: insightsData
            ? convertInsightsToMetrics([insightsData])
            : {
                views: 0,
                likes: 0,
                replies: 0,
                reposts: 0,
                quotes: 0,
                totalEngagement: 0,
                engagementRate: '0.00',
              },
          followerCount: 0, // フォロワー数は別途取得が必要
        };
        
        processedPosts.push(processedPost);
        successCount++;
        console.log(`[${executionId}] 投稿 ${post.id} 処理完了`);
        
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`投稿 ${post.id}: ${errorMessage}`);
        console.error(`[${executionId}] 投稿 ${post.id} 処理エラー:`, errorMessage);
        
        // エラーが発生してもデフォルト値で追加
        processedPosts.push({
          id: post.id,
          text: post.text || '',
          timestamp: post.timestamp,
          mediaType: post.media_type || 'TEXT',
          insights: {
            views: 0,
            likes: 0,
            replies: 0,
            reposts: 0,
            quotes: 0,
            totalEngagement: 0,
            engagementRate: '0.00',
          },
          followerCount: 0,
        });
      }
      
      // API制限対策: 各投稿処理後に1秒待機
      if (i < posts.length - 1) {
        Utilities.sleep(1000);
      }
    }
    
    // スプレッドシートに一括保存
    console.log(`[${executionId}] スプレッドシートへのデータ保存開始`);
    const saveResult = batchSaveDataToSpreadsheet(processedPosts);
    
    if (!saveResult.success) {
      logBatchExecution(executionId, 'ERROR', 'SAVE_FAILED',
        'スプレッドシートへの保存に失敗しました', null, processedPosts.length, saveResult.message);
      console.error('スプレッドシートへの保存に失敗:', saveResult.message);
      return { success: false, message: 'スプレッドシートへの保存に失敗: ' + saveResult.message };
    }
    
    // 実行時間計算
    const endTime = new Date();
    const executionTime = endTime.getTime() - startTime.getTime();
    
    // 成功ログ記録
    const logMessage = `${processedPosts.length}件のデータを収集・保存しました (成功: ${successCount}, エラー: ${errorCount})`;
    const errorDetails = errors.length > 0 ? errors.join('; ') : null;
    
    logBatchExecution(executionId, 'SUCCESS', 'BATCH_COMPLETED',
      logMessage, executionTime, processedPosts.length, errorDetails);
    
    console.log(`[${executionId}] バッチ処理完了: ${executionTime}ms`);
    console.log(`[${executionId}] 処理件数: ${processedPosts.length}件 (成功: ${successCount}, エラー: ${errorCount})`);
    
    return { success: true, message: logMessage, count: processedPosts.length };
    
  } catch (error) {
    const endTime = new Date();
    const executionTime = endTime.getTime() - startTime.getTime();
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logBatchExecution(executionId, 'ERROR', 'BATCH_FAILED',
      'バッチ処理で予期しないエラーが発生しました', executionTime, 0, errorMessage);
    
    console.error(`[${executionId}] バッチ処理エラー:`, error);
    return { success: false, message: 'バッチ処理エラー: ' + errorMessage };
  }
}

/**
 * バッチ実行ログを記録
 */
function logBatchExecution(
  executionId: string,
  logLevel: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR',
  processType: string,
  message: string,
  executionTime: number | null,
  postsProcessed: number,
  errorDetails: string | null
): void {
  try {
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
      console.warn('スプレッドシートIDが設定されていないため、ログを記録できません');
      return;
    }
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    let logsSheet = spreadsheet.getSheetByName('logs');
    
    // logsシートが存在しない場合は作成
    if (!logsSheet) {
      logsSheet = spreadsheet.insertSheet('logs');
      const headers = [
        'timestamp',       // A: ログ日時
        'execution_id',    // B: 実行ID
        'log_level',       // C: ログレベル
        'process_type',    // D: 処理タイプ
        'message',         // E: メッセージ
        'execution_time',  // F: 実行時間（ms）
        'posts_processed', // G: 処理投稿数
        'error_details'    // H: エラー詳細
      ];
      
      const headerRange = logsSheet.getRange(1, 1, 1, headers.length);
      headerRange.setValues([headers]);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('white');
      headerRange.setHorizontalAlignment('center');
      logsSheet.setFrozenRows(1);
    }
    
    // ログデータを追加
    const timestamp = new Date();
    const logData = [
      timestamp,
      executionId,
      logLevel,
      processType,
      message,
      executionTime !== null ? executionTime : '',
      postsProcessed,
      errorDetails !== null ? errorDetails : ''
    ];
    
    logsSheet.appendRow(logData);
    
    // 古いログの自動削除（90日以上前のログを削除）
    cleanupOldLogs(logsSheet, 90);
    
    console.log(`ログ記録完了: [${logLevel}] ${message}`);
    
  } catch (error) {
    console.error('ログ記録エラー:', error);
    // ログ記録エラーでもバッチ処理は継続
  }
}

/**
 * 古いログを削除
 */
function cleanupOldLogs(logsSheet: GoogleAppsScript.Spreadsheet.Sheet, retentionDays: number): void {
  try {
    const lastRow = logsSheet.getLastRow();
    if (lastRow <= 1) return; // ヘッダー行のみの場合は何もしない
    
    const dataRange = logsSheet.getRange(2, 1, lastRow - 1, 1); // タイムスタンプ列のみ取得
    const timestamps = dataRange.getValues();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    // 削除対象の行を特定（後ろから削除）
    for (let i = timestamps.length - 1; i >= 0; i--) {
      const timestamp = new Date(timestamps[i][0]);
      if (timestamp < cutoffDate) {
        logsSheet.deleteRow(i + 2); // ヘッダー行があるので+2
      }
    }
    
  } catch (error) {
    console.error('ログクリーンアップエラー:', error);
    // クリーンアップエラーでもバッチ処理は継続
  }
}

/**
 * バッチ実行状況を取得（実装版）
 */
function getBatchExecutionStatusReal(): { success: boolean; data?: any; message?: string } {
  try {
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
      return {
        success: false,
        message: 'スプレッドシートIDが設定されていません'
      };
    }
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const logsSheet = spreadsheet.getSheetByName('logs');
    
    if (!logsSheet) {
      return {
        success: true,
        data: {
          statistics: {
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0,
            errorRate: 0,
            averagePostsProcessed: 0,
            averageExecutionTime: 0,
            lastExecution: null
          },
          systemHealth: {
            isHealthy: true,
            consecutiveFailures: 0
          }
        }
      };
    }
    
    const lastRow = logsSheet.getLastRow();
    if (lastRow <= 1) {
      return {
        success: true,
        data: {
          statistics: {
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0,
            errorRate: 0,
            averagePostsProcessed: 0,
            averageExecutionTime: 0,
            lastExecution: null
          },
          systemHealth: {
            isHealthy: true,
            consecutiveFailures: 0
          }
        }
      };
    }
    
    // 過去30日分のログを取得
    const dataRange = logsSheet.getRange(2, 1, lastRow - 1, 8);
    const logs = dataRange.getValues();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    // 統計計算
    let totalExecutions = 0;
    let successfulExecutions = 0;
    let failedExecutions = 0;
    let totalPostsProcessed = 0;
    let totalExecutionTime = 0;
    let executionTimeCount = 0;
    let consecutiveFailures = 0;
    let lastExecution: Date | null = null;
    
    // 最新のログから処理（連続失敗数のため）
    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i];
      const timestamp = new Date(log[0]);
      const logLevel = log[2];
      const processType = log[3];
      const executionTime = log[5];
      const postsProcessed = log[6];
      
      // 最後の実行日時を記録
      if (!lastExecution && processType === 'BATCH_COMPLETED') {
        lastExecution = timestamp;
      }
      
      // 過去30日のバッチ実行のみカウント
      if (timestamp >= cutoffDate && (processType === 'BATCH_COMPLETED' || processType === 'BATCH_FAILED')) {
        totalExecutions++;
        
        if (logLevel === 'SUCCESS') {
          successfulExecutions++;
          consecutiveFailures = 0; // 成功したら連続失敗をリセット
        } else if (logLevel === 'ERROR') {
          failedExecutions++;
          if (i === logs.length - 1 || consecutiveFailures > 0) {
            consecutiveFailures++;
          }
        }
        
        if (typeof postsProcessed === 'number' && postsProcessed > 0) {
          totalPostsProcessed += postsProcessed;
        }
        
        if (typeof executionTime === 'number' && executionTime > 0) {
          totalExecutionTime += executionTime;
          executionTimeCount++;
        }
      }
    }
    
    // 平均値計算
    const averagePostsProcessed = totalExecutions > 0 
      ? Math.round(totalPostsProcessed / totalExecutions) 
      : 0;
    const averageExecutionTime = executionTimeCount > 0 
      ? Math.round(totalExecutionTime / executionTimeCount) 
      : 0;
    const errorRate = totalExecutions > 0 
      ? (failedExecutions / totalExecutions) * 100 
      : 0;
    
    // システムヘルスチェック
    const isHealthy = consecutiveFailures < 3 && errorRate < 50;
    
    return {
      success: true,
      data: {
        statistics: {
          totalExecutions,
          successfulExecutions,
          failedExecutions,
          errorRate: Math.round(errorRate * 100) / 100,
          averagePostsProcessed,
          averageExecutionTime,
          lastExecution: lastExecution ? lastExecution.toISOString() : null
        },
        systemHealth: {
          isHealthy,
          consecutiveFailures
        },
        recentLogs: logs.slice(-10).reverse().map(log => ({
          timestamp: log[0],
          executionId: log[1],
          logLevel: log[2],
          processType: log[3],
          message: log[4],
          executionTime: log[5],
          postsProcessed: log[6],
          errorDetails: log[7]
        }))
      }
    };
    
  } catch (error) {
    console.error('バッチ実行状況取得エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: 'バッチ実行状況の取得に失敗しました: ' + errorMessage };
  }
}

/**
 * 時刻を1時間単位に丸める
 */
function truncateToHour(date: Date): Date {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d;
}

/**
 * Threads APIから投稿を取得してpostsシートに追加・更新
 */
function addOrUpdatePosts(): { success: boolean; message: string; addedCount: number; updatedCount: number } {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return { success: false, message: 'APIキーが設定されていません', addedCount: 0, updatedCount: 0 };
    }

    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
      return { success: false, message: 'スプレッドシートIDが設定されていません', addedCount: 0, updatedCount: 0 };
    }

    // Threads APIから投稿一覧を取得（最大100件）
    console.log('Threads APIから投稿を取得中...');
    const postsResult = fetchUserPostsWithRetry(apiKey, 100);
    if (!postsResult.success || !postsResult.data) {
      return { success: false, message: '投稿一覧の取得に失敗しました', addedCount: 0, updatedCount: 0 };
    }

    const allApiPosts = Array.isArray(postsResult.data) ? postsResult.data : [];
    console.log(`APIから取得した投稿総数: ${allApiPosts.length}件`);

    // 7日前までの投稿をフィルタリング
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoTimestamp = Math.floor(sevenDaysAgo.getTime() / 1000);
    
    const apiPosts = allApiPosts.filter((post: any) => {
      if (!post.timestamp) return false;
      // timestampはISO8601形式の文字列またはUnixタイムスタンプの可能性がある
      let postTimestamp: number;
      if (typeof post.timestamp === 'string') {
        postTimestamp = Math.floor(new Date(post.timestamp).getTime() / 1000);
      } else {
        postTimestamp = post.timestamp;
      }
      return postTimestamp >= sevenDaysAgoTimestamp;
    });
    
    console.log(`7日前までの投稿: ${apiPosts.length}件`);

    // スプレッドシートを開く
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    let postsSheet = spreadsheet.getSheetByName('posts');
    
    // postsシートが存在しない場合は作成
    if (!postsSheet) {
      console.log('postsシートが見つからないため作成します');
      try {
        const manager = new SpreadsheetManager();
        manager.createPostsMasterTable();
        postsSheet = spreadsheet.getSheetByName('posts');
        if (!postsSheet) {
          return { success: false, message: 'postsシートの作成に失敗しました', addedCount: 0, updatedCount: 0 };
        }
        console.log('postsシートを作成しました');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('postsシート作成エラー:', errorMessage);
        return { success: false, message: 'postsシートの作成に失敗しました: ' + errorMessage, addedCount: 0, updatedCount: 0 };
      }
    }

    // 既存の投稿IDを取得
    const existingData = postsSheet.getLastRow() > 1 ? postsSheet.getRange(2, 1, postsSheet.getLastRow() - 1, 1).getValues() : [];
    const existingPostIds = new Set(existingData.map(row => row[0]));

    let addedCount = 0;
    let updatedCount = 0;
    const now = new Date();

    // 各投稿を処理
    for (const post of apiPosts) {
      const postId = post.id;
      const platform = 'threads';
      const accountId = post.username || 'unknown';
      const postedAt = post.timestamp;
      const content = post.text || '';
      const url = post.permalink || '';
      const charCount = content.length;
      const mediaType = post.media_type || 'TEXT';
      const hashtags = extractHashtags(content);

      if (existingPostIds.has(postId)) {
        // 既存投稿を更新（updated_atのみ更新）
        const rowIndex = findPostRow(postsSheet, postId);
        if (rowIndex !== null) {
          postsSheet.getRange(rowIndex, 11).setValue(now); // K列: updated_at
          updatedCount++;
        }
      } else {
        // 新規投稿を追加
        postsSheet.appendRow([
          postId,           // A: post_id
          platform,         // B: platform
          accountId,        // C: account_id
          postedAt,         // D: posted_at
          content,          // E: content
          url,              // F: url
          charCount,        // G: char_count
          mediaType,        // H: media_type
          hashtags,         // I: hashtags
          now,              // J: created_at
          now               // K: updated_at
        ]);
        addedCount++;
      }
    }

    const message = `7日前までの投稿: ${apiPosts.length}件（追加${addedCount}件, 更新${updatedCount}件）`;
    console.log(`投稿マスタ更新完了: ${message}`);
    return { 
      success: true, 
      message: message, 
      addedCount, 
      updatedCount 
    };

  } catch (error) {
    console.error('投稿マスタ更新エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: errorMessage, addedCount: 0, updatedCount: 0 };
  }
}

/**
 * postsシート内で指定したpost_idの行番号を検索
 */
function findPostRow(sheet: GoogleAppsScript.Spreadsheet.Sheet, postId: string): number | null {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === postId) {
      return i + 1; // 1-indexed
    }
  }
  return null;
}

/**
 * テキストからハッシュタグを抽出
 */
function extractHashtags(text: string): string {
  const hashtags = text.match(/#[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+/g);
  return hashtags ? hashtags.join(',') : '';
}

/**
 * 過去N日以内の投稿を取得（postsシートから）
 */
function getRecentPosts(days: number): any[] {
  try {
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
      console.error('スプレッドシートIDが設定されていません');
      return [];
    }

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    let postsSheet = spreadsheet.getSheetByName('posts');
    
    // postsシートが存在しない場合は作成
    if (!postsSheet) {
      console.log('postsシートが見つからないため作成します');
      try {
        const manager = new SpreadsheetManager();
        manager.createPostsMasterTable();
        postsSheet = spreadsheet.getSheetByName('posts');
        if (!postsSheet) {
          console.error('postsシートの作成に失敗しました');
          return [];
        }
        console.log('postsシートを作成しました');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('postsシート作成エラー:', errorMessage);
        return [];
      }
    }
    
    if (postsSheet.getLastRow() < 2) {
      console.log('投稿データがありません');
      return [];
    }

    const values = postsSheet.getDataRange().getValues();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const posts = [];
    for (let i = 1; i < values.length; i++) {
      const postedAt = new Date(values[i][3]); // D列: posted_at
      if (postedAt >= cutoffDate) {
        posts.push({
          post_id: values[i][0],        // A: post_id
          platform: values[i][1],       // B: platform
          account_id: values[i][2],     // C: account_id
          posted_at: values[i][3],      // D: posted_at
          content: values[i][4],        // E: content
          url: values[i][5],            // F: url
          media_type: values[i][7]      // H: media_type
        });
      }
    }
    
    console.log(`過去${days}日間の投稿: ${posts.length}件（postsシートから取得）`);
    return posts;
  } catch (error) {
    console.error('投稿データ取得エラー:', error);
    return [];
  }
}

/**
 * 既存メトリクス行を検索
 */
function findMetricRow(sheet: GoogleAppsScript.Spreadsheet.Sheet, postId: string, capturedAt: Date): number | null {
  try {
    const values = sheet.getDataRange().getValues();
    
    for (let i = 1; i < values.length; i++) {
      const rowPostId = values[i][0];
      const rowCapturedAt = new Date(values[i][1]);
      
      if (rowPostId === postId && rowCapturedAt.getTime() === capturedAt.getTime()) {
        return i + 1; // 1-based index
      }
    }
    
    return null;
  } catch (error) {
    console.error('メトリクス行検索エラー:', error);
    return null;
  }
}

/**
 * 古いメトリクスデータを削除
 */
function deleteOldMetrics(sheet: GoogleAppsScript.Spreadsheet.Sheet, retentionDays: number): void {
  try {
    const values = sheet.getDataRange().getValues();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    // 削除対象行を逆順で削除（行番号がずれないように）
    for (let i = values.length - 1; i >= 1; i--) {
      const capturedAt = new Date(values[i][1]);
      if (capturedAt < cutoffDate) {
        sheet.deleteRow(i + 1);
      }
    }
  } catch (error) {
    console.error('古いデータ削除エラー:', error);
  }
}

/**
 * 時系列メトリクス収集（1時間ごと）
 */
function fetchMetricsHourly(): { success: boolean; message: string; count: number } {
  const executionId = Utilities.getUuid();
  const startTime = new Date();
  
  console.log(`[${executionId}] 時系列メトリクス収集開始: ${startTime.toISOString()}`);
  
  try {
    const now = new Date();
    const capturedAt = truncateToHour(now);
    
    // 設定確認
    const apiKey = getApiKey();
    if (!apiKey) {
      console.error('APIキーが設定されていません');
      return { success: false, message: 'APIキーが設定されていません', count: 0 };
    }
    
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
      console.error('スプレッドシートIDが設定されていません');
      return { success: false, message: 'スプレッドシートIDが設定されていません', count: 0 };
    }
    
    // ステップ1: 投稿マスタを更新（Threads APIから最新の投稿を取得してpostsシートに反映）
    console.log(`[${executionId}] ステップ1: 投稿マスタ更新開始`);
    const updateResult = addOrUpdatePosts();
    if (!updateResult.success) {
      const errorMsg = `投稿マスタの更新に失敗: ${updateResult.message}`;
      console.error(`[${executionId}] ${errorMsg}`);
      // エラーでも続行（既存データからメトリクスを取得できる可能性がある）
      console.warn(`[${executionId}] 投稿マスタ更新失敗ですが、既存データから続行します`);
    } else {
      console.log(`[${executionId}] 投稿マスタ更新完了: ${updateResult.message}`);
    }
    
    // ステップ2: 過去7日以内の投稿を取得（postsシートから）
    console.log(`[${executionId}] ステップ2: メトリクス収集対象の投稿を取得`);
    const posts = getRecentPosts(7);
    console.log(`[${executionId}] 過去7日以内の投稿: ${posts.length}件`);
    
    if (posts.length === 0) {
      const msg = '取得対象の投稿がありません。postsシートにデータが存在するか確認してください。';
      console.log(`[${executionId}] ${msg}`);
      return { success: false, message: msg, count: 0 };
    }
    
    // 各投稿のメトリクスを取得
    const metrics: any[] = [];
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`[${executionId}] 投稿 ${i + 1}/${posts.length}: ${post.post_id}`);
      
      try {
        // インサイト取得
        const insightsResult = fetchPostInsightsWithRetry(apiKey, post.post_id, 3);
        
        if (!insightsResult.success) {
          console.warn(`投稿 ${post.post_id} のインサイト取得失敗`);
          continue;
        }
        
        const insightsData = insightsResult.data as any;
        
        // デバッグ: インサイトデータの構造をログ出力
        console.log(`[${executionId}] 投稿 ${post.post_id} のインサイトデータ:`, JSON.stringify(insightsData));
        
        // 投稿からの経過時間を計算
        const hoursSincePost = Math.floor(
          (now.getTime() - new Date(post.posted_at).getTime()) / (1000 * 60 * 60)
        );
        
        // メトリクス変換（insightsDataは既に配列の可能性がある）
        const insightsArray = Array.isArray(insightsData) ? insightsData : (insightsData ? [insightsData] : []);
        console.log(`[${executionId}] 変換前のインサイト配列:`, JSON.stringify(insightsArray));
        const convertedMetrics = convertInsightsToMetrics(insightsArray);
        console.log(`[${executionId}] 変換後のメトリクス:`, JSON.stringify(convertedMetrics));
        
        metrics.push({
          post_id: post.post_id,
          captured_at: capturedAt,
          impressions: convertedMetrics.views || 0,
          likes: convertedMetrics.likes || 0,
          comments: convertedMetrics.replies || 0,
          shares: convertedMetrics.reposts || 0,
          follower_count: 0, // フォロワー数は別途取得が必要
          account_id: post.account_id,
          engagement_rate: parseFloat(convertedMetrics.engagementRate || '0'),
          hours_since_post: hoursSincePost
        });
        
        console.log(`[${executionId}] 投稿 ${post.post_id} メトリクス取得完了`);
        
      } catch (error) {
        console.error(`投稿 ${post.post_id} のメトリクス取得エラー:`, error);
      }
      
      // レート制限対策: 18秒間隔
      if (i < posts.length - 1) {
        Utilities.sleep(18000);
      }
    }
    
    // post_metrics_hourlyシートに保存
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    let metricsSheet = spreadsheet.getSheetByName('post_metrics_hourly');
    
    // post_metrics_hourlyシートが存在しない場合は作成
    if (!metricsSheet) {
      console.log('post_metrics_hourlyシートが見つからないため作成します');
      try {
        const manager = new SpreadsheetManager();
        manager.createPostMetricsHourlyTable();
        metricsSheet = spreadsheet.getSheetByName('post_metrics_hourly');
        if (!metricsSheet) {
          console.error('post_metrics_hourlyシートの作成に失敗しました');
          return { success: false, message: 'post_metrics_hourlyシートの作成に失敗しました', count: 0 };
        }
        console.log('post_metrics_hourlyシートを作成しました');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('post_metrics_hourlyシート作成エラー:', errorMessage);
        return { success: false, message: 'post_metrics_hourlyシートの作成に失敗しました: ' + errorMessage, count: 0 };
      }
    }
    
    // データ保存
    for (const metric of metrics) {
      const existingRow = findMetricRow(metricsSheet, metric.post_id, metric.captured_at);
      
      if (existingRow === null) {
        // 新規追加
        metricsSheet.appendRow([
          metric.post_id,
          metric.captured_at,
          metric.impressions,
          metric.likes,
          metric.comments,
          metric.shares,
          metric.follower_count,
          metric.account_id,
          metric.engagement_rate,
          metric.hours_since_post
        ]);
      } else {
        // 上書き更新
        metricsSheet.getRange(existingRow, 1, 1, 10).setValues([[
          metric.post_id,
          metric.captured_at,
          metric.impressions,
          metric.likes,
          metric.comments,
          metric.shares,
          metric.follower_count,
          metric.account_id,
          metric.engagement_rate,
          metric.hours_since_post
        ]]);
      }
    }
    
    // 古いデータを削除
    deleteOldMetrics(metricsSheet, 7);
    
    const endTime = new Date();
    const executionTime = endTime.getTime() - startTime.getTime();
    
    if (metrics.length === 0) {
      const msg = 'メトリクスの取得に失敗しました。インサイトAPIの権限を確認してください。';
      console.error(`[${executionId}] ${msg}`);
      return { success: false, message: msg, count: 0 };
    }
    
    console.log(`[${executionId}] 時系列メトリクス収集完了: ${executionTime}ms, ${metrics.length}件`);
    
    return { success: true, message: `${metrics.length}件のメトリクスを収集しました`, count: metrics.length };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${executionId}] 時系列メトリクス収集エラー:`, error);
    return { success: false, message: `エラーが発生しました: ${errorMessage}`, count: 0 };
  }
}

/**
 * 投稿ごとの時系列データを取得
 */
function getMetricsByPostId(postId: string): any[] {
  try {
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
      console.error('スプレッドシートIDが設定されていません');
      return [];
    }
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName('post_metrics_hourly');
    
    if (!sheet || sheet.getLastRow() < 2) {
      return [];
    }
    
    const values = sheet.getDataRange().getValues();
    const result = [];
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === postId) {
        result.push({
          postId: values[i][0],
          capturedAt: values[i][1],
          impressions: values[i][2],
          likes: values[i][3],
          comments: values[i][4],
          shares: values[i][5],
          followerCount: values[i][6],
          accountId: values[i][7],
          engagementRate: values[i][8],
          hoursSincePost: values[i][9]
        });
      }
    }
    
    // 時刻順にソート
    result.sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());
    
    return result;
  } catch (error) {
    console.error('投稿別メトリクス取得エラー:', error);
    return [];
  }
}

/**
 * 過去7日分の時系列データを取得
 */
function getMetricsForLast7Days(): any[] {
  try {
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
      return [];
    }
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName('post_metrics_hourly');
    
    if (!sheet || sheet.getLastRow() < 2) {
      return [];
    }
    
    const values = sheet.getDataRange().getValues();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const result = [];
    
    for (let i = 1; i < values.length; i++) {
      const capturedAt = new Date(values[i][1]);
      
      if (capturedAt >= sevenDaysAgo) {
        result.push({
          postId: values[i][0],
          capturedAt: capturedAt.toISOString(),
          impressions: values[i][2],
          likes: values[i][3],
          comments: values[i][4],
          shares: values[i][5],
          followerCount: values[i][6],
          accountId: values[i][7],
          engagementRate: values[i][8],
          hoursSincePost: values[i][9]
        });
      }
    }
    
    return result;
  } catch (error) {
    console.error('過去7日分メトリクス取得エラー:', error);
    return [];
  }
}

/**
 * 手動実行用のメイン関数（テスト用）
 */
function main(): void {
  try {
    runAnalysis();
  } catch (error) {
    console.error('メイン処理エラー:', error);
    throw error;
  }
}

/**
 * バッチ処理の手動実行（テスト用）
 */
function testBatchExecution(): void {
  try {
    console.log('=== バッチ処理テスト実行開始 ===');
    hourlyBatchDataCollection();
    console.log('=== バッチ処理テスト実行完了 ===');
  } catch (error) {
    console.error('バッチ処理テストエラー:', error);
    throw error;
  }
}

/**
 * スプレッドシートから全データを取得
 * Webアプリ起動時に使用
 */
function getAllSpreadsheetData(): { success: boolean; message?: string; data?: any[] } {
  try {
    console.log('getAllSpreadsheetData: 開始');
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
      console.error('getAllSpreadsheetData: スプレッドシートIDが設定されていません');
      return { success: false, message: 'スプレッドシートIDが設定されていません' };
    }

    console.log('getAllSpreadsheetData: スプレッドシートID取得成功:', spreadsheetId);
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const postsSheet = spreadsheet.getSheetByName('posts');
    const metricsSheet = spreadsheet.getSheetByName('post_metrics_hourly');
    
    if (!postsSheet) {
      console.warn('getAllSpreadsheetData: postsシートが見つかりません');
      return { success: false, message: 'postsシートが見つかりません。データベースを初期化してください。', data: [] };
    }

    const lastRow = postsSheet.getLastRow();
    console.log('getAllSpreadsheetData: postsシートの最終行:', lastRow);
    if (lastRow < 2) {
      console.warn('getAllSpreadsheetData: postsシートにデータが存在しません');
      return { success: false, message: 'postsシートにデータが存在しません。データ取得を実行してください。', data: [] };
    }

    // postsシートからデータを取得
    const postsData = postsSheet.getRange(2, 1, lastRow - 1, 11).getValues();
    
    const result: any[] = [];
    
    // 各投稿について最新のメトリクスを取得
    for (let i = 0; i < postsData.length; i++) {
      const postRow = postsData[i];
      const postId = postRow[0]; // A: post_id
      
      // 投稿基本情報
      const postData: any = {
        id: postId,
        text: postRow[4] || '',           // E: content
        timestamp: postRow[3],            // D: posted_at
        media_type: postRow[7] || 'TEXT', // H: media_type
        character_count: postRow[6] || 0, // G: char_count
        insights: {
          views: 0,
          likes: 0,
          replies: 0,
          reposts: 0,
          quotes: 0,
          total_engagement: 0,
          engagement_rate: 0,
          follower_count: 0
        }
      };
      
      // メトリクスシートから最新のメトリクスを取得
      if (metricsSheet && metricsSheet.getLastRow() >= 2) {
        const metricsData = metricsSheet.getDataRange().getValues();
        
        // 該当する投稿IDの最新メトリクスを検索
        let latestMetrics: any = null;
        let latestTime = 0;
        
        for (let j = 1; j < metricsData.length; j++) {
          if (metricsData[j][0] === postId) { // A: post_id
            const capturedAt = new Date(metricsData[j][1]).getTime(); // B: captured_at
            if (capturedAt > latestTime) {
              latestTime = capturedAt;
              latestMetrics = metricsData[j];
            }
          }
        }
        
        // 最新メトリクスがあれば反映
        if (latestMetrics) {
          postData.insights = {
            views: latestMetrics[2] || 0,        // C: impressions
            likes: latestMetrics[3] || 0,        // D: likes
            replies: latestMetrics[4] || 0,      // E: comments
            reposts: latestMetrics[5] || 0,      // F: shares
            quotes: 0,
            total_engagement: (latestMetrics[3] || 0) + (latestMetrics[4] || 0) + (latestMetrics[5] || 0),
            engagement_rate: latestMetrics[8] || 0,  // I: engagement_rate
            follower_count: latestMetrics[6] || 0    // G: follower_count
          };
        }
      }
      
      result.push(postData);
    }

    // タイムスタンプ順でソート（新しい順）
    result.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    });

    console.log(`✅ getAllSpreadsheetData: postsシートから${result.length}件のデータを取得しました`);
    if (result.length > 0) {
      console.log('✅ getAllSpreadsheetData: 最初のデータサンプル:', JSON.stringify(result[0]));
    }
    return { success: true, data: result };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ getAllSpreadsheetData: スプレッドシートデータ取得エラー:', error);
    console.error('❌ getAllSpreadsheetData: エラー詳細:', errorMessage);
    return { success: false, message: 'データ取得エラー: ' + errorMessage };
  }
}

/**
 * ThreadsDataシートを削除
 */
function deleteThreadsDataSheet(): { success: boolean; message: string } {
  try {
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
      return { success: false, message: 'スプレッドシートIDが設定されていません' };
    }

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const threadsDataSheet = spreadsheet.getSheetByName('ThreadsData');
    
    if (!threadsDataSheet) {
      return { success: true, message: 'ThreadsDataシートは存在しません' };
    }
    
    // シートを削除
    spreadsheet.deleteSheet(threadsDataSheet);
    
    console.log('✅ ThreadsDataシートを削除しました');
    return { success: true, message: 'ThreadsDataシートを削除しました' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('ThreadsDataシート削除エラー:', error);
    return { success: false, message: 'ThreadsDataシート削除エラー: ' + errorMessage };
  }
}

/**
 * ThreadsDataシートのデータをpostsとpost_metrics_hourlyシートに移行
 * 既存のThreadsDataシートのデータを新しいスキーマに変換
 */
function migrateThreadsDataToNewSchema(): { success: boolean; message: string; migrated?: number } {
  try {
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
      return { success: false, message: 'スプレッドシートIDが設定されていません' };
    }

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    
    // シートの存在確認と作成
    let postsSheet = spreadsheet.getSheetByName('posts');
    let metricsSheet = spreadsheet.getSheetByName('post_metrics_hourly');
    
    if (!postsSheet || !metricsSheet) {
      // シートが存在しない場合は初期化
      const initResult = initializeSpreadsheetDatabase();
      if (!initResult.success) {
        return { success: false, message: 'シートの初期化に失敗しました: ' + initResult.message };
      }
      postsSheet = spreadsheet.getSheetByName('posts');
      metricsSheet = spreadsheet.getSheetByName('post_metrics_hourly');
    }
    
    // ThreadsDataシートを取得
    const threadsDataSheet = spreadsheet.getSheetByName('ThreadsData');
    if (!threadsDataSheet) {
      return { success: false, message: 'ThreadsDataシートが見つかりません' };
    }
    
    const lastRow = threadsDataSheet.getLastRow();
    if (lastRow < 2) {
      return { success: true, message: '移行するデータがありません', migrated: 0 };
    }
    
    // ThreadsDataシートのデータを取得
    // 列構成: タイムスタンプ, 投稿ID, 投稿文, 文字数, タイプ, 投稿日時, インプレッション, いいね, 再投稿, 引用, リプライ, エンゲージメント総数, エンゲージメント率, フォロワー数, 取得時刻
    const threadsData = threadsDataSheet.getRange(2, 1, lastRow - 1, 15).getValues();
    
    let migratedPosts = 0;
    let migratedMetrics = 0;
    const processedPostIds = new Set<string>();
    
    for (let i = 0; i < threadsData.length; i++) {
      const row = threadsData[i];
      const postId = String(row[1]); // B: 投稿ID
      const postText = String(row[2] || ''); // C: 投稿文
      const charCount = Number(row[3] || 0); // D: 文字数
      const postType = String(row[4] || 'TEXT_POST'); // E: タイプ
      const postedAt = row[5]; // F: 投稿日時
      const impressions = Number(row[6] || 0); // G: インプレッション
      const likes = Number(row[7] || 0); // H: いいね
      const reposts = Number(row[8] || 0); // I: 再投稿
      const quotes = Number(row[9] || 0); // J: 引用
      const replies = Number(row[10] || 0); // K: リプライ
      const engagementTotal = Number(row[11] || 0); // L: エンゲージメント総数
      const engagementRate = Number(row[12] || 0); // M: エンゲージメント率
      const followerCount = Number(row[13] || 0); // N: フォロワー数
      const capturedAt = row[14] || row[0]; // O: 取得時刻 または A: タイムスタンプ
      
      if (!postId || postId === 'undefined' || postId === 'null') {
        continue;
      }
      
      // postsシートに追加（重複チェック）
      if (!processedPostIds.has(postId)) {
        const existingPostRow = findPostRow(postsSheet!, postId);
        
        if (existingPostRow === null) {
          // 新規追加
          postsSheet!.appendRow([
            postId,                    // A: post_id
            'threads',                 // B: platform
            '',                        // C: account_id (ThreadsDataにはない)
            postedAt,                  // D: posted_at
            postText,                  // E: content
            '',                        // F: url (ThreadsDataにはない)
            charCount,                 // G: char_count
            postType.replace('_POST', ''), // H: media_type
            '',                        // I: hashtags (ThreadsDataにはない)
            new Date(),                // J: created_at
            new Date()                 // K: updated_at
          ]);
          migratedPosts++;
        }
        
        processedPostIds.add(postId);
      }
      
      // post_metrics_hourlyシートに追加（重複チェック）
      const capturedAtDate = capturedAt instanceof Date ? capturedAt : new Date(capturedAt);
      const existingMetricRow = findMetricRow(metricsSheet!, postId, capturedAtDate);
      
      if (existingMetricRow === null) {
        // 投稿からの経過時間を計算
        const postedAtDate = postedAt instanceof Date ? postedAt : new Date(postedAt);
        const hoursSincePost = Math.floor(
          (capturedAtDate.getTime() - postedAtDate.getTime()) / (1000 * 60 * 60)
        );
        
        metricsSheet!.appendRow([
          postId,                      // A: post_id
          capturedAtDate,              // B: captured_at
          impressions,                 // C: impressions
          likes,                       // D: likes
          replies,                     // E: comments
          reposts + quotes,            // F: shares (再投稿 + 引用)
          followerCount,               // G: follower_count
          '',                          // H: account_id (ThreadsDataにはない)
          engagementRate,              // I: engagement_rate
          hoursSincePost               // J: hours_since_post
        ]);
        migratedMetrics++;
      }
    }
    
    return {
      success: true,
      message: `移行完了: 投稿${migratedPosts}件、メトリクス${migratedMetrics}件`,
      migrated: migratedPosts + migratedMetrics
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('データ移行エラー:', error);
    return { success: false, message: 'データ移行エラー: ' + errorMessage };
  }
}

