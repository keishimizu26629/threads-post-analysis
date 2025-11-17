# セキュリティ仕様書

## APIキーの保存場所と安全性

### 🔒 保存場所

APIキーは **Google Apps Script の PropertiesService** に保存されます。

```javascript
// 保存
PropertiesService.getScriptProperties().setProperty('THREADS_API_KEY', apiKey);

// 取得
PropertiesService.getScriptProperties().getProperty('THREADS_API_KEY');
```

### 🛡️ PropertiesService のセキュリティ特性

#### **1. サーバーサイド保存**
- APIキーはGoogleのサーバー上に保存される
- クライアント（ブラウザ）からは直接アクセス不可
- HTMLソースコードに露出しない

#### **2. アクセス制御**
- **スクリプト所有者のみ**がアクセス可能
- 他のユーザーはAPIキーを読み取れない
- GASプロジェクトの実行権限が必要

#### **3. 暗号化**
- Googleが管理する暗号化システムで保護
- 転送時・保存時ともに暗号化
- Google Cloud Platform のセキュリティ基準に準拠

#### **4. 永続化**
- スクリプトが削除されるまで永続的に保存
- 手動削除またはスクリプト削除時のみ消去

### 🔐 セキュリティレベル

| 項目 | 評価 | 詳細 |
|------|------|------|
| **暗号化** | ✅ 高 | Google管理の暗号化 |
| **アクセス制御** | ✅ 高 | 所有者のみアクセス可能 |
| **監査ログ** | ⚠️ 中 | GAS実行ログで追跡可能 |
| **データ所在地** | ✅ 高 | Google Cloud インフラ |
| **バックアップ** | ✅ 高 | Google側で自動バックアップ |

### 🚨 セキュリティリスクと対策

#### **潜在的リスク**

1. **GASプロジェクトの共有**
   - リスク: プロジェクトを他者と共有するとAPIキーが露出
   - 対策: プロジェクトは個人使用のみに限定

2. **ログ出力**
   - リスク: デバッグログにAPIキーが出力される可能性
   - 対策: APIキーをログに出力しない実装

3. **スクリプト権限の悪用**
   - リスク: 悪意のあるコードがAPIキーを外部送信
   - 対策: コードレビューと信頼できるソースのみ使用

#### **実装されている対策**

1. **APIキーのマスキング**
```javascript
// ログ出力時はマスキング
console.log('APIキー設定: ' + apiKey.substring(0, 8) + '...');
```

2. **エラーハンドリング**
```javascript
// エラー時もAPIキーを露出しない
catch (error) {
  console.error('API呼び出しエラー（APIキー非表示）:', error.message);
}
```

3. **最小権限の原則**
```javascript
// 必要最小限のスコープのみ要求
"oauthScopes": [
  "https://www.googleapis.com/auth/script.external_request",
  "https://www.googleapis.com/auth/script.storage"
]
```

### 🔄 APIキーのライフサイクル管理

#### **1. 設定**
- ユーザーがWebUI経由で入力
- 即座にPropertiesServiceに暗号化保存
- 入力フィールドはpassword型で非表示

#### **2. 使用**
- API呼び出し時のみメモリに読み込み
- 使用後は即座にメモリから削除
- ネットワーク通信はHTTPS強制

#### **3. 更新**
- 既存キーを新しいキーで上書き
- 古いキーは自動的に無効化

#### **4. 削除**
- ユーザーが明示的に削除可能
- PropertiesServiceから完全削除
- 復元不可

### 📊 他の保存方法との比較

| 保存方法 | セキュリティ | 利便性 | 推奨度 |
|----------|-------------|--------|--------|
| **PropertiesService** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ 推奨 |
| HTMLに直接記述 | ⭐ | ⭐⭐⭐⭐⭐ | ❌ 危険 |
| JavaScriptグローバル変数 | ⭐ | ⭐⭐⭐⭐ | ❌ 危険 |
| Google Drive ファイル | ⭐⭐⭐ | ⭐⭐ | ⚠️ 非推奨 |
| 外部データベース | ⭐⭐⭐⭐ | ⭐⭐ | ⚠️ 複雑 |

### 🎯 ベストプラクティス

#### **開発者向け**

1. **APIキーの取り扱い**
```javascript
// ✅ 良い例
const apiKey = getApiKey();
if (!apiKey) {
  throw new Error('APIキーが設定されていません');
}

// ❌ 悪い例
console.log('使用中のAPIキー:', apiKey); // ログに露出
```

2. **エラーハンドリング**
```javascript
// ✅ 良い例
catch (error) {
  return { success: false, message: 'API呼び出しに失敗しました' };
}

// ❌ 悪い例
catch (error) {
  return { success: false, message: error.toString() }; // APIキーが含まれる可能性
}
```

#### **ユーザー向け**

1. **APIキーの管理**
   - 定期的なキーローテーション（推奨: 3-6ヶ月）
   - 不要になったキーの即座削除
   - キー漏洩時の即座無効化

2. **アクセス制御**
   - GASプロジェクトを他者と共有しない
   - 信頼できるデバイスでのみアクセス
   - 公共Wi-Fi使用時の注意

### 🔍 監査・モニタリング

#### **ログ監視**
- GAS実行ログでAPI使用状況を確認
- 異常なアクセスパターンの検出
- エラー率の監視

#### **定期チェック項目**
- [ ] APIキーの有効性確認
- [ ] 不審なアクセスログの確認
- [ ] プロジェクト共有設定の確認
- [ ] 依存関係のセキュリティ更新

### 📞 インシデント対応

#### **APIキー漏洩時の対応手順**

1. **即座の対応（5分以内）**
   - Threads Developer Consoleでキー無効化
   - GAS内のキー削除

2. **影響調査（30分以内）**
   - アクセスログの確認
   - 不正使用の有無確認

3. **復旧作業（1時間以内）**
   - 新しいAPIキーの生成
   - システムの動作確認

4. **事後対応**
   - インシデント記録
   - 再発防止策の実装

### 🏛️ コンプライアンス

#### **準拠基準**
- Google Cloud Security Standards
- OAuth 2.0 Security Best Practices
- OWASP API Security Top 10

#### **データ保護**
- 個人情報保護法（日本）
- GDPR（EU、該当する場合）
- プライバシーポリシーの遵守

### 📚 参考資料

- [Google Apps Script PropertiesService](https://developers.google.com/apps-script/reference/properties)
- [Google Cloud Security](https://cloud.google.com/security)
- [Threads API Security](https://developers.facebook.com/docs/threads)
- [OWASP API Security](https://owasp.org/www-project-api-security/)

---

**結論**: PropertiesServiceを使用したAPIキー保存は、個人使用・小規模チーム使用において十分に安全な方法です。適切な実装とベストプラクティスの遵守により、高いセキュリティレベルを維持できます。
