# Threads投稿分析ツール

Google Apps ScriptでWebアプリケーションとして動作するThreads（Meta）投稿分析ツールです。
スプレッドシート風のUIでThreadsの投稿データを分析・可視化します。

## 🚀 セットアップ

### 1. 前提条件
- Node.js 22.0.0以上
- Googleアカウント
- Google Apps Script APIが有効になっていること

### 2. 環境構築

```bash
# リポジトリをクローン
git clone <repository-url>
cd threads_post_analysis

# 依存関係をインストール（npmが使用できない場合は手動で設定）
# npm install

# claspでGoogleアカウントにログイン
clasp login

# Google Apps Script APIを有効にする
# https://script.google.com/home/usersettings にアクセスして有効化
```

### 3. プロジェクトの作成

```bash
# 新しいGASプロジェクトを作成
npm run create

# または手動で作成
clasp create --title "Threads投稿分析ツール" --type standalone
```

### 4. コードのデプロイ

```bash
# TypeScriptをビルドしてGASにプッシュ
npm run push

# または個別に実行
npm run build
clasp push
```

## 📁 プロジェクト構造

```
threads_post_analysis/
├── src/                    # TypeScriptソースファイル
│   ├── Code.ts            # メインファイル
│   ├── threadsApi.ts      # Threads API関連
│   ├── dataProcessor.ts   # データ処理・分析
│   ├── sheetManager.ts    # Google Sheets操作
│   ├── triggerManager.ts  # トリガー管理
│   └── reportGenerator.ts # レポート生成
├── dist/                  # コンパイル後のJavaScriptファイル
├── appsscript.json       # GAS設定ファイル
├── .claspignore          # clasp除外設定
├── .clasp.json           # clasp設定（自動生成）
├── tsconfig.json         # TypeScript設定
├── package.json          # npm設定
├── build.js              # ビルドスクリプト
└── README.md             # このファイル
```

## 🔧 使用方法

### 1. Webアプリのデプロイ
1. GASエディタで「デプロイ」→「新しいデプロイ」を選択
2. 種類を「ウェブアプリ」に設定
3. 実行ユーザーを「自分」、アクセスできるユーザーを「全員」に設定
4. デプロイしてWebアプリのURLを取得

### 2. 設定と分析の実行
1. WebアプリのURLにアクセス
2. 「設定」タブでThreads APIのアクセストークンとユーザーIDを入力
3. 「ダッシュボード」タブで「分析を実行」ボタンをクリック
4. 「データ」タブで分析結果を確認

### 3. 自動実行の設定
```javascript
// 日次分析トリガーを設定
TriggerManager.setupDailyTrigger('runDailyAnalysis', 9);

// 週次レポートトリガーを設定
TriggerManager.setupWeeklyTrigger('generateWeeklyReport', ScriptApp.WeekDay.MONDAY, 10);
```

## 📊 Webアプリの機能

- **ダッシュボード**: 現在のフォロワー数表示、分析実行ボタン
- **データ（メイン）**: スプレッドシート風のテーブルで投稿データを表示
  - 投稿文、文字数、タイプ
  - 12時間後のエンゲージメントデータ（無料版）
  - 24時間後、72時間後、7日後のデータ（プレミアム版）
  - 平均値を超えた数値の自動ハイライト
- **月次レポート**: 月間サマリー、人気投稿ランキング（プレミアム版）
- **設定**: API設定、ハイライト設定

## 🛠️ 開発コマンド

```bash
# TypeScriptをビルド
npm run build

# GASにプッシュ
npm run push

# GASから最新版をプル
npm run pull

# GASエディタを開く
npm run open

# デプロイメントを作成
npm run deploy
```

## 📝 開発ルール

- ES6構文を使用
- 関数名はキャメルケース
- 定数はUPPER_SNAKE_CASE
- コメントは日本語で記述
- try-catch文を必ず使用
- エラー時はconsole.logでログ出力

## 🔐 セキュリティ

- API キーはPropertiesServiceで管理
- 平文での保存は禁止
- ユーザーが設定シートから入力可能

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

1. フォークしてください
2. フィーチャーブランチを作成してください (`git checkout -b feature/AmazingFeature`)
3. 変更をコミットしてください (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュしてください (`git push origin feature/AmazingFeature`)
5. プルリクエストを開いてください

## 📞 サポート

問題や質問がある場合は、Issueを作成してください。
