/**
 * トリガー管理関連の処理
 */

/**
 * トリガー管理クラス
 */
class TriggerManager {
  /**
   * 定期実行トリガーを設定
   */
  static setupScheduledTrigger(functionName: string, intervalHours: number = 24): void {
    try {
      // 既存のトリガーを削除
      this.deleteExistingTriggers(functionName);

      // 新しいトリガーを作成
      ScriptApp.newTrigger(functionName).timeBased().everyHours(intervalHours).create();

      console.log(`${functionName}の定期実行トリガーを設定しました（${intervalHours}時間間隔）`);
    } catch (error) {
      console.error('トリガー設定エラー:', error);
      throw error;
    }
  }

  /**
   * 日次実行トリガーを設定
   */
  static setupDailyTrigger(functionName: string, hour: number = 9): void {
    try {
      // 既存のトリガーを削除
      this.deleteExistingTriggers(functionName);

      // 新しいトリガーを作成
      ScriptApp.newTrigger(functionName).timeBased().everyDays(1).atHour(hour).create();

      console.log(`${functionName}の日次実行トリガーを設定しました（毎日${hour}時）`);
    } catch (error) {
      console.error('日次トリガー設定エラー:', error);
      throw error;
    }
  }

  /**
   * 週次実行トリガーを設定
   */
  static setupWeeklyTrigger(functionName: string, dayOfWeek: any, hour: number = 9): void {
    try {
      // 既存のトリガーを削除
      this.deleteExistingTriggers(functionName);

      // 新しいトリガーを作成
      ScriptApp.newTrigger(functionName).timeBased().onWeekDay(dayOfWeek).atHour(hour).create();

      console.log(`${functionName}の週次実行トリガーを設定しました`);
    } catch (error) {
      console.error('週次トリガー設定エラー:', error);
      throw error;
    }
  }

  /**
   * スプレッドシート変更トリガーを設定
   * 注意: GASでは onEdit は自動的に呼び出される特別な関数名です
   * プログラム的にトリガーを作成する代わりに、時間ベースのトリガーを使用
   */
  static setupSpreadsheetTrigger(functionName: string, spreadsheetId?: string): void {
    try {
      // 既存のトリガーを削除
      this.deleteExistingTriggers(functionName);

      // GASでは onEdit は特別な関数名で、スプレッドシートが編集されると自動的に呼び出される
      // プログラム的にトリガーを作成する必要はない
      // 代わりに、定期的にデータをチェックする時間ベースのトリガーを作成
      const createdTrigger = ScriptApp.newTrigger(functionName)
        .timeBased()
        .everyMinutes(5) // 5分ごとに実行
        .create();

      console.log(`トリガー作成完了: ${createdTrigger.getUniqueId()}`);
      console.log(`${functionName}の定期実行トリガー（5分間隔）を設定しました`);

      if (spreadsheetId) {
        console.log(`対象スプレッドシートID: ${spreadsheetId}`);
      }
    } catch (error) {
      console.error('スプレッドシートトリガー設定エラー:', error);
      throw error;
    }
  }

  /**
   * 既存のトリガーを削除
   */
  static deleteExistingTriggers(functionName: string): void {
    try {
      const triggers = ScriptApp.getProjectTriggers();

      triggers.forEach(trigger => {
        if (trigger.getHandlerFunction() === functionName) {
          ScriptApp.deleteTrigger(trigger);
          console.log(`既存のトリガーを削除しました: ${functionName}`);
        }
      });
    } catch (error) {
      console.error('トリガー削除エラー:', error);
      throw error;
    }
  }

  /**
   * 全てのトリガーを削除
   */
  static deleteAllTriggers(): void {
    try {
      const triggers = ScriptApp.getProjectTriggers();

      triggers.forEach(trigger => {
        ScriptApp.deleteTrigger(trigger);
      });

      console.log(`全てのトリガーを削除しました（${triggers.length}個）`);
    } catch (error) {
      console.error('全トリガー削除エラー:', error);
      throw error;
    }
  }

  /**
   * 現在のトリガー一覧を取得
   */
  static listCurrentTriggers(): object[] {
    try {
      const triggers = ScriptApp.getProjectTriggers();

      const triggerList = triggers.map(trigger => {
        return {
          handlerFunction: trigger.getHandlerFunction(),
          triggerSource: trigger.getTriggerSource().toString(),
          eventType: trigger.getEventType().toString(),
          uniqueId: trigger.getUniqueId(),
        };
      });

      console.log('現在のトリガー一覧:', triggerList);
      return triggerList;
    } catch (error) {
      console.error('トリガー一覧取得エラー:', error);
      throw error;
    }
  }

  /**
   * 分析実行用のトリガーを初期設定
   */
  static initializeAnalysisTriggers(): void {
    try {
      // 日次分析トリガー（毎日朝9時）
      this.setupDailyTrigger('runDailyAnalysis', 9);

      // 週次レポートトリガー（毎週月曜日朝10時）
      this.setupWeeklyTrigger('generateWeeklyReport', ScriptApp.WeekDay.MONDAY, 10);

      console.log('分析用トリガーの初期設定が完了しました');
    } catch (error) {
      console.error('分析トリガー初期設定エラー:', error);
      throw error;
    }
  }
}

/**
 * 日次分析実行関数
 */
function runDailyAnalysis(): void {
  try {
    console.log('日次分析を開始します');
    main();
    console.log('日次分析が完了しました');
  } catch (error) {
    console.error('日次分析エラー:', error);
    // エラー通知を送信（必要に応じて実装）
  }
}

/**
 * 週次レポート生成関数
 */
function generateWeeklyReport(): void {
  try {
    console.log('週次レポート生成を開始します');

    // 週次レポート用の特別な分析を実行
    // TODO: 週次レポート専用の処理を実装

    console.log('週次レポート生成が完了しました');
  } catch (error) {
    console.error('週次レポート生成エラー:', error);
    // エラー通知を送信（必要に応じて実装）
  }
}
