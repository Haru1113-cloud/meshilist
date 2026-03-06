"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PROBLEMS = [
  { icon: "😩", text: "「今日の夕飯何にしよう…」と毎日悩んでいる" },
  { icon: "🛒", text: "買い物に行ってから献立を考えて無駄買いしてしまう" },
  { icon: "🔁", text: "結局いつも同じメニューになってしまう" },
];

const STEPS = [
  { num: "01", title: "食材を入力", desc: "冷蔵庫にある食材を入力するだけ。チップで手軽に選択できます。" },
  { num: "02", title: "スタイルを選ぶ", desc: "和食・洋食・中華・何でもOK。家族の人数や苦手食材も設定。" },
  { num: "03", title: "献立が完成", desc: "数秒で1週間の献立・レシピ・買い物リストを一括生成。" },
];

const FEATURES = [
  { icon: "📅", title: "週間献立を一括生成", desc: "3日分〜1週間分の朝昼夕食をまとめて提案。もう毎日悩まない。" },
  { icon: "🍳", title: "レシピ概要つき", desc: "夕食は材料と5ステップの手順が自動で付いてくる。" },
  { icon: "🛒", title: "まとめ買いリスト", desc: "必要な食材をカテゴリ別に整理。スーパーでの買い物が一気に楽に。" },
];

const TESTIMONIALS = [
  { name: "田中 美里", role: "2児のママ・会社員", avatar: "👩‍💼", text: "毎晩の「今日何にしよう」がなくなりました。帰宅前にサクッと入力して、必要な物だけ買える。フードロスも減って一石二鳥です！" },
  { name: "鈴木 健太", role: "共働き・30代", avatar: "👨‍💼", text: "妻と分担して料理しているのですが、週の初めに献立を決めておくと本当に楽。買い物リストもそのまま使えます。" },
  { name: "佐藤 ゆき", role: "フルタイムワーカー", avatar: "👩‍🍳", text: "冷蔵庫の余り物を入力したらピッタリの献立を出してくれました。無駄買いが確実に減っています。" },
  { name: "山田 浩二", role: "料理担当パパ", avatar: "👨‍🍳", text: "レシピ付きで提案してくれるから、料理が得意じゃない自分でもちゃんと作れます。週1サイクルで使い続けています。" },
  { name: "中村 あゆ", role: "3人家族のママ", avatar: "👩‍👧‍👦", text: "子どもが苦手なものを入力しておくと除いてくれるのが助かる。毎週月曜日の習慣になりました。" },
  { name: "伊藤 翔", role: "単身赴任中・30代", avatar: "🧑‍💻", text: "一人暮らしで食材を余らせがちだったけど、使い切りメニューを考えてくれるから無駄がなくなりました。" },
];

const FAQS = [
  { q: "無料トライアルにクレジットカードは必要ですか？", a: "不要です。登録なしで7日間無料でお使いいただけます。" },
  { q: "サブスクはいつでも解約できますか？", a: "はい、いつでも解約できます。解約後も当月末まで利用可能です。" },
  { q: "どんな食材でも対応できますか？", a: "基本的な食材であれば対応しています。冷蔵庫にあるものを自由に入力してください。" },
  { q: "アレルギー対応はできますか？", a: "苦手食材・アレルギー食材を入力するとそれを除いた献立を提案します。" },
  { q: "スマホでも使えますか？", a: "はい、スマートフォンに最適化されています。外出先でもお使いいただけます。" },
];

const TICKER_ITEMS = [
  "🥗 今夜の夕飯、決まった？", "🛒 買い物リストも自動生成", "🍱 1週間分まとめてプランニング",
  "🥘 家族全員が喜ぶ献立を", "🧅 冷蔵庫の食材で献立を提案", "⏱️ 入力30秒で献立完成",
  "🥗 今夜の夕飯、決まった？", "🛒 買い物リストも自動生成", "🍱 1週間分まとめてプランニング",
  "🥘 家族全員が喜ぶ献立を", "🧅 冷蔵庫の食材で献立を提案", "⏱️ 入力30秒で献立完成",
];

