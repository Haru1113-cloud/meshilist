# メシリスト 進捗メモ

## 2026-03-16 やったこと ✅

### インフラ整備
- Upstash Redis導入 — ユーザーデータをファイルDB→クラウドDBに移行（デプロイしても消えなくなった）
- レートリミット追加 — 1時間10回制限でAPI代の爆発を防止

### Stripe本番化
- Stripe本番モード切り替え（テスト→本番）
- 本番プラン作成: Light(280円) / Standard(480円) / Premium(980円)
- Webhook設定: `https://meshilist.vercel.app/api/webhook`
- Vercel環境変数更新: 本番キー・価格ID・Webhookシークレット

### ドメイン
- meshilist.com 取得
- お名前.comでDNS設定（Aレコード: 216.198.79.1 / CNAME: b575d700367a7d78.vercel-dns-017.com.）

---

## 待機中 ⏳

- [ ] Stripe本人確認（免許証）審査待ち（数時間〜1日）
- [ ] meshilist.com のDNS反映待ち（数分〜数時間）

---

## まだやること 📋

### 🔴 優先度高
- [ ] DNS反映後、VercelのDomainsで「Refresh」を押してValid Configurationになるか確認
- [ ] DNS反映後、Vercel環境変数の `NEXT_PUBLIC_BASE_URL` を `https://meshilist.com` に変更してredeploy
- [ ] Stripe本人確認承認後、実際に課金テストを実施（本番カードで）

### 🟡 優先度中
- [ ] Stripe WebhookのURLを `https://meshilist.com/api/webhook` に更新（任意）
- [ ] `/recipes` ページ実装

### 🟢 優先度低
- [ ] エラーログ整備（Sentry等）
