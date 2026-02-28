export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "48px 24px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", marginBottom: 40 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🍽️</div>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
            メシ<span style={{ color: "var(--accent)" }}>リスト</span>
          </span>
        </a>

        <div style={{ background: "#fff", borderRadius: 20, padding: "40px", border: "1px solid var(--border)" }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 26, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 8 }}>プライバシーポリシー</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 32 }}>最終更新日：2025年1月1日</p>

          {[
            {
              title: "1. 収集する情報",
              content: "本サービスでは、デバイスIDを用いて利用状況を管理します。氏名・メールアドレス等の個人を特定できる情報は収集しません。入力された食材情報はAI生成のためにのみ使用され、保存されません。",
            },
            {
              title: "2. 情報の利用目的",
              content: "収集した情報は、トライアル期間管理・サブスクリプション状態の管理・サービス改善にのみ使用します。第三者への提供は行いません。",
            },
            {
              title: "3. 決済情報",
              content: "クレジットカード情報はStripe社が管理します。当社はカード情報を直接取得・保存しません。Stripeのプライバシーポリシーが適用されます。",
            },
            {
              title: "4. Cookiesおよびローカルストレージ",
              content: "本サービスはデバイスを識別するためにブラウザのLocalStorageを使用します。これにより、ログイン不要でトライアル状態を管理します。",
            },
            {
              title: "5. お問い合わせ",
              content: "プライバシーに関するご質問・ご要望は、サービス内のお問い合わせフォームよりご連絡ください。",
            },
          ].map((section, i) => (
            <div key={i} style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 8 }}>{section.title}</h2>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8 }}>{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
