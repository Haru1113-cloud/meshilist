export default function TermsPage() {
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
          <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 26, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 8 }}>利用規約</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 32 }}>最終更新日：2025年1月1日</p>

          {[
            {
              title: "第1条（利用規約の適用）",
              content: "本規約は、メシリスト（以下「本サービス」）の利用に関する条件を定めるものです。本サービスをご利用いただくことで、本規約に同意いただいたものとみなします。",
            },
            {
              title: "第2条（サービス内容）",
              content: "本サービスは、AIを活用した献立生成サービスです。食材・家族人数・料理スタイル等の入力情報をもとに、週間献立・レシピ概要・買い物リストを自動生成します。",
            },
            {
              title: "第3条（トライアル期間）",
              content: "初回利用から7日間は無料でご利用いただけます。トライアル期間終了後は、有料サブスクリプション（月額480円）への登録が必要です。",
            },
            {
              title: "第4条（料金・支払い）",
              content: "有料プランの月額料金は480円（税込）です。決済はStripeを通じて行われます。毎月自動更新となります。",
            },
            {
              title: "第5条（解約）",
              content: "サブスクリプションはいつでも解約できます。解約後は当月末まで引き続きご利用いただけます。",
            },
            {
              title: "第6条（免責事項）",
              content: "本サービスが提供する献立・レシピ情報はAIが生成したものです。アレルギー・健康状態・栄養管理については、必ず専門家にご相談ください。本サービスの利用により生じた損害について、当社は責任を負いません。",
            },
            {
              title: "第7条（規約の変更）",
              content: "本規約は予告なく変更される場合があります。変更後の規約はサービス上に掲載した時点から効力を生じます。",
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
