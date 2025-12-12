/**
 * スプレッドシート操作管理クラス
 * Google Sheetsとの連携を担当
 */

/**
 * スプレッドシート管理クラス
 */
class SpreadsheetManager {
  private spreadsheetId: string | null;
  private spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet | null;

  constructor() {
    this.spreadsheetId = this.getSpreadsheetId();
    this.spreadsheet = null;
  }

  /**
   * スプレッドシートIDを取得
   */
  private getSpreadsheetId(): string | null {
    try {
      return PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    } catch (error) {
      console.error('スプレッドシートID取得エラー:', error);
      return null;
    }
  }

  /**
   * スプレッドシートを初期化
   */
  private initializeSpreadsheet(): boolean {
    try {
      if (!this.spreadsheetId) {
        console.error('スプレッドシートIDが設定されていません');
        return false;
      }

      this.spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);
      return true;
    } catch (error) {
      console.error('スプレッドシート初期化エラー:', error);
      return false;
    }
  }

  /**
   * データベーススキーマを初期化
   */
  initializeDatabase(): { success: boolean; message: string } {
    try {
      console.log('initializeDatabase: 開始');
      if (!this.initializeSpreadsheet()) {
        console.error('initializeDatabase: スプレッドシートの初期化に失敗');
        return { success: false, message: 'スプレッドシートの初期化に失敗しました' };
      }

      console.log('initializeDatabase: スプレッドシート初期化成功');

      // 必要なテーブル（シート）のみを作成
      // 1. posts - 投稿データ統合テーブル（投稿情報 + 時系列メトリクス）
      console.log('initializeDatabase: postsシート作成開始');
      this.createPostsTable();
      console.log('initializeDatabase: postsシート作成完了');
      
      // 2. logs - 実行ログ
      console.log('initializeDatabase: logsシート作成開始');
      this.createLogsTable();
      console.log('initializeDatabase: logsシート作成完了');

      const createdSheets = ['posts', 'logs'];
      console.log('initializeDatabase: 全てのシート作成完了');
      return { 
        success: true, 
        message: `データベース初期化が完了しました。作成されたシート: ${createdSheets.join(', ')}` 
      };
    } catch (error) {
      console.error('DB初期化エラー:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, message: 'データベース初期化エラー: ' + errorMessage };
    }
  }


  /**
   * postsテーブル（投稿データ統合テーブル）
   * 1つのテーブルで投稿情報と時系列メトリクスを管理
   * 複合キー: post_id + time_category (UNIQUE)
   */
  createPostsTable(): void {
    if (!this.initializeSpreadsheet()) {
      throw new Error('スプレッドシートの初期化に失敗しました');
    }
    const sheetName = 'posts';
    let sheet = this.spreadsheet!.getSheetByName(sheetName);

    if (!sheet) {
      sheet = this.spreadsheet!.insertSheet(sheetName);
    }

    const headers = [
      'post_id',         // A: 投稿ID（複合キーの一部）
      'content',         // B: 投稿本文
      'posted_at',       // C: 投稿日時
      'captured_at',     // D: 取得日時
      'likes',           // E: いいね数
      'impressions',     // F: インプレッション数（views）
      'time_category',   // G: 表示カテゴリ（0=最新, 1, 12, 24, 72）複合キーの一部
      'replies',         // H: リプライ数
      'reposts',         // I: 再投稿数
      'quotes',          // J: 引用数
      'engagement_rate', // K: エンゲージメント率（%）
      'created_at',      // L: レコード作成日時
      'updated_at'       // M: レコード更新日時
    ];

    this.setupTableHeaders(sheet, headers);
    
    // 複合キーの説明をメモとして追加
    sheet.getRange('A1').setNote('投稿ID（post_id + time_categoryで一意）');
    sheet.getRange('G1').setNote('0=最新データ（常に更新）, 1/12/24/72=確定値（各時間経過時点のスナップショット）');
    
    console.log('postsテーブル作成完了（1テーブル設計）');
  }

  /**
   * 既存レコードを検索（post_id + time_category）
   */
  findPostRecord(postId: string, timeCategory: number): number | null {
    try {
      if (!this.initializeSpreadsheet()) {
        return null;
      }

      const sheet = this.spreadsheet!.getSheetByName('posts');
      if (!sheet) {
        return null;
      }

      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return null;
      }

      // データ範囲を取得（ヘッダー行を除く）
      const dataRange = sheet.getRange(2, 1, lastRow - 1, 7); // A-G列（post_id～time_category）
      const values = dataRange.getValues();

      // post_id(A列) + time_category(G列)で検索
      for (let i = 0; i < values.length; i++) {
        if (values[i][0] === postId && values[i][6] === timeCategory) {
          return i + 2; // 実際の行番号（ヘッダー行を考慮）
        }
      }

      return null;
    } catch (error) {
      console.error('レコード検索エラー:', error);
      return null;
    }
  }

  /**
   * 投稿データを追加または更新
   */
  upsertPostData(postData: {
    postId: string;
    content: string;
    postedAt: Date;
    capturedAt: Date;
    likes: number;
    impressions: number;
    timeCategory: number;
    replies: number;
    reposts: number;
    quotes: number;
  }): boolean {
    try {
      if (!this.initializeSpreadsheet()) {
        console.error('スプレッドシート初期化失敗');
        return false;
      }

      const sheet = this.spreadsheet!.getSheetByName('posts');
      if (!sheet) {
        console.error('postsシートが見つかりません');
        return false;
      }

      // エンゲージメント率を計算
      const totalEngagement = postData.likes + postData.replies + postData.reposts + postData.quotes;
      const engagementRate = postData.impressions > 0 
        ? ((totalEngagement / postData.impressions) * 100).toFixed(2)
        : '0.00';

      // 既存レコードを検索
      const existingRow = this.findPostRecord(postData.postId, postData.timeCategory);
      const now = new Date();

      const rowData = [
        postData.postId,           // A: post_id
        postData.content,          // B: content
        postData.postedAt,         // C: posted_at
        postData.capturedAt,       // D: captured_at
        postData.likes,            // E: likes
        postData.impressions,      // F: impressions
        postData.timeCategory,     // G: time_category
        postData.replies,          // H: replies
        postData.reposts,          // I: reposts
        postData.quotes,           // J: quotes
        engagementRate,            // K: engagement_rate
        existingRow ? sheet.getRange(existingRow, 12).getValue() : now, // L: created_at
        now                        // M: updated_at
      ];

      if (existingRow === null) {
        // 新規レコードを追加
        sheet.appendRow(rowData);
        console.log(`新規レコード追加: post_id=${postData.postId}, time_category=${postData.timeCategory}`);
      } else {
        // 既存レコードを更新
        sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
        console.log(`既存レコード更新: post_id=${postData.postId}, time_category=${postData.timeCategory}`);
      }

      return true;
    } catch (error) {
      console.error('投稿データ追加/更新エラー:', error);
      return false;
    }
  }


  /**
   * logsテーブル（実行ログ）
   */
  createLogsTable(): void {
    if (!this.initializeSpreadsheet()) {
      throw new Error('スプレッドシートの初期化に失敗しました');
    }
    const sheetName = 'logs';
    let sheet = this.spreadsheet!.getSheetByName(sheetName);

    if (!sheet) {
      sheet = this.spreadsheet!.insertSheet(sheetName);
    }

    const headers = [
      'timestamp',       // A: ログ日時
      'log_level',       // B: ログレベル
      'process_type',    // C: 処理タイプ
      'message',         // D: メッセージ
      'details',         // E: 詳細情報
      'execution_time'   // F: 実行時間（ms）
    ];

    this.setupTableHeaders(sheet, headers);
    console.log('logsテーブル作成完了');
  }

  /**
   * テーブルヘッダーの共通設定
   */
  private setupTableHeaders(sheet: GoogleAppsScript.Spreadsheet.Sheet, headers: string[]): void {
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('white');
    headerRange.setHorizontalAlignment('center');

    // 列幅自動調整
    sheet.autoResizeColumns(1, headers.length);

    // ヘッダー行を固定
    sheet.setFrozenRows(1);
  }

  /**
   * データシートを取得または作成
   */
  private getOrCreateDataSheet(): GoogleAppsScript.Spreadsheet.Sheet | null {
    try {
      if (!this.initializeSpreadsheet() || !this.spreadsheet) {
        return null;
      }

      const sheetName = 'ThreadsData';
      let sheet = this.spreadsheet.getSheetByName(sheetName);

      if (!sheet) {
        // シートが存在しない場合は作成
        sheet = this.spreadsheet.insertSheet(sheetName);
        this.setupDataSheetHeaders(sheet);
        console.log('データシートを作成しました:', sheetName);
      }

      return sheet;
    } catch (error) {
      console.error('データシート取得/作成エラー:', error);
      return null;
    }
  }

  /**
   * データシートのヘッダーを設定
   */
  private setupDataSheetHeaders(sheet: GoogleAppsScript.Spreadsheet.Sheet): void {
    try {
      const headers = [
        'タイムスタンプ',
        '投稿ID',
        '投稿文',
        '文字数',
        'タイプ',
        '投稿日時',
        'インプレッション',
        'いいね',
        '再投稿',
        '引用',
        'リプライ',
        'エンゲージメント総数',
        'エンゲージメント率',
        'フォロワー数',
        '取得時刻'
      ];

      // ヘッダー行を設定
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setValues([headers]);

      // ヘッダーのスタイルを設定
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');

      // 列幅を自動調整
      sheet.autoResizeColumns(1, headers.length);

      console.log('データシートヘッダーを設定しました');
    } catch (error) {
      console.error('ヘッダー設定エラー:', error);
    }
  }

  /**
   * 投稿データを追加
   */
  appendPostData(postData: object): boolean {
    try {
      const sheet = this.getOrCreateDataSheet();
      if (!sheet) {
        console.error('データシートの取得に失敗しました');
        return false;
      }

      const data = postData as any;
      const timestamp = new Date();

      const rowData = [
        timestamp,                                    // タイムスタンプ
        data.id || '',                               // 投稿ID
        data.text || '',                             // 投稿文
        data.text ? data.text.length : 0,           // 文字数
        data.mediaType || data.media_type || '',    // タイプ
        data.timestamp ? new Date(data.timestamp) : '', // 投稿日時
        data.insights?.views || 0,                   // インプレッション
        data.insights?.likes || 0,                   // いいね
        data.insights?.reposts || 0,                 // 再投稿
        data.insights?.quotes || 0,                  // 引用
        data.insights?.replies || 0,                 // リプライ
        data.insights?.totalEngagement || 0,         // エンゲージメント総数
        data.insights?.engagementRate || '0.00',     // エンゲージメント率
        data.followerCount || 0,                     // フォロワー数
        timestamp                                     // 取得時刻
      ];

      // データを追加
      sheet.appendRow(rowData);
      console.log('投稿データを追加しました:', data.id);
      return true;
    } catch (error) {
      console.error('投稿データ追加エラー:', error);
      return false;
    }
  }

  /**
   * 複数の投稿データを一括追加
   */
  batchAppendPostData(postDataArray: object[]): boolean {
    try {
      const sheet = this.getOrCreateDataSheet();
      if (!sheet) {
        console.error('データシートの取得に失敗しました');
        return false;
      }

      const timestamp = new Date();
      const rowsData: any[][] = [];

      postDataArray.forEach(postData => {
        const data = postData as any;
        const rowData = [
          timestamp,                                    // タイムスタンプ
          data.id || '',                               // 投稿ID
          data.text || '',                             // 投稿文
          data.text ? data.text.length : 0,           // 文字数
          data.mediaType || data.media_type || '',    // タイプ
          data.timestamp ? new Date(data.timestamp) : '', // 投稿日時
          data.insights?.views || 0,                   // インプレッション
          data.insights?.likes || 0,                   // いいね
          data.insights?.reposts || 0,                 // 再投稿
          data.insights?.quotes || 0,                  // 引用
          data.insights?.replies || 0,                 // リプライ
          data.insights?.totalEngagement || 0,         // エンゲージメント総数
          data.insights?.engagementRate || '0.00',     // エンゲージメント率
          data.followerCount || 0,                     // フォロワー数
          timestamp                                     // 取得時刻
        ];
        rowsData.push(rowData);
      });

      if (rowsData.length > 0) {
        const startRow = sheet.getLastRow() + 1;
        const range = sheet.getRange(startRow, 1, rowsData.length, rowsData[0].length);
        range.setValues(rowsData);
        console.log(`${rowsData.length}件の投稿データを一括追加しました`);
      }

      return true;
    } catch (error) {
      console.error('一括投稿データ追加エラー:', error);
      return false;
    }
  }

  /**
   * 指定した投稿日時から指定時間以内の最新データを取得
   */
  getRecentData(postDate: Date, hours: number = 12): object[] {
    try {
      const sheet = this.getOrCreateDataSheet();
      if (!sheet) {
        console.error('データシートの取得に失敗しました');
        return [];
      }

      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        console.log('データが存在しません');
        return [];
      }

      // 全データを取得
      const dataRange = sheet.getRange(2, 1, lastRow - 1, 15); // ヘッダー行を除く
      const values = dataRange.getValues();

      // 投稿日時から指定時間以内のデータをフィルタリング
      const targetTime = new Date(postDate.getTime() + (hours * 60 * 60 * 1000));
      const filteredData: object[] = [];

      values.forEach(row => {
        const recordPostDate = new Date(row[5]); // 投稿日時カラム
        const recordTimestamp = new Date(row[0]); // タイムスタンプカラム

        // 投稿日時が一致し、取得時刻が指定時間以内のデータ
        if (recordPostDate.getTime() === postDate.getTime() &&
            recordTimestamp <= targetTime) {
          filteredData.push({
            timestamp: row[0],
            postId: row[1],
            text: row[2],
            charCount: row[3],
            type: row[4],
            postDate: row[5],
            impressions: row[6],
            likes: row[7],
            reposts: row[8],
            quotes: row[9],
            replies: row[10],
            totalEngagement: row[11],
            engagementRate: row[12],
            followerCount: row[13],
            fetchTime: row[14]
          });
        }
      });

      // 取得時刻でソート（最新が最後）
      filteredData.sort((a: any, b: any) =>
        new Date(a.fetchTime).getTime() - new Date(b.fetchTime).getTime()
      );

      console.log(`${filteredData.length}件のデータを取得しました`);
      return filteredData;
    } catch (error) {
      console.error('データ取得エラー:', error);
      return [];
    }
  }

  /**
   * スプレッドシートへのアクセス権限を検証
   */
  validateAccess(): { success: boolean; message: string; data?: object } {
    try {
      if (!this.spreadsheetId) {
        return { success: false, message: 'スプレッドシートIDが設定されていません' };
      }

      const spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);
      const name = spreadsheet.getName();
      const url = spreadsheet.getUrl();

      return {
        success: true,
        message: 'スプレッドシートへのアクセスに成功しました',
        data: {
          name: name,
          id: this.spreadsheetId,
          url: url,
          sheetCount: spreadsheet.getSheets().length
        }
      };
    } catch (error) {
      console.error('アクセス権限検証エラー:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: 'スプレッドシートへのアクセスに失敗しました: ' + errorMessage
      };
    }
  }

  /**
   * データシートの統計情報を取得
   */
  getDataStatistics(): object {
    try {
      const sheet = this.getOrCreateDataSheet();
      if (!sheet) {
        return { totalRows: 0, lastUpdate: null };
      }

      const lastRow = sheet.getLastRow();
      const totalRows = Math.max(0, lastRow - 1); // ヘッダー行を除く

      let lastUpdate = null;
      if (totalRows > 0) {
        const lastUpdateCell = sheet.getRange(lastRow, 1); // 最後の行のタイムスタンプ
        lastUpdate = lastUpdateCell.getValue();
      }

      return {
        totalRows: totalRows,
        lastUpdate: lastUpdate,
        sheetName: sheet.getName()
      };
    } catch (error) {
      console.error('統計情報取得エラー:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { totalRows: 0, lastUpdate: null, error: errorMessage };
    }
  }
}
