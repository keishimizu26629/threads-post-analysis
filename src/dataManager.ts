/**
 * データ管理クラス
 * PropertiesServiceを使用してデータを永続化
 */

// GAS環境では import/export は使用できないため、型定義のみ参照

class DataManager {
  private properties: GoogleAppsScript.Properties.Properties;

  constructor() {
    this.properties = PropertiesService.getScriptProperties();
  }

  /**
   * 設定情報を保存
   */
  saveSettings(settings: object): void {
    try {
      this.properties.setProperty('SETTINGS', JSON.stringify(settings));
      console.log('設定を保存しました');
    } catch (error) {
      console.error('設定保存エラー:', error);
      throw error;
    }
  }

  /**
   * 設定情報を取得
   */
  getSettings(): object {
    try {
      const settingsJson = this.properties.getProperty('SETTINGS');
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }

      // デフォルト設定を返す
      return {
        accessToken: '',
        userId: '',
        postLimit: 25,
        analysisInterval: 12, // 時間
        highlightSettings: {
          blue: 1.5,
          yellow: 2.0,
          red: 3.0,
        },
      };
    } catch (error) {
      console.error('設定取得エラー:', error);
      throw error;
    }
  }

  /**
   * 投稿データを保存
   */
  savePostData(posts: any[]): void {
    try {
      const timestamp = new Date().getTime();
      const dataKey = `POST_DATA_${timestamp}`;

      // 最新のデータを保存
      this.properties.setProperty(
        'LATEST_POST_DATA',
        JSON.stringify({
          timestamp: timestamp,
          posts: posts,
        })
      );

      // 履歴として保存（最大10件）
      this.saveToHistory('POST_HISTORY', dataKey, posts);

      console.log(`投稿データを保存しました: ${posts.length}件`);
    } catch (error) {
      console.error('投稿データ保存エラー:', error);
      throw error;
    }
  }

  /**
   * 投稿データを取得
   */
  getStoredPostData(): object {
    try {
      const latestDataJson = this.properties.getProperty('LATEST_POST_DATA');
      if (latestDataJson) {
        return JSON.parse(latestDataJson);
      }

      return {
        timestamp: null,
        posts: [],
      };
    } catch (error) {
      console.error('投稿データ取得エラー:', error);
      throw error;
    }
  }

  /**
   * 分析結果を保存
   */
  saveAnalysisResult(analysisResult: object): void {
    try {
      const timestamp = new Date().getTime();
      const resultWithTimestamp = {
        timestamp: timestamp,
        result: analysisResult,
      };

      // 最新の分析結果を保存
      this.properties.setProperty('LATEST_ANALYSIS', JSON.stringify(resultWithTimestamp));

      // 履歴として保存
      this.saveToHistory('ANALYSIS_HISTORY', `ANALYSIS_${timestamp}`, analysisResult);

      console.log('分析結果を保存しました');
    } catch (error) {
      console.error('分析結果保存エラー:', error);
      throw error;
    }
  }

  /**
   * 分析結果を取得
   */
  getAnalysisResult(): object {
    try {
      const latestAnalysisJson = this.properties.getProperty('LATEST_ANALYSIS');
      if (latestAnalysisJson) {
        return JSON.parse(latestAnalysisJson);
      }

      return {
        timestamp: null,
        result: null,
      };
    } catch (error) {
      console.error('分析結果取得エラー:', error);
      throw error;
    }
  }

  /**
   * 履歴データを保存（最大件数制限付き）
   */
  private saveToHistory(
    historyKey: string,
    dataKey: string,
    data: object,
    maxItems: number = 10
  ): void {
    try {
      // 現在の履歴を取得
      const historyJson = this.properties.getProperty(historyKey);
      const history: string[] = historyJson ? JSON.parse(historyJson) : [];

      // 新しいデータを追加
      history.unshift(dataKey);

      // 最大件数を超えた場合、古いデータを削除
      if (history.length > maxItems) {
        const removedKeys = history.splice(maxItems);
        removedKeys.forEach(key => {
          this.properties.deleteProperty(key);
        });
      }

      // 履歴を更新
      this.properties.setProperty(historyKey, JSON.stringify(history));

      // データを保存
      this.properties.setProperty(dataKey, JSON.stringify(data));
    } catch (error) {
      console.error('履歴保存エラー:', error);
      throw error;
    }
  }

  /**
   * 履歴データを取得
   */
  getHistory(historyKey: string, limit: number = 10): object[] {
    try {
      const historyJson = this.properties.getProperty(historyKey);
      if (!historyJson) {
        return [];
      }

      const history: string[] = JSON.parse(historyJson);
      const results: object[] = [];

      for (let i = 0; i < Math.min(history.length, limit); i++) {
        const dataKey = history[i];
        const dataJson = this.properties.getProperty(dataKey);
        if (dataJson) {
          results.push({
            key: dataKey,
            data: JSON.parse(dataJson),
          });
        }
      }

      return results;
    } catch (error) {
      console.error('履歴取得エラー:', error);
      throw error;
    }
  }

  /**
   * 統計データを保存
   */
  saveStatistics(stats: object): void {
    try {
      const currentMonth = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM');
      const statsKey = `STATS_${currentMonth}`;

      this.properties.setProperty(statsKey, JSON.stringify(stats));
      console.log(`統計データを保存しました: ${currentMonth}`);
    } catch (error) {
      console.error('統計データ保存エラー:', error);
      throw error;
    }
  }

  /**
   * 統計データを取得
   */
  getStatistics(month?: string): object {
    try {
      const targetMonth = month || Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM');
      const statsKey = `STATS_${targetMonth}`;

      const statsJson = this.properties.getProperty(statsKey);
      if (statsJson) {
        return JSON.parse(statsJson);
      }

      return {};
    } catch (error) {
      console.error('統計データ取得エラー:', error);
      throw error;
    }
  }

  /**
   * データをクリア（開発・テスト用）
   */
  clearAllData(): void {
    try {
      const properties = this.properties.getProperties();
      Object.keys(properties).forEach(key => {
        this.properties.deleteProperty(key);
      });
      console.log('全データをクリアしました');
    } catch (error) {
      console.error('データクリアエラー:', error);
      throw error;
    }
  }

  /**
   * データサイズを取得（デバッグ用）
   */
  getDataSize(): object {
    try {
      const properties = this.properties.getProperties();
      const sizes: { [key: string]: number } = {};
      let totalSize = 0;

      Object.entries(properties).forEach(([key, value]) => {
        const size = value ? value.length : 0;
        sizes[key] = size;
        totalSize += size;
      });

      return {
        totalSize: totalSize,
        itemCount: Object.keys(properties).length,
        details: sizes,
      };
    } catch (error) {
      console.error('データサイズ取得エラー:', error);
      throw error;
    }
  }

  /**
   * スプレッドシートにデータを保存
   */
  saveToSpreadsheet(postData: object): { success: boolean; message: string } {
    try {
      const spreadsheetManager = new SpreadsheetManager();
      const result = spreadsheetManager.appendPostData(postData);

      if (result) {
        console.log('スプレッドシートにデータを保存しました');
        return { success: true, message: 'データを保存しました' };
      } else {
        return { success: false, message: 'データの保存に失敗しました' };
      }
    } catch (error) {
      console.error('スプレッドシート保存エラー:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, message: 'スプレッドシート保存エラー: ' + errorMessage };
    }
  }

  /**
   * スプレッドシートに複数データを一括保存
   */
  batchSaveToSpreadsheet(postDataArray: object[]): {
    success: boolean;
    message: string;
    count?: number;
  } {
    try {
      const spreadsheetManager = new SpreadsheetManager();
      const result = spreadsheetManager.batchAppendPostData(postDataArray);

      if (result) {
        console.log(`${postDataArray.length}件のデータをスプレッドシートに一括保存しました`);
        return {
          success: true,
          message: `${postDataArray.length}件のデータを保存しました`,
          count: postDataArray.length,
        };
      } else {
        return { success: false, message: 'データの一括保存に失敗しました' };
      }
    } catch (error) {
      console.error('スプレッドシート一括保存エラー:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, message: 'スプレッドシート一括保存エラー: ' + errorMessage };
    }
  }

  /**
   * スプレッドシートから時系列データを取得
   */
  getTimeSeriesDataFromSpreadsheet(postDate: Date, hours: number = 12): object[] {
    try {
      const spreadsheetManager = new SpreadsheetManager();
      const data = spreadsheetManager.getRecentData(postDate, hours);

      console.log(`スプレッドシートから${data.length}件のデータを取得しました`);
      return data;
    } catch (error) {
      console.error('スプレッドシート時系列データ取得エラー:', error);
      return [];
    }
  }

  /**
   * スプレッドシートの統計情報を取得
   */
  getSpreadsheetStatistics(): object {
    try {
      const spreadsheetManager = new SpreadsheetManager();
      return spreadsheetManager.getDataStatistics();
    } catch (error) {
      console.error('スプレッドシート統計情報取得エラー:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { totalRows: 0, lastUpdate: null, error: errorMessage };
    }
  }

  /**
   * スプレッドシートアクセステスト
   */
  testSpreadsheetConnection(): { success: boolean; message: string; data?: object } {
    try {
      const spreadsheetManager = new SpreadsheetManager();
      return spreadsheetManager.validateAccess();
    } catch (error) {
      console.error('スプレッドシート接続テストエラー:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, message: 'スプレッドシート接続テストエラー: ' + errorMessage };
    }
  }
}
