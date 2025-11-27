/**
 * Threads投稿分析ツール - Webアプリケーション版
 * Google Apps ScriptでWebアプリとして動作するThreads投稿分析システム
 */

// GAS環境では import/export は使用できないため、型定義のみ参照
// 実際のクラスはグローバルスコープで利用可能

/**
 * WebアプリのGETリクエストを処理
 * HTMLページを返す
 */
function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput {
  try {
    // eがundefinedの場合（テスト実行時）のハンドリング
    const page = (e && e.parameter && e.parameter.page) || 'dashboard';

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

    // 投稿一覧を取得（最新5件）
    const posts = fetchUserPosts(apiKey, 5);
    if (!posts.success) {
      return { success: false, message: '投稿一覧の取得に失敗: ' + posts.message };
    }

    return {
      success: true,
      data: {
        user: userInfo.data,
        posts: posts.data,
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
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
      return { success: false, message: 'スプレッドシートIDが設定されていません' };
    }

    const manager = new SpreadsheetManager();
    const result = manager.initializeDatabase();

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

    // 既存のトリガーを削除
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'hourlyBatchDataCollection') {
        ScriptApp.deleteTrigger(trigger);
      }
    });

    // 新しいトリガーを作成
    ScriptApp.newTrigger('hourlyBatchDataCollection')
      .timeBased()
      .everyHours(1)
      .create();

    return { success: true, message: '1時間毎のバッチ処理トリガーを設定しました' };
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
      trigger => trigger.getHandlerFunction() === 'hourlyBatchDataCollection'
    );

    return {
      success: true,
      data: {
        isActive: batchTriggers.length > 0,
        triggerCount: batchTriggers.length
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
      if (trigger.getHandlerFunction() === 'hourlyBatchDataCollection') {
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
function hourlyBatchDataCollection(): void {
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
      return;
    }
    
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
      logBatchExecution(executionId, 'ERROR', 'SPREADSHEET_NOT_SET',
        'スプレッドシートIDが設定されていません', null, 0, 'スプレッドシートIDが未設定');
      console.error('スプレッドシートIDが設定されていません');
      return;
    }
    
    // 投稿一覧を取得（最新3件）
    console.log(`[${executionId}] Threads API: 投稿一覧取得開始`);
    const postsResult = fetchUserPostsWithRetry(apiKey, 3, 3);
    
    if (!postsResult.success) {
      logBatchExecution(executionId, 'ERROR', 'FETCH_POSTS_FAILED',
        '投稿データの取得に失敗しました', null, 0, postsResult.message || '不明なエラー');
      console.error('投稿データの取得に失敗:', postsResult.message);
      return;
    }
    
    const posts = postsResult.data as any[];
    console.log(`[${executionId}] 投稿データ取得成功: ${posts.length}件`);
    
    if (posts.length === 0) {
      logBatchExecution(executionId, 'INFO', 'NO_POSTS',
        '取得できる投稿がありませんでした', null, 0, null);
      console.log('取得できる投稿がありません');
      return;
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
      return;
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
    
  } catch (error) {
    const endTime = new Date();
    const executionTime = endTime.getTime() - startTime.getTime();
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logBatchExecution(executionId, 'ERROR', 'BATCH_FAILED',
      'バッチ処理で予期しないエラーが発生しました', executionTime, 0, errorMessage);
    
    console.error(`[${executionId}] バッチ処理エラー:`, error);
    throw error;
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
