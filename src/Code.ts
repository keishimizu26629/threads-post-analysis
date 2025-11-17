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
