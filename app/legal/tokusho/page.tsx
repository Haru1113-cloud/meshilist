export default function TokushoPage() {
  const rows = [
    { label: "販売業者", value: "（運営者名をここに入力）" },
    { label: "代表者", value: "（代表者名をここに入力）" },
    { label: "所在地", value: "（住所をここに入力）" },
    { label: "電話番号", value: "お問い合わせフォームよりご連絡ください" },
    { label: "メールアドレス", value: "（メールアドレスをここに入力）" },
    { label: "サービス名", value: "メシリスト" },
    { label: "販売価格", value: "月額480円（税込）" },
    { label: "支払い時期", value: "毎月自動更新" },
    { label: "支払い方法", value: "クレジットカード（Stripe決済）" },
    { label: "サービス提供時期", value: "決済完了後、即時" },
    { label: "返品・キャンセル", value: "サブスクリプションはいつでも解約可能です。解約後は当月末まで利用できます。既払い料金の返金は行いません。" },
    { label: "動作環境", value: "インターネット接続が可能なブラウザ（Chrome、Safari、Firefox、Edge等）" },
  ];

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
          <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 26, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 8 }}>特定商取引法に基づく表記</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 32 }}>特定商取引法第11条に基づく表示</p>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "14px 0", width: "35%", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", verticalAlign: "top", paddingRight: 16 }}>{row.label}</td>
                  <td style={{ padding: "14px 0", fontSize: 13, color: "var(--text-primary)", lineHeight: 1.7 }}>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
