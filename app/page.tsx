"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── Data ────────────────────────────────────────────────────────
const PROBLEMS = [
  { icon: "😮‍💨", time: "帰宅後・17時", title: "「今日何にしよう…」でスーパーをさまよう", desc: "疲れているのに献立が浮かばず、結局いつもの食材をカゴに入れてしまう。" },
  { icon: "🔁", time: "毎週繰り返す", title: "気づけば同じメニューばかりになっている", desc: "バリエーションを増やしたくても、仕事と育児で考える余裕がない。" },
  { icon: "🗑️", time: "週末の冷蔵庫", title: "使い切れなかった食材を捨てる罪悪感", desc: "計画なしの買い物が積み重なって、フードロスと余計な出費が生まれる。" },
];

const STEPS = [
  { num: "01", emoji: "🧅", title: "食材をタップ or 入力", desc: "冷蔵庫にあるものをチップで選ぶか、テキストで入力するだけ。30秒あれば十分。" },
  { num: "02", emoji: "⚙️", title: "家族の条件を設定", desc: "和食・洋食・中華、人数、苦手食材、調理時間、品数まで自由に選べます。" },
  { num: "03", emoji: "✨", title: "献立＋レシピ＋買い物リストが完成", desc: "AIが1週間分の献立・手順つきレシピ・まとめ買いリストを一括で生成します。" },
];

const FEATURES = [
  { icon: "📅", title: "今夜〜1週間分を一括生成", desc: "今夜だけ・3日分・1週間分と期間を選べます。朝昼夕の献立をまとめてAIがプランニング。" },
  { icon: "📸", title: "料理写真つきで完成イメージが分かる", desc: "生成した料理の写真が自動で付いてきます。「今夜これが食べたい」が目で選べる。" },
  { icon: "🛒", title: "スーパーでそのまま使えるリスト", desc: "献立から必要な食材をカテゴリ別に自動整理。スーパーでの無駄買いが減ります。" },
  { icon: "✂️", title: "包丁いらず・レンチンだけも選べる", desc: "疲れた日はキッチンバサミと電子レンジだけで完結するレシピを提案。ハードルゼロ。" },
  { icon: "📓", title: "作った料理を記録してレシピ帳に", desc: "おいしかった料理を評価して保存。家族の好みがどんどん蓄積されていきます。※スタンダード以上" },
  { icon: "🎯", title: "品数まで自由に選べる", desc: "主菜だけ・主菜＋副菜2品・がっつり4品まで、その日の気分や時間に合わせて。" },
];

const TESTIMONIALS = [
  { name: "田中 美里", role: "2児のママ・会社員", avatar: "👩‍💼", stars: 5, text: "毎晩の「今日何にしよう」がなくなりました。帰宅前にサクッと入力して、必要な物だけ買える。フードロスも減って一石二鳥です！", badge: "献立疲れがゼロに" },
  { name: "鈴木 健太", role: "共働き・30代", avatar: "👨‍💼", stars: 5, text: "週の初めに献立を決めておくと本当に楽。買い物リストもそのまま使えて、夫婦でスムーズに分担できるようになりました。", badge: "夫婦の分担がラクに" },
  { name: "佐藤 ゆき", role: "フルタイムワーカー", avatar: "👩‍🍳", stars: 5, text: "冷蔵庫の余り物を入力したらピッタリの献立を出してくれました。無駄買いが確実に減っています。", badge: "食材の無駄がなくなった" },
  { name: "山田 浩二", role: "料理担当パパ", avatar: "👨‍🍳", stars: 5, text: "レシピ付きで提案してくれるから、料理が得意じゃない自分でもちゃんと作れます。週1サイクルで使い続けています。", badge: "苦手でも毎週続いている" },
  { name: "中村 あゆ", role: "3人家族のママ", avatar: "👩‍👧‍👦", stars: 5, text: "子どもが苦手なものを入力しておくと除いてくれるのが助かる。毎週月曜日の習慣になりました。", badge: "毎週月曜の習慣に" },
  { name: "伊藤 翔", role: "単身赴任中・30代", avatar: "🧑‍💻", stars: 5, text: "一人暮らしで食材を余らせがちだったけど、使い切りメニューを考えてくれるから無駄がなくなりました。", badge: "一人暮らしにも最高" },
];