// ─── Brand image components ───────────────────────────────────────
function KoocaBowlIcon({ size = 28 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/kooca-bowl-transparent.png" alt="kooca" width={size} style={{ display: "block" }} />
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── Nav ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(245,243,238,0.88)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)", padding: "0 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <KoocaBowlIcon size={36} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 17, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                メシ<span style={{ color: "var(--accent)" }}>リスト</span>
              </span>
              <span style={{ fontFamily: "var(--font-pacifico)", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.02em" }}>
                by kooca
              </span>
            </div>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a href="/recipes" style={{
              padding: "8px 16px", borderRadius: 10, fontSize: 13,
              fontFamily: "var(--font-heading)", fontWeight: 600,
              color: "var(--text-secondary)", textDecoration: "none",
              border: "1px solid var(--border)", background: "#fff",
              transition: "border-color 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              📖 レシピ集
            </a>
            <button
              onClick={() => router.push("/app")}
              style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, cursor: "pointer", letterSpacing: "0.01em" }}
            >
              無料で試す
            </button>
          </div>
        </div>
      </nav>

      {/* ── Ticker ── */}
      <div style={{ overflow: "hidden", background: "#4a7840", padding: "9px 0" }}>
        <div className="marquee-track" style={{ gap: 48 }}>
          {TICKER_ITEMS.map((item, i) => (
            <span key={i} style={{ fontFamily: "var(--font-heading)", fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", letterSpacing: "0.04em" }}>{item}</span>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <section style={{ padding: "80px 24px 72px", textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div className="animate-fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#deecd6", borderRadius: 20, padding: "5px 14px", marginBottom: 28 }}>
            <span style={{ fontSize: 13 }}>🌿</span>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 11, fontWeight: 700, color: "#2f5228", letterSpacing: "0.08em", textTransform: "uppercase" }}>AI献立生成 — 7日間無料</span>
          </div>

          <h1 className="animate-fade-up delay-1" style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "clamp(34px, 6vw, 60px)", lineHeight: 1.12, letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 24 }}>
            今夜の夕食、<br />
            <span style={{ color: "var(--accent)" }}>AIに決めてもらおう。</span>
          </h1>

          <p className="animate-fade-up delay-2" style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: 40, maxWidth: 520, margin: "0 auto 40px" }}>
            食材を入力するだけで、1週間分の献立と買い物リストをAIが瞬時に生成。
            毎日の「今日何食べる？」をゼロにします。
          </p>

          <div className="animate-fade-up delay-3" style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <button
              className="press-btn"
              onClick={() => router.push("/app")}
              style={{ padding: "16px 36px", borderRadius: 14, border: "none", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 20px rgba(230,149,26,0.35)" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(230,149,26,0.45)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(230,149,26,0.35)"; }}
            >
              今すぐ無料で試す →
            </button>
            <button
              className="press-btn"
              onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
              style={{ padding: "16px 28px", borderRadius: 14, border: "1px solid var(--border)", background: "#fff", color: "var(--text-primary)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-subtle)"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >
              料金を見る
            </button>
          </div>

          <p className="animate-fade-up delay-4" style={{ marginTop: 20, fontSize: 12, color: "var(--text-muted)" }}>
            クレジットカード不要 · 7日間完全無料 · いつでも解約OK
          </p>
        </div>

        {/* Hero mockup */}
        <div className="animate-fade-up delay-4" style={{ maxWidth: 640, margin: "56px auto 0", background: "#fff", borderRadius: 20, padding: "28px 24px", border: "1px solid var(--border)", boxShadow: "0 8px 40px rgba(0,0,0,0.08)", textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🥬</div>
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>献立生成中...</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>4人家族 · 和食 · 1週間分</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} className="animate-blink" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animationDelay: `${i * 0.3}s` }} />
              ))}
            </div>
          </div>
          <div style={{ background: "var(--bg-subtle)", borderRadius: 12, padding: "16px 18px", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.9, fontFamily: "monospace" }}>
            <div style={{ color: "#4a7840", fontWeight: 600, marginBottom: 6 }}>📅 今週の献立</div>
            <div><strong>月曜:</strong> 朝 — トースト / 昼 — 鶏そぼろ丼 / 夕 — 肉じゃが</div>
            <div><strong>火曜:</strong> 朝 — 納豆ご飯 / 昼 — 豚汁定食 / 夕 — 鮭の塩焼き</div>
            <div style={{ color: "var(--text-muted)" }}>水曜〜日曜 も生成中...</div>
            <div style={{ marginTop: 10, color: "#4a7840", fontWeight: 600 }}>🛒 買い物リスト</div>
            <div>【野菜】 じゃがいも、玉ねぎ、にんじん...</div>
          </div>
        </div>
      </section>

      {/* ── Problem ── */}
      <section style={{ padding: "72px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p className="label" style={{ marginBottom: 12 }}>Problem</p>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "clamp(24px, 4vw, 36px)", color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
              こんな悩み、毎日ありませんか？
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {PROBLEMS.map((p, i) => (
              <div key={i} style={{ background: "var(--bg-subtle)", borderRadius: 16, padding: "28px 24px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{p.icon}</div>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{p.text}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 40, padding: "24px", background: "#deecd6", borderRadius: 16, border: "1px solid rgba(74,120,64,0.15)" }}>
            <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: "#2f5228" }}>
              メシリストが、その悩みをまるごと解決します。
            </p>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: "72px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p className="label" style={{ marginBottom: 12 }}>How it works</p>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "clamp(24px, 4vw, 36px)", color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
              たった3ステップで完了
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "28px 24px", border: "1px solid var(--border)", position: "relative" }}>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 40, color: "#deecd6", lineHeight: 1, marginBottom: 16 }}>{s.num}</div>
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "72px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p className="label" style={{ marginBottom: 12 }}>Features</p>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "clamp(24px, 4vw, 36px)", color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
              献立決めに必要なものが全部そろう
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ borderRadius: 16, padding: "28px 24px", border: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: "72px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p className="label" style={{ marginBottom: 12 }}>Testimonials</p>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "clamp(24px, 4vw, 36px)", color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
              使っている人の声
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {Array.from({ length: 5 }).map((_, s) => (
                    <span key={s} style={{ color: "#f4b942", fontSize: 13 }}>★</span>
                  ))}
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8, flex: 1, margin: 0 }}>
                  「{t.text}」
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: "72px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
          <p className="label" style={{ marginBottom: 12 }}>Pricing</p>
          <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "clamp(24px, 4vw, 36px)", color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 12 }}>
            あなたに合ったプランを
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 8 }}>全プラン 7日間無料トライアルつき · クレジットカード不要</p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 48 }}>トライアル中は全機能が使えます。終了後は自動的に課金されません。</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, alignItems: "stretch" }}>
            {/* ライト */}
            <div style={{ background: "var(--bg-subtle)", borderRadius: 20, padding: "32px 28px", border: "1.5px solid var(--border)", textAlign: "left", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text-muted)", letterSpacing: "0.06em" }}>LIGHT</span>
                <span style={{ fontSize: 11, background: "#e8f4e8", color: "#4a7840", borderRadius: 6, padding: "2px 8px", fontFamily: "var(--font-heading)", fontWeight: 700 }}>お試し向け</span>
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 40, color: "var(--text-primary)", lineHeight: 1, marginBottom: 4 }}>
                ¥280<span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-muted)" }}>/月</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>月10回まで · 1日あたり約9円</p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>週2〜3回ペースで使いたい方に。まず安く始めたい方向け。</p>
              <ul style={{ listStyle: "none", margin: "0 0 28px", padding: 0, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                {[
                  { text: "献立生成 月10回", ok: true },
                  { text: "料理写真つき生成", ok: true },
                  { text: "1週間分プランニング", ok: true },
                  { text: "レシピ概要・手順つき", ok: true },
                  { text: "まとめ買いリスト", ok: true },
                  { text: "レシピ保存・評価", ok: false },
                ].map(f => (
                  <li key={f.text} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: f.ok ? "var(--text-secondary)" : "var(--text-muted)" }}>
                    <span style={{ color: f.ok ? "#4a7840" : "#ccc", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{f.ok ? "✓" : "✕"}</span>
                    <span style={{ textDecoration: f.ok ? "none" : "line-through" }}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => router.push("/app")}
                style={{ width: "100%", padding: "13px", borderRadius: 12, border: "1.5px solid var(--accent)", background: "#fff", color: "var(--accent)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-light)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
                7日間無料で試す →
              </button>
            </div>

            {/* スタンダード（おすすめ） */}
            <div style={{ position: "relative", paddingTop: 18, display: "flex", flexDirection: "column" }}>
              <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", zIndex: 1, background: "#4a7840", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", padding: "5px 18px", borderRadius: 20, whiteSpace: "nowrap" }}>
                👑 いちばん人気
              </div>
              <div style={{ background: "#fff", borderRadius: 20, padding: "32px 28px", border: "2px solid var(--accent)", borderTop: "4px solid #4a7840", boxShadow: "0 8px 40px rgba(230,149,26,0.15)", textAlign: "left", display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--accent)", letterSpacing: "0.06em" }}>STANDARD</span>
                  <span style={{ fontSize: 11, background: "#fff3d6", color: "#a07010", borderRadius: 6, padding: "2px 8px", fontFamily: "var(--font-heading)", fontWeight: 700 }}>ヘビーユーザー向け</span>
                </div>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 40, color: "var(--text-primary)", lineHeight: 1, marginBottom: 4 }}>
                  ¥480<span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-muted)" }}>/月</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>無制限 · 1日あたり約16円</p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>毎日使いたい方に。作った料理を保存して自分だけのレシピ帳に。</p>
                <ul style={{ listStyle: "none", margin: "0 0 28px", padding: 0, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  {[
                    { text: "献立生成 無制限", ok: true },
                    { text: "料理写真つき生成", ok: true },
                    { text: "1週間分プランニング", ok: true },
                    { text: "レシピ概要・手順つき", ok: true },
                    { text: "まとめ買いリスト", ok: true },
                    { text: "レシピ保存・評価 ★", ok: true },
                  ].map(f => (
                    <li key={f.text} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                      <span style={{ color: "#4a7840", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>✓</span>
                      {f.text}
                    </li>
                  ))}
                </ul>
                <button onClick={() => router.push("/app")}
                  style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 20px rgba(230,149,26,0.35)", transition: "transform 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = ""}>
                  7日間無料で試す →
                </button>
              </div>
            </div>

            {/* プレミアム */}
            <div style={{ background: "var(--bg-subtle)", borderRadius: 20, padding: "32px 28px", border: "1.5px solid var(--border)", textAlign: "left", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text-muted)", letterSpacing: "0.06em" }}>PREMIUM</span>
                <span style={{ fontSize: 11, background: "#f3e8ff", color: "#7c3aed", borderRadius: 6, padding: "2px 8px", fontFamily: "var(--font-heading)", fontWeight: 700 }}>こだわり派向け</span>
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 40, color: "var(--text-primary)", lineHeight: 1, marginBottom: 4 }}>
                ¥980<span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-muted)" }}>/月</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>無制限 · 1日あたり約33円</p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>料理を「見て楽しむ」レベルへ。高画質写真でテーブルが映える。</p>
              <ul style={{ listStyle: "none", margin: "0 0 28px", padding: 0, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                {[
                  { text: "献立生成 無制限", ok: true },
                  { text: "料理写真つき生成（高画質）✨", ok: true },
                  { text: "1週間分プランニング", ok: true },
                  { text: "レシピ概要・手順つき", ok: true },
                  { text: "まとめ買いリスト", ok: true },
                  { text: "レシピ保存・評価 ★", ok: true },
                ].map(f => (
                  <li key={f.text} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                    <span style={{ color: "#4a7840", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>✓</span>
                    {f.text}
                  </li>
                ))}
              </ul>
              <button onClick={() => router.push("/app")}
                style={{ width: "100%", padding: "13px", borderRadius: 12, border: "1.5px solid var(--accent)", background: "#fff", color: "var(--accent)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-light)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
                7日間無料で試す →
              </button>
            </div>
          </div>

          {/* 比較ポイント */}
          <div style={{ marginTop: 40, background: "var(--bg-subtle)", borderRadius: 16, padding: "20px 24px", border: "1px solid var(--border)", textAlign: "left" }}>
            <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 12 }}>📊 プランの主な違い</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 0, fontSize: 12 }}>
              {[
                ["", "LIGHT", "STANDARD", "PREMIUM"],
                ["献立生成", "月10回", "無制限", "無制限"],
                ["料理写真", "標準画質", "標準画質", "高画質 ✨"],
                ["レシピ保存", "—", "✓", "✓"],
                ["月額", "¥280", "¥480", "¥980"],
              ].map((row, i) => (
                row.map((cell, j) => (
                  <div key={`${i}-${j}`} style={{
                    padding: "10px 12px",
                    borderBottom: i < 4 ? "1px solid var(--border)" : "none",
                    borderRight: j < 3 ? "1px solid var(--border)" : "none",
                    background: i === 0 ? "#fff" : j === 2 ? "rgba(230,149,26,0.05)" : "transparent",
                    fontFamily: i === 0 || j === 0 ? "var(--font-heading)" : "inherit",
                    fontWeight: i === 0 || j === 0 ? 700 : 400,
                    color: i === 0 ? "var(--text-muted)" : j === 0 ? "var(--text-primary)" : "var(--text-secondary)",
                    fontSize: i === 0 ? 11 : 12,
                    letterSpacing: i === 0 ? "0.06em" : "normal",
                  }}>
                    {cell}
                  </div>
                ))
              ))}
            </div>
          </div>

          <p style={{ marginTop: 20, fontSize: 12, color: "var(--text-muted)" }}>いつでも解約OK · 解約後も当月末まで利用可能</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: "72px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p className="label" style={{ marginBottom: 12 }}>FAQ</p>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "clamp(24px, 4vw, 36px)", color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
              よくある質問
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ background: "var(--bg-subtle)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                >
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{faq.q}</span>
                  <span style={{ fontSize: 18, color: "var(--text-muted)", transition: "transform 0.2s", transform: openFaq === i ? "rotate(45deg)" : "rotate(0)" }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 20px 18px", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section style={{ padding: "72px 24px", textAlign: "center", background: "var(--accent-light)" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          {/* Walking person illustration */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24, gap: 6 }}>
            <div className="animate-walk">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/kooca-walk-transparent.png" alt="歩く人" style={{ height: 80 }} />
            </div>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 700, color: "var(--accent-dark)", letterSpacing: "0.14em" }}>コツコツツクル。</span>
          </div>

          <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "clamp(26px, 4vw, 40px)", letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 20 }}>
            今夜から、献立で<br />
            <span style={{ color: "var(--accent)" }}>悩む時間</span>をなくそう。
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 36 }}>
            7日間無料、クレジットカード不要。まず試してみてください。
          </p>
          <button
            className="press-btn"
            onClick={() => router.push("/app")}
            style={{ padding: "18px 44px", borderRadius: 14, border: "none", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 17, cursor: "pointer", boxShadow: "0 4px 24px rgba(230,149,26,0.35)" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(230,149,26,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 24px rgba(230,149,26,0.35)"; }}
          >
            無料で献立を生成する →
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "var(--text-primary)", padding: "40px 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <KoocaBowlIcon size={28} />
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 15, color: "#fff", letterSpacing: "-0.03em" }}>メシリスト</span>
                <span style={{ fontFamily: "var(--font-pacifico)", fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.02em" }}>by kooca</span>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
              {[
                { label: "利用規約", href: "/legal/terms" },
                { label: "プライバシーポリシー", href: "/legal/privacy" },
                { label: "特定商取引法に基づく表記", href: "/legal/tokusho" },
                { label: "解約", href: "/cancel" },
              ].map(link => (
                <a key={link.href} href={link.href} style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
            © 2025 メシリスト. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
