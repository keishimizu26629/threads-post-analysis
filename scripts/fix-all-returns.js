/**
 * dist/Code.jsの全てのreturnオブジェクトを修正
 */

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '../dist/Code.js');
const srcPath = path.join(__dirname, '../src/Code.ts');

console.log('🔧 returnオブジェクト修正を開始...');

// ソースファイルとdistファイルを読み込み
let srcContent = fs.readFileSync(srcPath, 'utf8');
let distContent = fs.readFileSync(distPath, 'utf8');

// 型注釈を削除してマッチング用の関数シグネチャを生成
function stripTypes(content) {
  let stripped = content;
  // 戻り値の型を削除
  stripped = stripped.replace(/\)\s*:\s*\{[^}]+\}/g, ')');
  stripped = stripped.replace(/\)\s*:\s*[A-Za-z_][A-Za-z0-9_.<>[\]|&\s]*(\{|=>)/g, ') $1');
  return stripped;
}

// 空のreturnオブジェクトの後の内容をソースから取得して置換
const emptyReturns = [
  // testSpreadsheetAccess
  {
    before: 'console.log(\'スプレッドシート接続成功:\', name);\n    return {',
    replacement: `console.log('スプレッドシート接続成功:', name);
    return {
      success: true,
      data: {
        name: name,
        id: spreadsheetId,
        url: spreadsheet.getUrl(),
      },
    };`
  },
  // testThreadsApiConnection
  {
    before: 'return {\n\n  } catch (error) {\n    console.error(\'API接続テストエラー:\', error);',
    replacement: `return {
      success: true,
      data: {
        user: userInfo.data,
        posts: posts.data,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('API接続テストエラー:', error);`
  },
  // fetchAndUpdateTableData
  {
    before: 'return {\n\n  } catch (error) {\n    console.error(\'テーブルデータ更新エラー:\', error);',
    replacement: `return {
      success: true,
      data: {
        posts: processedPosts,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('テーブルデータ更新エラー:', error);`
  },
  // getPostData - このパターンは削除（他の修正と重複）
  // getTimeSeriesData
  {
    before: 'const data = dataManager.getTimeSeriesDataFromSpreadsheet(postDate, hours);\n\n    return {',
    replacement: `const data = dataManager.getTimeSeriesDataFromSpreadsheet(postDate, hours);

    return {
      success: true,
      data: data,
      message: \`\${data.length}件のデータを取得しました\`,
    };`
  },
  // getSpreadsheetStatistics
  {
    before: 'const stats = dataManager.getSpreadsheetStatistics();\n\n    return {',
    replacement: `const stats = dataManager.getSpreadsheetStatistics();

    return {
      success: true,
      data: stats,
      message: '統計情報を取得しました',
    };`
  },
  // fetchAndSaveToSpreadsheet
  {
    before: 'const saveResult = batchSaveDataToSpreadsheet(processedPosts);\n\n    return {',
    replacement: `const saveResult = batchSaveDataToSpreadsheet(processedPosts);

    return {
      success: saveResult.success,
      message: saveResult.message,
      data: {
        postsProcessed: processedPosts.length,
        timestamp: new Date().toISOString(),
      },
    };`
  },
  // getSystemStatus
  {
    before: 'const hasSpreadsheetId = getSpreadsheetId() !== null && getSpreadsheetId() !== \'\';\n\n    return {',
    replacement: `const hasSpreadsheetId = getSpreadsheetId() !== null && getSpreadsheetId() !== '';

    return {
      success: true,
      data: {
        apiKeyConfigured: hasApiKey,
        spreadsheetConfigured: hasSpreadsheetId,
        systemReady: hasApiKey && hasSpreadsheetId
      }
    };`
  },
  // getBatchTriggerStatus
  {
    before: 'const batchTriggers = triggers.filter(\n      trigger => trigger.getHandlerFunction() === \'hourlyBatchDataCollection\'\n    );\n\n    return {',
    replacement: `const batchTriggers = triggers.filter(
      trigger => trigger.getHandlerFunction() === 'hourlyBatchDataCollection'
    );

    return {
      success: true,
      data: {
        isActive: batchTriggers.length > 0,
        triggerCount: batchTriggers.length
      }
    };`
  },
  // removeBatchTrigger
  {
    before: 'removedCount++;\n      }\n    });\n\n    return {',
    replacement: `removedCount++;
      }
    });

    return {
      success: true,
      message: \`バッチトリガーを削除しました (\${removedCount}個のトリガーを削除)\`
    };`
  },
  // fetchAndUpdateTableData processedPost
  {
    before: '        // データ変換\n        const processedPost = {\n\n        // エラーが発生した投稿もデフォルト値で追加',
    replacement: `        // データ変換
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
        console.error(\`投稿 \${post.id} のインサイト取得エラー:\`, error);
        // エラーが発生した投稿もデフォルト値で追加`
  }
];

// 各パターンを置換
emptyReturns.forEach((pattern, index) => {
  const count = (distContent.match(new RegExp(pattern.before.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  distContent = distContent.replace(pattern.before, pattern.replacement);
  console.log(`  ${index + 1}. パターン置換: ${count}箇所`);
});

// 残りの { success, ... } パターンを修正
distContent = distContent.replace(/\{ success, data: data \}/g, '{ success: true, data: data }');
distContent = distContent.replace(/\{ success: true, data \}/g, '{ success: true, data: result }');

// processedPostオブジェクトの修正（全ての空のオブジェクトを修正）
const processedPostPattern = /const processedPost = \{\s*\n\s*\/\/ エラーが発生した投稿もデフォルト値で追加/g;
const processedPostReplacement = `const processedPost = {
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
        console.error(\`投稿 \${post.id} のインサイト取得エラー:\`, error);
        // エラーが発生した投稿もデフォルト値で追加`;

distContent = distContent.replace(processedPostPattern, processedPostReplacement);

// insights: { で始まる不完全なオブジェクトを修正
distContent = distContent.replace(
  /insights: \{\s*likes: 0,/g,
  `insights: {
            views: 0,
            likes: 0,`
);

// 壊れたcatchブロック内のpush修正
const brokenPushPattern = /id,\s*text,\s*timestamp,\s*mediaType,\s*insights,\s*likes,\s*replies,\s*reposts,\s*quotes,\s*totalEngagement,\s*engagementRate,\s*\},/g;
const fixedPush = `id: post.id,
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
          },`;

distContent = distContent.replace(brokenPushPattern, fixedPush);

fs.writeFileSync(distPath, distContent);

console.log('✅ returnオブジェクト修正完了');
