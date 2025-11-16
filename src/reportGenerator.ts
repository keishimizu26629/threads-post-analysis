/**
 * レポート生成関連の処理
 */

/**
 * レポート生成クラス
 */
class ReportGenerator {
  private sheetManager: SheetManager;

  constructor(sheetManager: SheetManager) {
    this.sheetManager = sheetManager;
  }

  /**
   * 総合レポートを生成
   */
  generateComprehensiveReport(analysisResult: any): void {
    try {
      console.log('総合レポートの生成を開始します');

      // レポートシートを作成
      const reportSheet = this.createReportSheet();

      // レポート内容を生成
      this.generateReportContent(reportSheet, analysisResult);

      // チャートを作成
      this.createCharts(reportSheet, analysisResult);

      console.log('総合レポートの生成が完了しました');
    } catch (error) {
      console.error('レポート生成エラー:', error);
      throw error;
    }
  }

  /**
   * レポートシートを作成
   */
  private createReportSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // 既存のレポートシートを削除
    const existingSheet = spreadsheet.getSheetByName('分析レポート');
    if (existingSheet) {
      spreadsheet.deleteSheet(existingSheet);
    }

    // 新しいレポートシートを作成
    const reportSheet = spreadsheet.insertSheet('分析レポート');

    return reportSheet;
  }

  /**
   * レポート内容を生成
   */
  private generateReportContent(sheet: GoogleAppsScript.Spreadsheet.Sheet, analysisResult: any): void {
    const currentDate = new Date();
    const reportData = [
      ['Threads投稿分析レポート', '', '', ''],
      [`生成日時: ${Utilities.formatDate(currentDate, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss')}`, '', '', ''],
      ['', '', '', ''],
      ['■ 基本統計', '', '', ''],
      ['総投稿数', analysisResult.totalPosts, '', ''],
      ['テキスト投稿', analysisResult.postsByType.text, '', ''],
      ['画像投稿', analysisResult.postsByType.image, '', ''],
      ['動画投稿', analysisResult.postsByType.video, '', ''],
      ['カルーセル投稿', analysisResult.postsByType.carousel, '', ''],
      ['', '', '', ''],
      ['■ エンゲージメント統計', '', '', ''],
      ['総いいね数', analysisResult.engagementStats.totalLikes, '', ''],
      ['総返信数', analysisResult.engagementStats.totalReplies, '', ''],
      ['平均いいね数', analysisResult.engagementStats.averageLikes, '', ''],
      ['平均返信数', analysisResult.engagementStats.averageReplies, '', ''],
      ['最大いいね数', analysisResult.engagementStats.maxLikes, '', ''],
      ['最大返信数', analysisResult.engagementStats.maxReplies, '', ''],
      ['', '', '', ''],
      ['■ コンテンツ分析', '', '', ''],
      ['平均テキスト長', analysisResult.contentAnalysis.averageTextLength, '文字', ''],
      ['ハッシュタグ総数', analysisResult.contentAnalysis.hashtagCount, '', ''],
      ['メンション総数', analysisResult.contentAnalysis.mentionCount, '', ''],
      ['URL総数', analysisResult.contentAnalysis.urlCount, '', ''],
      ['', '', '', ''],
      ['■ 投稿時間分析', '', '', ''],
      ['最も投稿の多い時間帯', this.getMostActiveHour(analysisResult.timeAnalysis.hourlyDistribution), '', ''],
      ['最も投稿の多い曜日', this.getMostActiveDay(analysisResult.timeAnalysis.dailyDistribution), '', '']
    ];

    // データをシートに書き込み
    sheet.getRange(1, 1, reportData.length, 4).setValues(reportData);

    // フォーマットを適用
    this.formatReportSheet(sheet);
  }

  /**
   * 最もアクティブな時間帯を取得
   */
  private getMostActiveHour(hourlyDistribution: number[]): string {
    let maxCount = 0;
    let maxHour = 0;

    hourlyDistribution.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count;
        maxHour = hour;
      }
    });

    return `${maxHour}:00-${maxHour + 1}:00 (${maxCount}投稿)`;
  }

  /**
   * 最もアクティブな曜日を取得
   */
  private getMostActiveDay(dailyDistribution: any): string {
    let maxCount = 0;
    let maxDay = '';

    Object.entries(dailyDistribution).forEach(([day, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxDay = day;
      }
    });

    const dayNames: { [key: string]: string } = {
      'Sunday': '日曜日',
      'Monday': '月曜日',
      'Tuesday': '火曜日',
      'Wednesday': '水曜日',
      'Thursday': '木曜日',
      'Friday': '金曜日',
      'Saturday': '土曜日'
    };

    return `${dayNames[maxDay] || maxDay} (${maxCount}投稿)`;
  }

  /**
   * レポートシートをフォーマット
   */
  private formatReportSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet): void {
    // タイトル行をフォーマット
    sheet.getRange(1, 1, 1, 4).merge().setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center');
    sheet.getRange(2, 1, 1, 4).merge().setFontSize(10).setHorizontalAlignment('center');

    // セクションヘッダーをフォーマット
    const sectionRows = [4, 11, 19, 25];
    sectionRows.forEach(row => {
      sheet.getRange(row, 1, 1, 4).setFontWeight('bold').setBackground('#E8F0FE');
    });

    // 列幅を調整
    sheet.setColumnWidth(1, 200);
    sheet.setColumnWidth(2, 100);
    sheet.setColumnWidth(3, 80);
    sheet.setColumnWidth(4, 100);

    // 枠線を追加
    const lastRow = sheet.getLastRow();
    sheet.getRange(1, 1, lastRow, 4).setBorder(true, true, true, true, true, true);
  }

  /**
   * チャートを作成
   */
  private createCharts(sheet: GoogleAppsScript.Spreadsheet.Sheet, analysisResult: any): void {
    try {
      // 投稿タイプ別の円グラフを作成
      this.createPostTypeChart(sheet, analysisResult.postsByType);

      // 時間別投稿数の棒グラフを作成
      this.createHourlyChart(sheet, analysisResult.timeAnalysis.hourlyDistribution);

      // 曜日別投稿数の棒グラフを作成
      this.createDailyChart(sheet, analysisResult.timeAnalysis.dailyDistribution);

    } catch (error) {
      console.error('チャート作成エラー:', error);
      // チャート作成エラーは致命的ではないので、ログのみ出力
    }
  }

  /**
   * 投稿タイプ別円グラフを作成
   */
  private createPostTypeChart(sheet: GoogleAppsScript.Spreadsheet.Sheet, postsByType: any): void {
    // チャート用データを準備
    const chartData = [
      ['投稿タイプ', '投稿数'],
      ['テキスト', postsByType.text],
      ['画像', postsByType.image],
      ['動画', postsByType.video],
      ['カルーセル', postsByType.carousel]
    ];

    // データを別の場所に配置
    const startRow = 30;
    sheet.getRange(startRow, 1, chartData.length, 2).setValues(chartData);

    // 円グラフを作成
    const chart = sheet.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(sheet.getRange(startRow, 1, chartData.length, 2))
      .setPosition(startRow + chartData.length + 2, 1, 0, 0)
      .setOption('title', '投稿タイプ別分布')
      .setOption('width', 400)
      .setOption('height', 300)
      .build();

    sheet.insertChart(chart);
  }

  /**
   * 時間別棒グラフを作成
   */
  private createHourlyChart(sheet: GoogleAppsScript.Spreadsheet.Sheet, hourlyDistribution: number[]): void {
    // チャート用データを準備
    const chartData = [['時間', '投稿数']];
    hourlyDistribution.forEach((count, hour) => {
      chartData.push([`${hour}:00`, count]);
    });

    // データを配置
    const startRow = 45;
    sheet.getRange(startRow, 1, chartData.length, 2).setValues(chartData);

    // 棒グラフを作成
    const chart = sheet.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(sheet.getRange(startRow, 1, chartData.length, 2))
      .setPosition(startRow + chartData.length + 2, 1, 0, 0)
      .setOption('title', '時間別投稿数')
      .setOption('width', 600)
      .setOption('height', 300)
      .build();

    sheet.insertChart(chart);
  }

  /**
   * 曜日別棒グラフを作成
   */
  private createDailyChart(sheet: GoogleAppsScript.Spreadsheet.Sheet, dailyDistribution: any): void {
    // チャート用データを準備
    const dayNames: { [key: string]: string } = {
      'Sunday': '日',
      'Monday': '月',
      'Tuesday': '火',
      'Wednesday': '水',
      'Thursday': '木',
      'Friday': '金',
      'Saturday': '土'
    };

    const chartData = [['曜日', '投稿数']];
    Object.entries(dailyDistribution).forEach(([day, count]) => {
      chartData.push([dayNames[day] || day, count]);
    });

    // データを配置
    const startRow = 75;
    sheet.getRange(startRow, 1, chartData.length, 2).setValues(chartData);

    // 棒グラフを作成
    const chart = sheet.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(sheet.getRange(startRow, 1, chartData.length, 2))
      .setPosition(startRow + chartData.length + 2, 1, 0, 0)
      .setOption('title', '曜日別投稿数')
      .setOption('width', 500)
      .setOption('height', 300)
      .build();

    sheet.insertChart(chart);
  }

  /**
   * PDFレポートを生成（オプション機能）
   */
  generatePdfReport(analysisResult: any): void {
    try {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      const reportSheet = spreadsheet.getSheetByName('分析レポート');

      if (!reportSheet) {
        throw new Error('レポートシートが見つかりません');
      }

      // PDFとしてエクスポート
      const blob = spreadsheet.getAs('application/pdf');
      const currentDate = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd');
      const fileName = `Threads分析レポート_${currentDate}.pdf`;

      // Google Driveに保存
      DriveApp.createFile(blob.setName(fileName));

      console.log(`PDFレポートを生成しました: ${fileName}`);
    } catch (error) {
      console.error('PDFレポート生成エラー:', error);
      throw error;
    }
  }
}