const FAQS = [
  { q: "無料トライアルにクレジットカードは必要ですか？", a: "不要です。登録なしで7日間無料でお使いいただけます。期間終了後も自動で課金されることはありません。" },
  { q: "サブスクはいつでも解約できますか？", a: "はい、いつでも解約できます。解約後も当月末まで利用可能です。違約金等は一切ありません。" },
  { q: "どんな食材でも対応できますか？", a: "基本的な食材であれば対応しています。冷蔵庫にあるものを自由に入力してください。珍しい食材でも柔軟に対応します。" },
  { q: "アレルギー対応はできますか？", a: "苦手食材・アレルギー食材を設定するとそれを除いた献立を提案します。家族全員が安心して食べられる献立を生成します。" },
  { q: "スマホでも使えますか？", a: "はい、スマートフォンに最適化されています。買い物中や通勤中にも使いやすい設計です。" },
  { q: "品数は選べますか？", a: "主菜のみ（1品）から主菜＋副菜3品（4品）まで選べます。疲れた日は1品だけ、余裕があるときは4品と使い分けられます。" },
];

const TICKER_ITEMS = [
  "🥗 今夜の夕飯、決まった？", "🛒 買い物リストも自動生成", "🍱 1週間分まとめてプランニング",
  "🥘 家族全員が喜ぶ献立を", "🧅 冷蔵庫の食材で献立を提案", "⏱️ 入力30秒で献立完成",
  "🥗 今夜の夕飯、決まった？", "🛒 買い物リストも自動生成", "🍱 1週間分まとめてプランニング",
  "🥘 家族全員が喜ぶ献立を", "🧅 冷蔵庫の食材で献立を提案", "⏱️ 入力30秒で献立完成",
];

