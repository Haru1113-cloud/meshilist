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

## 2026-03-17 やったこと ✅

### ドメイン反映
- お名前.comのネームサーバーを `01.dnsv.jp` ～ `04.dnsv.jp` に変更 → DNS反映完了
- Vercel Valid Configuration 確認済み

### 本番課金テスト
- `NEXT_PUBLIC_BASE_URL` を `https://meshilist.com` に更新 → Redeploy
- Stripe Price IDを正しいアカウントのものに修正
- 実カードで課金テスト成功 ✅
- Webhook動作・プラン反映確認済み ✅

---

## まだやること 📋

### 🟡 優先度中
- [ ] Stripe WebhookのURLを `https://meshilist.com/api/webhook` に更新（任意）
- [ ] `/recipes` ページ実装

### 🟢 優先度低
- [ ] エラーログ整備（Sentry等）
