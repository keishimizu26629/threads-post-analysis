/**
 * Google Apps Script用ユーティリティ関数
 * GAS環境での開発を支援する共通関数群
 */

/**
 * 安全なJSON.parse（エラーハンドリング付き）
 */
function safeJsonParse<T = object>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('JSON解析エラー:', error, 'デフォルト値を使用します');
    return defaultValue;
  }
}

/**
 * 安全なJSON.stringify（エラーハンドリング付き）
 */
function safeJsonStringify(obj: object): string {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.error('JSON文字列化エラー:', error);
    return '{}';
  }
}

/**
 * プロパティサービスから安全にデータを取得
 */
function getPropertySafely(key: string, defaultValue: string = ''): string {
  try {
    return PropertiesService.getScriptProperties().getProperty(key) || defaultValue;
  } catch (error) {
    console.error(`プロパティ取得エラー (${key}):`, error);
    return defaultValue;
  }
}

/**
 * プロパティサービスに安全にデータを保存
 */
function setPropertySafely(key: string, value: string): boolean {
  try {
    PropertiesService.getScriptProperties().setProperty(key, value);
    return true;
  } catch (error) {
    console.error(`プロパティ保存エラー (${key}):`, error);
    return false;
  }
}

/**
 * 複数のプロパティを一括で安全に保存
 */
function setPropertiesSafely(properties: { [key: string]: string }): boolean {
  try {
    PropertiesService.getScriptProperties().setProperties(properties);
    return true;
  } catch (error) {
    console.error('プロパティ一括保存エラー:', error);
    return false;
  }
}

/**
 * プロパティを安全に削除
 */
function deletePropertySafely(key: string): boolean {
  try {
    PropertiesService.getScriptProperties().deleteProperty(key);
    return true;
  } catch (error) {
    console.error(`プロパティ削除エラー (${key}):`, error);
    return false;
  }
}

/**
 * URLFetchを安全に実行（リトライ機能付き）
 */
function fetchUrlSafely(
  url: string,
  options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {},
  maxRetries: number = 3
): GoogleAppsScript.URL_Fetch.HTTPResponse | null {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return UrlFetchApp.fetch(url, options);
    } catch (error) {
      lastError = error as Error;
      console.warn(`URL取得失敗 (試行 ${attempt}/${maxRetries}):`, error);

      if (attempt < maxRetries) {
        // 指数バックオフで待機
        Utilities.sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }

  console.error(`URL取得最終失敗 (${url}):`, lastError);
  return null;
}

/**
 * 安全な日付フォーマット
 */
function formatDateSafely(
  date: Date | string | number,
  format: string = 'yyyy-MM-dd HH:mm:ss'
): string {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }
    return Utilities.formatDate(dateObj, Session.getScriptTimeZone(), format);
  } catch (error) {
    console.error('日付フォーマットエラー:', error);
    return new Date().toISOString();
  }
}

/**
 * GAS実行時間制限チェック
 * 実行開始から指定時間が経過したかチェック
 */
function isExecutionTimeExceeded(startTime: number, maxMinutes: number = 5): boolean {
  const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);
  return elapsedMinutes >= maxMinutes;
}

/**
 * 安全なスプレッドシート操作
 */
function getSpreadsheetSafely(id?: string): GoogleAppsScript.Spreadsheet.Spreadsheet | null {
  try {
    if (id) {
      return SpreadsheetApp.openById(id);
    } else {
      return SpreadsheetApp.getActiveSpreadsheet();
    }
  } catch (error) {
    console.error('スプレッドシート取得エラー:', error);
    return null;
  }
}

/**
 * 安全なシート取得
 */
function getSheetSafely(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  sheetName: string
): GoogleAppsScript.Spreadsheet.Sheet | null {
  try {
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      console.log(`シート '${sheetName}' が存在しないため作成します`);
      sheet = spreadsheet.insertSheet(sheetName);
    }
    return sheet;
  } catch (error) {
    console.error(`シート取得エラー (${sheetName}):`, error);
    return null;
  }
}

/**
 * デバッグ用ログ出力（本番環境では無効化可能）
 */
function debugLog(message: string, data?: object): void {
  const isDebugMode = getPropertySafely('DEBUG_MODE', 'false') === 'true';
  if (isDebugMode) {
    console.log(`[DEBUG] ${message}`, data || '');
  }
}

/**
 * エラー情報を構造化して記録
 */
function logError(functionName: string, error: Error, additionalInfo?: object): void {
  const errorInfo = {
    function: functionName,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    additionalInfo: additionalInfo || null,
  };

  console.error('構造化エラーログ:', errorInfo);

  // 重要なエラーはプロパティに保存（デバッグ用）
  try {
    const errorHistory = safeJsonParse(getPropertySafely('ERROR_HISTORY', '[]'), []) as any[];
    errorHistory.unshift(errorInfo);

    // 最新10件のみ保持
    if (errorHistory.length > 10) {
      errorHistory.splice(10);
    }

    setPropertySafely('ERROR_HISTORY', safeJsonStringify(errorHistory));
  } catch (logError) {
    console.error('エラーログ保存失敗:', logError);
  }
}