function KoocaBowlIcon({ size = 28 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/kooca-bowl-transparent.png" alt="kooca" width={size} style={{ display: "block" }} />;
}

export default function LandingPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── Nav ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(245,243,238,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)", padding: "0 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <KoocaBowlIcon size={34} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 17, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                メシ<span style={{ color: "var(--accent)" }}>リスト</span>
              </span>
              <span style={{ fontFamily: "var(--font-pacifico)", fontSize: 10, color: "var(--text-muted)" }}>by kooca</span>
            </div>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a href="/recipes" style={{ padding: "8px 14px", borderRadius: 10, fontSize: 13, fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--text-secondary)", textDecoration: "none", border: "1px solid var(--border)", background: "#fff" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              📖 レシピ集
            </a>
            <button onClick={() => router.push("/app")}
              style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
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
      <section style={{ padding: "72px 24px 56px", background: "#fff" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div className="lp-hero">

            {/* Left: copy */}
            <div>
              <div className="animate-fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#deecd6", borderRadius: 20, padding: "5px 14px", marginBottom: 24 }}>
                <span style={{ fontSize: 13 }}>🌿</span>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 11, fontWeight: 700, color: "#2f5228", letterSpacing: "0.08em", textTransform: "uppercase" }}>AI献立生成 — 7日間完全無料</span>
              </div>

              <h1 className="animate-fade-up delay-1" style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "clamp(30px, 4vw, 52px)", lineHeight: 1.15, letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 20 }}>
                「今日、<span style={{ color: "var(--accent)" }}>何食べる？</span>」<br />
                もう悩まなくていい。
              </h1>

              <p className="animate-fade-up delay-2" style={{ fontSize: "clamp(14px, 1.8vw, 17px)", color: "var(--text-secondary)", lineHeight: 1.85, marginBottom: 32 }}>
                食材を入力するだけで、AIが今夜の献立からレシピ・買い物リストまで自動生成。<br />
                毎日の献立疲れを、まるごとなくします。
              </p>

              {/* Trust pills */}
              <div className="animate-fade-up delay-2" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
                {["✓ クレジットカード不要", "✓ 7日間完全無料", "✓ いつでも解約OK", "✓ 登録不要"].map(t => (
                  <span key={t} style={{ background: "#f0ede7", borderRadius: 20, padding: "5px 12px", fontSize: 12, fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--text-secondary)" }}>{t}</span>
                ))}
              </div>

              <div className="animate-fade-up delay-3" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button className="press-btn" onClick={() => router.push("/app")}
                  style={{ padding: "15px 36px", borderRadius: 14, border: "none", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 20px rgba(230,149,26,0.35)" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(230,149,26,0.45)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(230,149,26,0.35)"; }}>
                  今すぐ無料で試す →
                </button>
                <button className="press-btn" onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                  style={{ padding: "15px 24px", borderRadius: 14, border: "1.5px solid var(--border)", background: "#fff", color: "var(--text-primary)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-subtle)"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                  料金を見る
                </button>
              </div>

              {/* Mini social proof */}
              <div className="animate-fade-up delay-4" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 28 }}>
                <div style={{ display: "flex" }}>
                  {["👩‍💼", "👨‍🍳", "👩‍👧‍👦", "🧑‍💻", "👩‍🍳"].map((em, i) => (
                    <span key={i} style={{ width: 32, height: 32, borderRadius: "50%", background: "#f0ede7", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginLeft: i > 0 ? -8 : 0 }}>{em}</span>
                  ))}
                </div>
                <div>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1,2,3,4,5].map(s => <span key={s} style={{ color: "#f4b942", fontSize: 13 }}>★</span>)}
                  </div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 600, margin: 0 }}>
                    毎日の献立に悩む方に使われています
                  </p>
                </div>
              </div>
            </div>

            {/* Right: UI mockup */}
            <div className="animate-fade-up delay-2" style={{ position: "relative" }}>
              {/* Main card */}
              <div style={{ background: "#fff", borderRadius: 24, padding: "24px", border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.1)", position: "relative", zIndex: 2 }}>
                {/* App bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
                  <KoocaBowlIcon size={28} />
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 15, color: "var(--text-primary)" }}>メシリスト</span>
                  <div style={{ marginLeft: "auto", background: "#deecd6", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontFamily: "var(--font-heading)", fontWeight: 700, color: "#2f5228" }}>✓ 生成完了</div>
                </div>

                {/* Dish photos row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                  {[
                    { emoji: "🍖", name: "豚の生姜焼き", cal: "380kcal", type: "主菜" },
                    { emoji: "🥗", name: "ほうれん草のおひたし", cal: "45kcal", type: "副菜1" },
                    { emoji: "🍜", name: "豚汁", cal: "120kcal", type: "副菜2" },
                  ].map((d, i) => (
                    <div key={i} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
                      <div style={{ height: 72, background: i === 0 ? "#fdebd6" : i === 1 ? "#deecd6" : "#fdf0d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>{d.emoji}</div>
                      <div style={{ padding: "8px 8px 10px" }}>
                        <div style={{ fontSize: 9, fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--accent)", letterSpacing: "0.04em", marginBottom: 2 }}>{d.type}</div>
                        <div style={{ fontSize: 11, fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>{d.name}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>{d.cal}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shopping list preview */}
                <div style={{ background: "var(--bg-subtle)", borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em", marginBottom: 8 }}>🛒 まとめ買いリスト</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {["豚バラ 200g", "ほうれん草", "大根", "玉ねぎ", "生姜", "みりん"].map(item => (
                      <span key={item} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "var(--text-secondary)" }}>{item}</span>
                    ))}
                  </div>
                </div>

                {/* Generation time badge */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                  <span>⚡</span> 28秒で生成完了
                </div>
              </div>

              {/* Floating badge */}
              <div style={{ position: "absolute", top: -16, right: -16, background: "var(--accent)", borderRadius: 14, padding: "10px 16px", boxShadow: "0 4px 20px rgba(230,149,26,0.4)", zIndex: 3 }}>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 13, color: "#fff" }}>7日間</div>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 11, color: "rgba(255,255,255,0.85)" }}>完全無料</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{ background: "var(--text-primary)", padding: "20px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div className="lp-stats">
            {[
              { num: "30秒", label: "平均生成時間" },
              { num: "7日間", label: "完全無料で体験" },
              { num: "¥280〜", label: "月額プランから" },
              { num: "0円", label: "クレジットカード登録不要" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center", padding: "8px 12px", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "clamp(18px, 2.5vw, 28px)", color: "var(--accent)", letterSpacing: "-0.03em" }}>{s.num}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-heading)", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem ── */}
      <section style={{ padding: "80px 24px", background: "var(--bg-subtle)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p className="label" style={{ marginBottom: 12 }}>こんなこと、ありませんか？</p>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "clamp(22px, 4vw, 34px)", color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
              献立を決める時間が<br />毎日ストレスになっていませんか？
            </h2>
          </div>

          <div className="lp-grid-3">
            {PROBLEMS.map((p, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 18, padding: "28px 24px", border: "1.5px solid var(--border)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 16, right: 16, background: "var(--bg-subtle)", borderRadius: 8, padding: "3px 8px", fontSize: 10, fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--text-muted)" }}>{p.time}</div>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{p.icon}</div>
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 8, lineHeight: 1.4 }}>{p.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>{p.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32, background: "#fff", borderRadius: 16, padding: "20px 24px", border: "1.5px solid #4a7840", display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 32, flexShrink: 0 }}>💡</span>
            <div>
              <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "#2f5228", margin: "0 0 4px" }}>メシリストが、その悩みをまるごと解決します。</p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>食材を入れるだけで、今夜から献立決めに悩む時間がゼロになります。</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p className="label" style={{ marginBottom: 12 }}>How it works</p>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "clamp(22px, 4vw, 34px)", color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
              たった3ステップ・30秒で完了
            </h2>
          </div>

          <div className="lp-grid-steps">
            {STEPS.map((s, i) => (
              <div key={i} style={{ padding: "0 24px", textAlign: "center", position: "relative" }}>
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div style={{ position: "absolute", top: 36, right: -12, width: 24, height: 2, background: "var(--border)", zIndex: 0, display: "block" }} />
                )}
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: i === 2 ? "var(--accent)" : "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 20px", border: i === 2 ? "none" : "1.5px solid var(--border)", position: "relative", zIndex: 1 }}>
                  {s.emoji}
                </div>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: 8 }}>{s.num}</div>
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 10, lineHeight: 1.4 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 48 }}>
            <button className="press-btn" onClick={() => router.push("/app")}
              style={{ padding: "14px 36px", borderRadius: 14, border: "none", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 20px rgba(230,149,26,0.3)" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; }}>
              まず試してみる（無料） →
            </button>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10 }}>クレジットカード不要 · 7日間完全無料</p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "80px 24px", background: "var(--bg-subtle)" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p className="label" style={{ marginBottom: 12 }}>Features</p>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "clamp(22px, 4vw, 34px)", color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
              献立決めに必要なものが<br />全部そろっている
            </h2>
          </div>

          <div className="lp-grid-6">
            {FEATURES.map((f, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 18, padding: "24px", border: "1px solid var(--border)", display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, border: "1px solid var(--border)" }}>
                  {f.icon}
                </div>
                <div>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 6, lineHeight: 1.4 }}>{f.title}</h3>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p className="label" style={{ marginBottom: 12 }}>Testimonials</p>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "clamp(22px, 4vw, 34px)", color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
              使っている人の声
            </h2>
          </div>

          {/* Hero testimonial */}
          <div className="lp-hero-test" style={{ background: "var(--bg-subtle)", borderRadius: 24, padding: "32px 36px", border: "1px solid var(--border)", marginBottom: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, border: "2px solid var(--border)", marginBottom: 8 }}>
                {TESTIMONIALS[0].avatar}
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{TESTIMONIALS[0].name}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{TESTIMONIALS[0].role}</div>
            </div>
            <div>
              <div style={{ display: "flex", gap: 3, marginBottom: 12 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ color: "#f4b942", fontSize: 16 }}>★</span>)}
              </div>
              <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "var(--text-primary)", lineHeight: 1.8, fontFamily: "var(--font-heading)", fontWeight: 500, margin: "0 0 12px" }}>
                「{TESTIMONIALS[0].text}」
              </p>
              <span style={{ background: "#deecd6", color: "#2f5228", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontFamily: "var(--font-heading)", fontWeight: 700 }}>
                ✓ {TESTIMONIALS[0].badge}
              </span>
            </div>
          </div>

          {/* Grid testimonials */}
          <div className="lp-grid-test">
            {TESTIMONIALS.slice(1).map((t, i) => (
              <div key={i} style={{ background: "var(--bg-subtle)", borderRadius: 18, padding: "22px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 10 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: "#f4b942", fontSize: 13 }}>★</span>)}
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8, margin: "0 0 14px" }}>
                  「{t.text}」
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: "1px solid var(--border)" }}>{t.avatar}</div>
                    <div>
                      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.role}</div>
                    </div>
                  </div>
                  <span style={{ background: "#deecd6", color: "#2f5228", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontFamily: "var(--font-heading)", fontWeight: 700 }}>
                    ✓ {t.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mid-page CTA ── */}
      <section style={{ padding: "56px 24px", background: "#deecd6" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "clamp(18px, 3vw, 26px)", color: "#2f5228", marginBottom: 16, letterSpacing: "-0.02em" }}>
            今夜から試してみませんか？<br />7日間、完全無料です。
          </p>
          <button className="press-btn" onClick={() => router.push("/app")}
            style={{ padding: "14px 40px", borderRadius: 14, border: "none", background: "#4a7840", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 20px rgba(74,120,64,0.3)" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; }}>
            無料で献立を生成する →
          </button>
          <p style={{ fontSize: 12, color: "#4a7840", marginTop: 12 }}>クレジットカード不要 · 登録不要 · いつでも解約OK</p>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
          <p className="label" style={{ marginBottom: 12 }}>Pricing</p>
          <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "clamp(22px, 4vw, 34px)", color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 12 }}>
            あなたに合ったプランを
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 8 }}>全プラン 7日間無料トライアルつき · クレジットカード不要</p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 48 }}>トライアル中は全機能が使えます。終了後も自動で課金されません。</p>

          <div className="lp-grid-3-20">
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

            {/* スタンダード */}
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
                  {["献立生成 無制限", "料理写真つき生成", "1週間分プランニング", "レシピ概要・手順つき", "まとめ買いリスト", "レシピ保存・評価 ★"].map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                      <span style={{ color: "#4a7840", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>✓</span>{f}
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
                {["献立生成 無制限", "料理写真つき生成（高画質）✨", "1週間分プランニング", "レシピ概要・手順つき", "まとめ買いリスト", "レシピ保存・評価 ★"].map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                    <span style={{ color: "#4a7840", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>✓</span>{f}
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

          {/* 比較表 */}
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
          <p style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)" }}>いつでも解約OK · 解約後も当月末まで利用可能</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: "80px 24px", background: "var(--bg-subtle)" }}>
        <div style={{ maxWidth: 660, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p className="label" style={{ marginBottom: 12 }}>FAQ</p>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "clamp(22px, 4vw, 34px)", color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
              よくある質問
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{faq.q}</span>
                  <span style={{ fontSize: 18, color: "var(--text-muted)", transition: "transform 0.2s", transform: openFaq === i ? "rotate(45deg)" : "rotate(0)", flexShrink: 0, marginLeft: 12 }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 20px 18px", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8 }}>{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section style={{ padding: "80px 24px", textAlign: "center", background: "#fff" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24, gap: 6 }}>
            <div className="animate-walk">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/kooca-walk-transparent.png" alt="歩く人" style={{ height: 80 }} />
            </div>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 700, color: "var(--accent-dark)", letterSpacing: "0.14em" }}>コツコツツクル。</span>
          </div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "clamp(24px, 4vw, 38px)", letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 16 }}>
            今夜から、献立で<br />
            <span style={{ color: "var(--accent)" }}>悩む時間</span>をなくそう。
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 12 }}>
            7日間無料、クレジットカード不要。<br />まず試してみてください。
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 28 }}>
            {["✓ クレカ不要", "✓ 7日間無料", "✓ いつでも解約OK"].map(t => (
              <span key={t} style={{ background: "var(--bg-subtle)", borderRadius: 20, padding: "5px 12px", fontSize: 12, fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--text-secondary)" }}>{t}</span>
            ))}
          </div>
          <button className="press-btn" onClick={() => router.push("/app")}
            style={{ padding: "18px 44px", borderRadius: 14, border: "none", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 17, cursor: "pointer", boxShadow: "0 4px 24px rgba(230,149,26,0.35)" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(230,149,26,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 24px rgba(230,149,26,0.35)"; }}>
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
                <span style={{ fontFamily: "var(--font-pacifico)", fontSize: 10, color: "rgba(255,255,255,0.5)" }}>by kooca</span>
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
