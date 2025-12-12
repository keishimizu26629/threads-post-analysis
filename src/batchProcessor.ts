/**
 * バッチ処理クラス
 * 1時間ごとに実行され、投稿データを取得・更新する
 */

/**
 * 時間区分を判定
 * @param hoursSincePost 投稿からの経過時間（時間単位）
 * @returns time_category (0, 1, 12, 24, 72)
 */
function determineTimeCategory(hoursSincePost: number): number {
  // 1時間後: 1-2時間の範囲
  if (hoursSincePost >= 1 && hoursSincePost < 2) {
    return 1;
  }
  // 12時間後: 12-13時間の範囲
  else if (hoursSincePost >= 12 && hoursSincePost < 13) {
    return 12;
  }
  // 24時間後: 24-25時間の範囲
  else if (hoursSincePost >= 24 && hoursSincePost < 25) {
    return 24;
  }
  // 72時間後: 72-73時間の範囲
  else if (hoursSincePost >= 72 && hoursSincePost < 73) {
    return 72;
  }
  // それ以外: 0（最新データ、常に更新）
  else {
    return 0;
  }
}

/**
 * 1時間ごとのメトリクス収集バッチ
 * 過去7日間の投稿を対象に、時間区分に応じてデータを取得・更新
 */
function fetchMetricsHourly(): { success: boolean; message: string; details?: object } {
  try {
    console.log('=== fetchMetricsHourly: 開始 ===');
    const startTime = new Date();

    // 設定取得
    const apiKey = PropertiesService.getScriptProperties().getProperty('THREADS_API_KEY');
    if (!apiKey) {
      return { success: false, message: 'Threads APIキーが設定されていません' };
    }

    const spreadsheetManager = new SpreadsheetManager();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    // 投稿一覧を取得
    console.log('投稿一覧取得開始...');
    const postsResult = fetchUserPostsWithRetry(apiKey, 100);
    
    if (!postsResult.success) {
      return { 
        success: false, 
        message: `投稿一覧取得失敗: ${postsResult.message}` 
      };
    }

    const posts = postsResult.data as any[];
    console.log(`取得した投稿数: ${posts.length}件`);

    let processedCount = 0;
    let updatedCount = 0;
    let newRecordCount = 0;
    let errorCount = 0;

    // 各投稿を処理
    for (const post of posts) {
      try {
        const postedAt = new Date(post.timestamp);
        
        // 7日以内の投稿のみ処理
        if (postedAt < sevenDaysAgo) {
          console.log(`投稿${post.id}: 7日以上前のため スキップ`);
          continue;
        }

        // 投稿からの経過時間を計算（時間単位）
        const hoursSincePost = (now.getTime() - postedAt.getTime()) / (1000 * 60 * 60);
        
        // 時間区分を判定
        const timeCategory = determineTimeCategory(hoursSincePost);
        
        console.log(`投稿${post.id}: 経過時間=${hoursSincePost.toFixed(2)}h, time_category=${timeCategory}`);

        // time_category=0の場合、既存レコードがあればスキップ（無駄なAPI呼び出しを避ける）
        // ただし、0以外（1, 12, 24, 72）の場合は、該当する時間区分のレコードがなければ作成
        const existingRow = spreadsheetManager.findPostRecord(post.id, timeCategory);
        
        if (timeCategory !== 0 && existingRow !== null) {
          // time_category=1,12,24,72の確定値は既に存在する場合はスキップ
          console.log(`投稿${post.id}: time_category=${timeCategory}のレコードは既に存在するためスキップ`);
          continue;
        }

        // インサイトデータを取得
        console.log(`投稿${post.id}: インサイト取得開始...`);
        const insightsResult = fetchPostInsightsWithRetry(apiKey, post.id);
        
        if (!insightsResult.success) {
          console.warn(`投稿${post.id}: インサイト取得失敗 - ${insightsResult.message}`);
          errorCount++;
          continue;
        }

        const insights = insightsResult.data as any[];
        const metrics = convertInsightsToMetrics(insights);

        // データを保存
        const upsertSuccess = spreadsheetManager.upsertPostData({
          postId: post.id,
          content: post.text || '',
          postedAt: postedAt,
          capturedAt: now,
          likes: metrics.likes,
          impressions: metrics.views,
          timeCategory: timeCategory,
          replies: metrics.replies,
          reposts: metrics.reposts,
          quotes: metrics.quotes
        });

        if (upsertSuccess) {
          if (existingRow === null) {
            newRecordCount++;
          } else {
            updatedCount++;
          }
          processedCount++;
        } else {
          errorCount++;
        }

        // レート制限対策: 18秒待機（200リクエスト/時間 = 3600秒/200 = 18秒）
        Utilities.sleep(18000);

      } catch (error) {
        console.error(`投稿${post.id}の処理エラー:`, error);
        errorCount++;
      }
    }

    const endTime = new Date();
    const executionTime = (endTime.getTime() - startTime.getTime()) / 1000;

    const result = {
      success: true,
      message: `メトリクス収集完了: 処理=${processedCount}件, 新規=${newRecordCount}件, 更新=${updatedCount}件, エラー=${errorCount}件`,
      details: {
        totalPosts: posts.length,
        processedCount: processedCount,
        newRecordCount: newRecordCount,
        updatedCount: updatedCount,
        errorCount: errorCount,
        executionTime: executionTime
      }
    };

    console.log('=== fetchMetricsHourly: 完了 ===');
    console.log(JSON.stringify(result, null, 2));

    return result;

  } catch (error) {
    console.error('fetchMetricsHourly: 致命的エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
      success: false, 
      message: `メトリクス収集エラー: ${errorMessage}` 
    };
  }
}

/**
 * 古いデータを削除（7日以上前の投稿）
 */
function deleteOldPosts(): { success: boolean; message: string; deletedCount?: number } {
  try {
    const spreadsheetManager = new SpreadsheetManager();
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    
    if (!spreadsheetId) {
      return { success: false, message: 'スプレッドシートIDが設定されていません' };
    }

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName('posts');
    
    if (!sheet) {
      return { success: false, message: 'postsシートが見つかりません' };
    }

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return { success: true, message: 'データが存在しません', deletedCount: 0 };
    }

    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    // データ範囲を取得（posted_atは C列）
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 3); // A-C列
    const values = dataRange.getValues();

    let deletedCount = 0;

    // 削除対象行を逆順で削除（行番号がずれないように）
    for (let i = values.length - 1; i >= 0; i--) {
      const postedAt = new Date(values[i][2]); // C列: posted_at
      
      if (postedAt < cutoffDate) {
        sheet.deleteRow(i + 2); // 実際の行番号（ヘッダー行を考慮）
        deletedCount++;
      }
    }

    console.log(`古いデータ削除完了: ${deletedCount}件`);
    return { 
      success: true, 
      message: `${deletedCount}件の古いデータを削除しました`, 
      deletedCount: deletedCount 
    };

  } catch (error) {
    console.error('古いデータ削除エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `削除エラー: ${errorMessage}` };
  }
}
