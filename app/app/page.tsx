"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ─── Brand image components ───────────────────────────────────────
function KoocaBowlIcon({ size = 28 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/kooca-bowl-transparent.png" alt="kooca" width={size} style={{ display: "block" }} />;
}

// ─── Types ───────────────────────────────────────────────────────
type TabKey = "schedule" | "recipe" | "shopping";
interface ParsedOutput { schedule: string; recipe: string; shopping: string; }

interface CookedRecord {
  id: string;
  dishName: string;
  cookedAt: string; // ISO
  rating: 1 | 2 | 3; // 😐 / 😊 / 🤩
  recipeBody?: string[]; // 材料・手順の生テキスト行
}

// ─── Constants ───────────────────────────────────────────────────
const INGREDIENT_CHIPS = [
  { category: "主食・麺", items: ["ご飯", "パスタ", "うどん", "そうめん", "そば", "食パン", "餅"] },
  { category: "肉・魚", items: ["鶏肉", "豚肉", "牛肉", "鮭", "ツナ缶", "サバ缶", "ちくわ", "ウインナー"] },
  { category: "卵・大豆", items: ["卵", "豆腐", "厚揚げ", "油揚げ", "納豆"] },
  { category: "野菜", items: ["玉ねぎ", "にんじん", "じゃがいも", "キャベツ", "ほうれん草", "ブロッコリー", "もやし", "ピーマン", "なす", "トマト", "きのこ", "白菜", "ねぎ", "大根"] },
];
const STYLE_OPTIONS = [
  { value: "和食", label: "🍜 和食" },
  { value: "洋食", label: "🍝 洋食" },
  { value: "中華", label: "🥟 中華" },
  { value: "何でも", label: "🌍 何でも" },
];
const DAYS_OPTIONS = [
  { value: "today", label: "今夜だけ" },
  { value: "3",     label: "3日分" },
  { value: "7",     label: "1週間分" },
];
const COOK_TIME_OPTIONS = [
  { value: "microwave", label: "📦 レンチン", sub: "タッパーのみ" },
  { value: "quick",     label: "⚡ パッと",   sub: "15分以内" },
  { value: "normal",    label: "🍳 ふつう",   sub: "30分程度" },
  { value: "slow",      label: "🕐 じっくり", sub: "1時間" },
];
const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "schedule", label: "献立表", icon: "📅" },
  { key: "recipe",   label: "レシピ", icon: "🍳" },
  { key: "shopping", label: "買い物リスト", icon: "🛒" },
];

// ─── Helpers ─────────────────────────────────────────────────────
function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem("meshilist_device_id");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("meshilist_device_id", id); }
    return id;
  } catch { return "unknown"; }
}

function parseOutput(text: string): ParsedOutput {
  // Normalize uppercase G (gram unit) to lowercase g
  text = text.replace(/(\d+(?:\.\d+)?)\s*G\b/g, "$1g");
  const s: ParsedOutput = { schedule: "", recipe: "", shopping: "" };
  const scheduleMatch = text.match(/###\s*📅[^\n]*\n([\s\S]*?)(?=###\s*🍳|###\s*🛒|$)/);
  const recipeMatch   = text.match(/###\s*🍳[^\n]*\n([\s\S]*?)(?=###\s*📅|###\s*🛒|$)/);
  const shopMatch     = text.match(/###\s*🛒[^\n]*\n([\s\S]*?)(?=###\s*📅|###\s*🍳|$)/);
  if (scheduleMatch) s.schedule = scheduleMatch[1].trim();
  if (recipeMatch)   s.recipe   = recipeMatch[1].trim();
  if (shopMatch)     s.shopping = shopMatch[1].trim();
  return s;
}

// ─── Sub-renderers ───────────────────────────────────────────────

function MarkdownTable({ lines }: { lines: string[] }) {
  const headers = lines[0].split("|").filter(Boolean).map(h => h.trim());
  const rows = lines.slice(2)
    .map(l => l.split("|").filter(Boolean).map(c => c.trim()))
    .filter(r => r.length > 0);
  return (
    <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid var(--border)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: "10px 14px", background: "#deecd6", color: "#2f5228", fontFamily: "var(--font-heading)", fontWeight: 700, textAlign: "left", whiteSpace: "nowrap", borderBottom: "2px solid #4a7840" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "var(--bg-subtle)", borderBottom: "1px solid var(--border)" }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "10px 14px", color: "var(--text-primary)", verticalAlign: "top", lineHeight: 1.6 }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScheduleSection({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: { type: "table" | "text"; content: string[] }[] = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].trim().startsWith("|")) {
      const tbl: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { tbl.push(lines[i]); i++; }
      blocks.push({ type: "table", content: tbl });
    } else {
      const last = blocks[blocks.length - 1];
      if (!last || last.type !== "text") blocks.push({ type: "text", content: [] });
      blocks[blocks.length - 1].content.push(lines[i]);
      i++;
    }
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {blocks.map((b, idx) => {
        if (b.type === "table") return <MarkdownTable key={idx} lines={b.content} />;
        const txt = b.content.filter(l => l.trim()).join("\n");
        if (!txt) return null;
        return <p key={idx} style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8, margin: 0 }}>{txt}</p>;
      })}
    </div>
  );
}

// 1日の目安量（成人女性）
const DAILY_REF = { protein: 50, fat: 55, carbs: 250, salt: 6.5 };
const NUTRIENT_DEFS = [
  { key: "protein" as const, label: "たんぱく質", color: "#3b82f6", ref: DAILY_REF.protein },
  { key: "fat"     as const, label: "脂質",       color: "#f97316", ref: DAILY_REF.fat },
  { key: "carbs"   as const, label: "炭水化物",   color: "#eab308", ref: DAILY_REF.carbs },
  { key: "salt"    as const, label: "食塩相当量", color: "#ef4444", ref: DAILY_REF.salt },
];

function RecipeNutritionPanel({ line }: { line: string }) {
  // 📊 290kcal / P:14g / F:10g / C:36g / 塩:2.2g
  const m = line.match(/📊\s*(\d+)kcal\s*\/\s*P:([\d.]+)[gG]\s*\/\s*F:([\d.]+)[gG]\s*\/\s*C:([\d.]+)[gG]\s*\/\s*塩:([\d.]+)[gG]/i);
  if (!m) return null;
  const [, kcal, protein, fat, carbs, salt] = m;
  const vals = { protein: +protein, fat: +fat, carbs: +carbs, salt: +salt };

  return (
    <div style={{ background: "#f8f6f2", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
      {/* Calorie */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 12, justifyContent: "center" }}>
        <span style={{ fontSize: 12 }}>🔥</span>
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 32, color: "var(--text-primary)", lineHeight: 1 }}>{kcal}</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>kcal</span>
        <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 2 }}>/ 1人分</span>
      </div>
      {/* Bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {NUTRIENT_DEFS.map(n => {
          const pct = Math.min(Math.round((vals[n.key] / n.ref) * 100), 100);
          return (
            <div key={n.key}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>{n.label}</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 13, color: "var(--text-primary)" }}>{vals[n.key]}g</span>
                  <span style={{
                    fontSize: 9, fontFamily: "var(--font-heading)", fontWeight: 700,
                    color: pct >= 60 ? "#c0392b" : "var(--text-muted)",
                    background: pct >= 60 ? "#fdf0ee" : "#ece9e4",
                    borderRadius: 4, padding: "1px 5px",
                  }}>{pct}%</span>
                </div>
              </div>
              <div style={{ height: 5, background: "#e8e4de", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: n.color, borderRadius: 3 }} />
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 9, color: "var(--text-muted)", textAlign: "right", marginTop: 8, marginBottom: 0 }}>
        ※ 成人女性1日の目安量に対する割合
      </p>
    </div>
  );
}

type StepGuide = {
  dish: string;
  totalTime: string;
  ingredientGroups?: { category: string; emoji: string; items: string[] }[];
  steps: { num: number; emoji: string; title?: string; action: string; heat?: string; time?: string; tip?: string }[];
};

// ─── Recipe Illustration Card ─────────────────────────────────────
function RecipeIllustrationCard({ guide }: { guide: StepGuide }) {
  const hasGroups = (guide.ingredientGroups ?? []).length > 0;
  const cols = Math.min(guide.steps.length, 3);

  return (
    <div style={{ background: "#fdf4e7", borderRadius: 16, border: "2px solid #c8a96e", overflow: "hidden", marginTop: 4 }}>
      <div style={{ display: "grid", gridTemplateColumns: hasGroups ? "minmax(120px, 1fr) minmax(0, 1.7fr)" : "1fr" }}>

        {/* ── 左: 材料 ── */}
        {hasGroups && (
          <div style={{ padding: "16px 14px", borderRight: "2px solid #c8a96e" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <span style={{ width: 7, height: 14, borderRadius: 2, background: "#3d2b1a", display: "block", flexShrink: 0 }} />
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 12, color: "#3d2b1a" }}>材料</span>
            </div>
            {guide.ingredientGroups!.map(group => (
              <div key={group.category} style={{ marginBottom: 10 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#e8c98a", borderRadius: 20, padding: "2px 10px", marginBottom: 5 }}>
                  <span style={{ fontSize: 12 }}>{group.emoji}</span>
                  <span style={{ fontSize: 10, fontFamily: "var(--font-heading)", fontWeight: 700, color: "#5a3e1b" }}>{group.category}</span>
                </div>
                {group.items.map((item, i) => (
                  <div key={i} style={{ fontSize: 11, color: "#4a3520", lineHeight: 1.7, paddingLeft: 4 }}>・{item}</div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── 右: 作り方 ── */}
        <div style={{ padding: "16px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <span style={{ width: 7, height: 14, borderRadius: 2, background: "#3d2b1a", display: "block", flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 12, color: "#3d2b1a" }}>作り方</span>
            <span style={{ fontSize: 10, color: "#8a6840", marginLeft: "auto", fontFamily: "var(--font-heading)", fontWeight: 600 }}>⏱ {guide.totalTime}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 }}>
            {guide.steps.map((step, i) => (
              <div key={step.num} style={{ display: "flex", alignItems: "stretch", gap: 4 }}>
                <div style={{ background: "#fff8ee", borderRadius: 10, padding: "10px 6px", textAlign: "center", border: "1px solid #e0c8a0", flex: 1 }}>
                  {/* 絵文字 "イラスト" */}
                  <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 5 }}>{step.emoji}</div>
                  {/* 火加減・時間チップ */}
                  {(step.heat || step.time) && (
                    <div style={{ display: "flex", justifyContent: "center", gap: 3, marginBottom: 5, flexWrap: "wrap" }}>
                      {step.heat && (
                        <span style={{ fontSize: 9, background: "#fff0d0", color: "#c2410c", borderRadius: 4, padding: "1px 5px", fontFamily: "var(--font-heading)", fontWeight: 700, whiteSpace: "nowrap" }}>
                          🔥{step.heat}
                        </span>
                      )}
                      {step.time && (
                        <span style={{ fontSize: 9, background: "#f0f9ff", color: "#0369a1", borderRadius: 4, padding: "1px 5px", fontFamily: "var(--font-heading)", fontWeight: 700, whiteSpace: "nowrap" }}>
                          ⏱{step.time}
                        </span>
                      )}
                    </div>
                  )}
                  {/* ステップ番号＋説明 */}
                  <div style={{ fontSize: 10, color: "#4a3520", lineHeight: 1.5 }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, color: "#c8a96e" }}>{step.num}. </span>
                    {step.action}
                  </div>
                  {step.tip && (
                    <div style={{ fontSize: 9, color: "#7a5c2e", background: "#fef3c7", borderRadius: 4, padding: "2px 5px", marginTop: 4 }}>
                      💡{step.tip}
                    </div>
                  )}
                </div>
                {/* 矢印 */}
                {i < guide.steps.length - 1 && i % cols !== cols - 1 && (
                  <div style={{ display: "flex", alignItems: "center", color: "#c8a96e", fontSize: 14, flexShrink: 0 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Rating Emoji Button ─────────────────────────────────────────
const RATING_OPTIONS: { value: 1 | 2 | 3; emoji: string; label: string }[] = [
  { value: 1, emoji: "😐", label: "まあまあ" },
  { value: 2, emoji: "😊", label: "おいしい" },
  { value: 3, emoji: "🤩", label: "最高！" },
];

function RecipeBlock({ title, body, imageUrl, imageLoading, processImageUrl, processImageLoading, savedRating, onRate }: {
  title: string;
  body: string[];
  imageUrl?: string | null;
  imageLoading?: boolean;
  processImageUrl?: string | null;
  processImageLoading?: boolean;
  savedRating?: number;
  onRate?: (stars: 1 | 2 | 3, body: string[]) => void;
}) {
  const [ratingOpen, setRatingOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const handleRate = (stars: 1 | 2 | 3) => {
    onRate?.(stars, body);
    setJustSaved(true);
    setRatingOpen(false);
    setTimeout(() => setJustSaved(false), 2500);
  };

  return (
    <div style={{ background: "var(--bg-subtle)", borderRadius: 14, overflow: "hidden" }}>
      {/* 料理写真 */}
      {imageLoading && (
        <div style={{ height: 160, background: "#f0ebe0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span className="animate-spin-sm" style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.1)", borderTopColor: "var(--accent)", display: "inline-block" }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>写真生成中...</span>
        </div>
      )}
      {imageUrl && !imageLoading && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={title} style={{ width: "100%", maxHeight: 280, objectFit: "cover", display: "block" }} />
      )}
      {/* 調理過程イラスト（Nano Banana Pro） */}
      {processImageLoading && (
        <div style={{ height: 120, background: "#fdf4e3", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderTop: "1px solid var(--border)" }}>
          <span className="animate-spin-sm" style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.1)", borderTopColor: "var(--accent)", display: "inline-block" }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>作り方イラスト生成中...</span>
        </div>
      )}
      {processImageUrl && !processImageLoading && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={processImageUrl} alt={`${title} 作り方`} style={{ width: "100%", display: "block", borderTop: "1px solid var(--border)" }} />
      )}

      <div style={{ padding: "20px 22px" }}>
      <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
        <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "var(--text-primary)", margin: 0 }}>
          🍽️ {title}
        </h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {body.map((line, j) => {
            const t = line.trim();
            if (!t) return <div key={j} style={{ height: 6 }} />;
            // Skip markdown separators and table separator rows
            if (t === "---" || /^\|[-| ]+\|$/.test(t)) return null;
            if (t.startsWith("📊")) return <RecipeNutritionPanel key={j} line={t} />;
            if (t === "材料:" || t === "手順:" || t.startsWith("材料") || t.startsWith("手順")) {
              return <div key={j} style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12, color: "var(--accent-dark)", marginTop: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>{t}</div>;
            }
            if (/^\d+\./.test(t)) {
              return <div key={j} style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 4, display: "flex", gap: 6 }}>
                <span style={{ color: "var(--accent)", fontWeight: 700, flexShrink: 0 }}>{t.match(/^\d+/)?.[0]}.</span>
                <span>{t.replace(/^\d+\.\s*/, "")}</span>
              </div>;
            }
            // Table row → render as simple line
            if (t.startsWith("|") && t.endsWith("|")) {
              const cells = t.split("|").map(c => c.trim()).filter(Boolean);
              return <div key={j} style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{cells.join("　")}</div>;
            }
            // Strip italic/bold markdown markers
            const cleaned = t.replace(/^\*+|\*+$/g, "").trim();
            return <div key={j} style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{cleaned}</div>;
          })}
        </div>

        {/* ── 作った！評価エリア ── */}
        {onRate && (
          <div style={{ borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            {justSaved ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#4a7840", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13 }}>
                <span>✓</span> 記録を保存しました！
              </div>
            ) : savedRating ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>{RATING_OPTIONS.find(r => r.value === savedRating)?.emoji}</span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                  {RATING_OPTIONS.find(r => r.value === savedRating)?.label}で保存済み
                </span>
                <button onClick={() => setRatingOpen(true)} style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>変更</button>
              </div>
            ) : ratingOpen ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>どうでしたか？</span>
                {RATING_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => handleRate(opt.value)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 10px", borderRadius: 10, border: "1px solid var(--border)", background: "#fff", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.transform = "scale(1.1)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.transform = ""; }}
                  >
                    <span style={{ fontSize: 22 }}>{opt.emoji}</span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>{opt.label}</span>
                  </button>
                ))}
                <button onClick={() => setRatingOpen(false)} style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>✕</button>
              </div>
            ) : (
              <button onClick={() => setRatingOpen(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 20, border: "1px solid var(--border)", background: "#fff", color: "var(--text-secondary)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-subtle)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
              >
                <span>✓</span> 作った！
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RecipeSection({ text, imageResults, processImageResults, ratings, onRate }: {
  text: string;
  imageResults: Record<string, string | null>;
  processImageResults: Record<string, string | null>;
  ratings?: Record<string, number>;
  onRate?: (dish: string, stars: 1 | 2 | 3, body: string[]) => void;
}) {
  const lines = text.split("\n");
  const blocks: { title: string; body: string[] }[] = [];
  let cur: { title: string; body: string[] } | null = null;

  for (const line of lines) {
    const t = line.trim();
    const isBoldTitle = t.startsWith("**") && t.endsWith("**") && t.length > 4;
    if (isBoldTitle) {
      if (cur) blocks.push(cur);
      cur = { title: t.slice(2, -2), body: [] };
    } else if (cur) {
      cur.body.push(line);
    }
  }
  if (cur) blocks.push(cur);

  if (blocks.length === 0) {
    return <div style={{ fontSize: 13, lineHeight: 1.9, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{text}</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {blocks.map((b, i) => (
        <RecipeBlock
          key={i}
          title={b.title}
          body={b.body}
          imageUrl={imageResults[b.title]}
          imageLoading={!(b.title in imageResults)}
          processImageUrl={processImageResults[b.title]}
          processImageLoading={!(b.title in processImageResults)}
          savedRating={ratings?.[b.title]}
          onRate={onRate ? (stars, body) => onRate(b.title, stars, body) : undefined}
        />
      ))}
    </div>
  );
}

// ─── History Modal ───────────────────────────────────────────────
function HistoryRecipeDetail({ body }: { body: string[] }) {
  return (
    <div style={{ background: "var(--bg-subtle)", borderRadius: 12, padding: "14px 16px", marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
      {body.map((line, j) => {
        const t = line.trim();
        if (!t) return null;
        if (t === "---" || /^\|[-| ]+\|$/.test(t)) return null;
        if (t.startsWith("📊")) {
          // 栄養成分行をシンプルに表示
          return <div key={j} style={{ fontSize: 12, color: "var(--accent-dark)", fontFamily: "var(--font-heading)", fontWeight: 700 }}>{t}</div>;
        }
        if (t === "材料:" || t === "手順:" || t.startsWith("材料") || t.startsWith("手順")) {
          return <div key={j} style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 11, color: "var(--accent-dark)", marginTop: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>{t}</div>;
        }
        if (/^\d+\./.test(t)) {
          return <div key={j} style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7, display: "flex", gap: 5 }}>
            <span style={{ color: "var(--accent)", fontWeight: 700, flexShrink: 0 }}>{t.match(/^\d+/)?.[0]}.</span>
            <span>{t.replace(/^\d+\.\s*/, "")}</span>
          </div>;
        }
        const cleaned = t.replace(/^\*+|\*+$/g, "").trim();
        if (!cleaned) return null;
        return <div key={j} style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>{cleaned}</div>;
      })}
    </div>
  );
}

function HistoryModal({ records, onClear, onClose }: { records: CookedRecord[]; onClear: () => void; onClose: () => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 540, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 -8px 40px rgba(0,0,0,0.12)" }}>
        <div style={{ padding: "20px 24px 12px", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 4, margin: "0 auto 16px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16, color: "var(--text-primary)", margin: 0 }}>
              📓 料理記録
            </h3>
            {records.length > 0 && (
              <button onClick={onClear}
                style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                全件削除
              </button>
            )}
          </div>
        </div>
        <div style={{ overflowY: "auto", padding: "0 24px 36px" }}>
          {records.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🍳</div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, marginBottom: 6 }}>まだ記録がありません</div>
              <div style={{ fontSize: 12 }}>レシピの「作った！」ボタンで記録できます</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {records.map(r => {
                const opt = RATING_OPTIONS.find(o => o.value === r.rating);
                const date = new Date(r.cookedAt);
                const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
                const isOpen = expandedId === r.id;
                const hasRecipe = r.recipeBody && r.recipeBody.length > 0;
                return (
                  <div key={r.id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: isOpen ? 14 : 0 }}>
                    <button
                      onClick={() => setExpandedId(isOpen ? null : r.id)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 0", background: "none", border: "none", cursor: hasRecipe ? "pointer" : "default", textAlign: "left" }}
                    >
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{opt?.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.dishName}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{opt?.label}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{dateStr}</div>
                        {hasRecipe && (
                          <div style={{ fontSize: 11, color: "var(--accent-dark)", fontFamily: "var(--font-heading)", fontWeight: 700, background: "var(--accent-light)", borderRadius: 6, padding: "2px 8px", display: "flex", alignItems: "center", gap: 3 }}>
                            {isOpen ? "▲" : "▼"} レシピ
                          </div>
                        )}
                      </div>
                    </button>
                    {isOpen && hasRecipe && <HistoryRecipeDetail body={r.recipeBody!} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ShoppingList({ text, checked, onToggle }: {
  text: string;
  checked: Set<string>;
  onToggle: (item: string) => void;
}) {
  const lines = text.split("\n");
  const checkedCount = [...checked].filter(k => text.includes(k)).length;
  const totalItems = lines.filter(l => l.trim().startsWith("-")).length;

  return (
    <div>
      {/* Progress bar */}
      {totalItems > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>購入済み</span>
            <span style={{ fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-heading)", fontWeight: 700 }}>{checkedCount} / {totalItems}</span>
          </div>
          <div style={{ height: 4, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#4a7840", borderRadius: 4, width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%`, transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {lines.map((line, i) => {
          const t = line.trim();
          if (!t) return null;
          // Category header: 【野菜】 or **【野菜】**
          if (t.startsWith("【") || t.startsWith("**【")) {
            const cat = t.replace(/\*\*/g, "");
            return (
              <div key={i} style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 11, color: "#2f5228", background: "#deecd6", borderRadius: 6, padding: "4px 10px", marginTop: i === 0 ? 0 : 14, display: "inline-flex", letterSpacing: "0.04em" }}>
                {cat}
              </div>
            );
          }
          if (t.startsWith("-")) {
            const itemText = t.replace(/^-\s*/, "");
            const isChecked = checked.has(itemText);
            return (
              <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, cursor: "pointer", transition: "background 0.15s", background: isChecked ? "var(--bg-subtle)" : "transparent" }}
                onMouseEnter={e => { if (!isChecked) e.currentTarget.style.background = "var(--bg-subtle)"; }}
                onMouseLeave={e => { if (!isChecked) e.currentTarget.style.background = "transparent"; }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggle(itemText)}
                  style={{ width: 17, height: 17, accentColor: "#4a7840", cursor: "pointer", flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, color: isChecked ? "var(--text-muted)" : "var(--text-primary)", textDecoration: isChecked ? "line-through" : "none", transition: "all 0.2s" }}>
                  {itemText}
                </span>
              </label>
            );
          }
          return <div key={i} style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 4 }}>{t}</div>;
        }).filter(Boolean)}
      </div>

      {checkedCount > 0 && (
        <button
          onClick={() => {
            lines.filter(l => l.trim().startsWith("-")).forEach(l => onToggle(l.trim().replace(/^-\s*/, "")));
          }}
          style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}
        >
          チェックをすべてリセット
        </button>
      )}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────
function AppContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";

  const [ready, setReady] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [trialStatus, setTrialStatus] = useState<{ trialActive: boolean; daysLeft: number; subscribed: boolean } | null>(null);

  // Input state
  const [ingredients, setIngredients] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [familySize, setFamilySize] = useState("4");
  const [disliked, setDisliked] = useState("");
  const [style, setStyle] = useState("何でも");
  const days = "today";
  const [noKnife, setNoKnife] = useState(false);
  const [cookTime, setCookTime] = useState<"quick" | "normal" | "slow">("normal");

  // Output state
  const [rawOutput, setRawOutput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [parsedOutput, setParsedOutput] = useState<ParsedOutput | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("schedule");
  const [view, setView] = useState<"form" | "result">("form");

  // Shopping list checkboxes
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // Cooked records (保存した料理)
  const [cookedRecords, setCookedRecords] = useState<CookedRecord[]>([]);
  const [dishRatings, setDishRatings] = useState<Record<string, number>>({}); // current session ratings

  // Share modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMenuText, setShareMenuText] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [shareImageDataUrl, setShareImageDataUrl] = useState<string | null>(null);
  const [shareImageFile, setShareImageFile] = useState<File | null>(null);

  // History panel
  const [showHistory, setShowHistory] = useState(false);

  // UI
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTip, setShowTip] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [wakeLockOn, setWakeLockOn] = useState(false);

  // Image generation: keyed by dish name. undefined = pending, null = failed, string = url
  const [imageResults, setImageResults] = useState<Record<string, string | null>>({});
  const [processImageResults, setProcessImageResults] = useState<Record<string, string | null>>({});
  const pendingImagesRef = useRef<Set<string>>(new Set());
  const pendingProcessImagesRef = useRef<Set<string>>(new Set());
  const imagePromisesRef = useRef<Promise<void>[]>([]);
  const [generatingPhase, setGeneratingPhase] = useState<"text" | "image">("text");

  const triggerImageGen = (dish: string) => {
    if (pendingImagesRef.current.has(dish)) return;
    pendingImagesRef.current.add(dish);
    const p: Promise<void> = fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dish }),
    })
      .then(r => r.json())
      .then(d => {
        const url = d.url || (d.b64 ? `data:image/png;base64,${d.b64}` : null) || null;
        setImageResults(prev => ({ ...prev, [dish]: url }));
      })
      .catch(() => {
        setImageResults(prev => ({ ...prev, [dish]: null }));
      });
    imagePromisesRef.current.push(p);
  };

  const triggerProcessImageGen = (dish: string, steps?: string[]) => {
    if (pendingProcessImagesRef.current.has(dish)) return;
    pendingProcessImagesRef.current.add(dish);
    fetch("/api/generate-process-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dish, steps }),
    })
      .then(r => r.json())
      .then(d => {
        const url = d.url || (d.b64 ? `data:image/png;base64,${d.b64}` : null) || null;
        setProcessImageResults(prev => ({ ...prev, [dish]: url }));
      })
      .catch(() => {
        setProcessImageResults(prev => ({ ...prev, [dish]: null }));
      });
  };

  // Initialize from localStorage
  useEffect(() => {
    const id = getOrCreateDeviceId();
    setDeviceId(id);

    try {
      const saved = localStorage.getItem("meshilist_inputs");
      if (saved) {
        const p = JSON.parse(saved);
        if (p.ingredients !== undefined) setIngredients(p.ingredients);
        if (p.selectedChips)            setSelectedChips(p.selectedChips);
        if (p.familySize)               setFamilySize(p.familySize);
        if (p.disliked !== undefined)   setDisliked(p.disliked);
        if (p.style)                    setStyle(p.style);
        if (p.noKnife !== undefined)    setNoKnife(p.noKnife);
        if (p.cookTime)                 setCookTime(p.cookTime);
      }
      const savedChecked = localStorage.getItem("meshilist_checked");
      if (savedChecked) setCheckedItems(new Set(JSON.parse(savedChecked)));
      const savedCooked = localStorage.getItem("meshilist_cooked");
      if (savedCooked) setCookedRecords(JSON.parse(savedCooked));
    } catch {}

    const hasVisited = localStorage.getItem("meshilist_visited");
    if (!hasVisited) { setShowTip(true); localStorage.setItem("meshilist_visited", "1"); }

    setReady(true);

    fetch("/api/trial", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: id }),
    }).then(r => r.json()).then(setTrialStatus).catch(() => {});
  }, []);

  // Persist inputs
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("meshilist_inputs", JSON.stringify({ ingredients, selectedChips, familySize, disliked, style, noKnife, cookTime }));
  }, [ready, ingredients, selectedChips, familySize, disliked, style, days, noKnife]);

  // Parse output when generation finishes
  useEffect(() => {
    if (!generating && rawOutput) {
      setParsedOutput(parseOutput(rawOutput));
    } else if (!rawOutput) {
      setParsedOutput(null);
    }
  }, [generating, rawOutput]);

  const toggleCheckedItem = (item: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item); else next.add(item);
      localStorage.setItem("meshilist_checked", JSON.stringify([...next]));
      return next;
    });
  };

  const allIngredients = [
    ...selectedChips,
    ...ingredients.split(/[,、，\s]+/).filter(Boolean),
  ].filter((v, i, a) => a.indexOf(v) === i).join("、");

  const handleGenerate = async () => {
    if (!trialStatus) return;
    if (!trialStatus.trialActive && !trialStatus.subscribed) { setShowSubscribeModal(true); return; }
    if (!allIngredients.trim()) { alert("食材を入力してください"); return; }

    setGenerating(true);
    setGeneratingPhase("text");
    setView("result");
    setRawOutput("");
    setParsedOutput(null);
    setActiveTab("recipe");
    setCheckedItems(new Set());
    setDishRatings({});
    setImageResults({});
    pendingImagesRef.current = new Set();
    imagePromisesRef.current = [];
    localStorage.removeItem("meshilist_checked");
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: allIngredients, familySize, disliked, style, days, deviceId, noKnife, cookTime }),
        signal: abortRef.current.signal,
      });
      if (res.status === 402) { setShowSubscribeModal(true); return; }
      if (!res.ok || !res.body) throw new Error("failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulated = "";
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) {
          accumulated += decoder.decode(value, { stream: true });
          setRawOutput(accumulated);
          // Detect recipe titles in stream and start dish photo generation in parallel
          const recipeMatch = accumulated.match(/###\s*🍳[^\n]*\n([\s\S]*?)(?=###\s*📅|###\s*🛒|$)/);
          if (recipeMatch) {
            for (const match of recipeMatch[1].matchAll(/\*\*(.+?)\*\*/g)) {
              triggerImageGen(match[1]);
            }
          }
        }
      }
      // After full generation, extract actual steps per dish and trigger process image gen
      const recipeSectionMatch = accumulated.match(/###\s*🍳[^\n]*\n([\s\S]*?)(?=###\s*📅|###\s*🛒|$)/);
      if (recipeSectionMatch) {
        const recipeLines = recipeSectionMatch[1].split("\n");
        let currentDish: string | null = null;
        let inSteps = false;
        const dishSteps: Record<string, string[]> = {};
        for (const line of recipeLines) {
          const t = line.trim();
          const isBoldTitle = t.startsWith("**") && t.endsWith("**") && t.length > 4;
          if (isBoldTitle) {
            currentDish = t.slice(2, -2);
            dishSteps[currentDish] = [];
            inSteps = false;
          } else if (currentDish) {
            if (t === "手順:" || t.startsWith("手順")) {
              inSteps = true;
            } else if (inSteps && /^\d+\./.test(t)) {
              dishSteps[currentDish].push(t.replace(/^\d+\.\s*/, ""));
            }
          }
        }
        for (const [dish, steps] of Object.entries(dishSteps)) {
          triggerProcessImageGen(dish, steps);
        }
      }
      // Wait for all image generations to complete
      setGeneratingPhase("image");
      await Promise.all(imagePromisesRef.current);
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") alert("エラーが発生しました。もう一度お試しください。");
    } finally {
      setGenerating(false);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  };

  const handleStop = () => { abortRef.current?.abort(); setGenerating(false); };

  const saveCookedRecord = (dishName: string, stars: 1 | 2 | 3, recipeBody?: string[]) => {
    const record: CookedRecord = { id: crypto.randomUUID(), dishName, cookedAt: new Date().toISOString(), rating: stars, recipeBody };
    setCookedRecords(prev => {
      const next = [record, ...prev].slice(0, 50); // 最大50件
      localStorage.setItem("meshilist_cooked", JSON.stringify(next));
      return next;
    });
    setDishRatings(prev => ({ ...prev, [dishName]: stars }));
  };

  const handleShare = () => {
    if (!parsedOutput) return;
    const dishNames = parsedOutput.recipe
      .match(/\*\*(.+?)\*\*/g)?.map(s => s.replace(/\*\*/g, "")) ?? [];
    const menuLine = dishNames.slice(0, 5).join("・") + (dishNames.length > 5 ? "など" : "");
    const text = `🍽️ 今週のAI献立\n${menuLine}\n\nメシリストでかんたん献立生成✨\n#メシリスト #AI献立 #今日の献立`;
    setShareMenuText(text);
    setShareImageDataUrl(null);
    setShareImageFile(null);
    setShowShareModal(true);
  };

  const handleShareImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShareImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setShareImageDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleShareX = () => {
    const text = encodeURIComponent(shareMenuText);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };
  const handleShareLine = () => {
    const text = encodeURIComponent(shareMenuText);
    window.open(`https://social-plugins.line.me/lineit/share?text=${text}`, "_blank");
  };
  const handleShareNative = async () => {
    try {
      const shareData: ShareData = { title: "今週のAI献立", text: shareMenuText };
      if (shareImageFile && navigator.canShare?.({ files: [shareImageFile] })) {
        shareData.files = [shareImageFile];
      }
      await navigator.share(shareData);
    } catch { /* キャンセルor非対応 */ }
  };
  const handleShareCopy = async () => {
    await navigator.clipboard.writeText(shareMenuText);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const toggleWakeLock = async () => {
    if (!("wakeLock" in navigator)) return;
    if (wakeLockOn) {
      await wakeLockRef.current?.release();
      wakeLockRef.current = null;
      setWakeLockOn(false);
    } else {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        wakeLockRef.current.addEventListener("release", () => setWakeLockOn(false));
        setWakeLockOn(true);
      } catch {}
    }
  };

  const handleCopy = async () => {
    const text = parsedOutput
      ? [parsedOutput.schedule, parsedOutput.recipe, parsedOutput.shopping].filter(Boolean).join("\n\n")
      : rawOutput;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubscribe = async () => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch { alert("エラーが発生しました。"); }
  };

  const tabHasContent = (key: TabKey) => {
    if (!parsedOutput) return false;
    return parsedOutput[key].length > 0;
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(245,243,238,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)", padding: "0 20px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none" }}>
            <KoocaBowlIcon size={34} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                メシ<span style={{ color: "var(--accent)" }}>リスト</span>
              </span>
              <span style={{ fontFamily: "var(--font-pacifico)", fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.02em" }}>
                by kooca
              </span>
            </div>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a href="/recipes" style={{
              padding: "5px 12px", borderRadius: 7, fontSize: 12,
              fontFamily: "var(--font-heading)", fontWeight: 600,
              color: "var(--text-secondary)", textDecoration: "none",
              border: "1px solid var(--border)", background: "#fff",
            }}>
              📖 レシピ集
            </a>
            <button onClick={() => setShowHistory(v => !v)} style={{
              padding: "5px 12px", borderRadius: 7, fontSize: 12,
              fontFamily: "var(--font-heading)", fontWeight: 600,
              color: cookedRecords.length > 0 ? "var(--accent-dark)" : "var(--text-secondary)",
              background: cookedRecords.length > 0 ? "var(--accent-light)" : "#fff",
              border: `1px solid ${cookedRecords.length > 0 ? "rgba(230,149,26,0.3)" : "var(--border)"}`,
              cursor: "pointer", position: "relative", display: "flex", alignItems: "center", gap: 4,
            }}>
              📓 記録
              {cookedRecords.length > 0 && (
                <span style={{ background: "var(--accent)", color: "#fff", borderRadius: 10, padding: "0px 5px", fontSize: 10, fontWeight: 700 }}>
                  {cookedRecords.length}
                </span>
              )}
            </button>
          {trialStatus && (
            trialStatus.subscribed ? (
              <div style={{ background: "#deecd6", borderRadius: 8, padding: "4px 12px", fontSize: 12, color: "#2f5228", fontFamily: "var(--font-heading)", fontWeight: 700 }}>✓ サブスク中</div>
            ) : trialStatus.trialActive ? (
              <div style={{ background: "var(--bg-subtle)", borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-heading)", fontWeight: 600, border: "1px solid var(--border)" }}>
                無料期間 残<span style={{ color: "var(--accent)", fontSize: 14 }}>{trialStatus.daysLeft}</span>日
              </div>
            ) : (
              <button onClick={() => setShowSubscribeModal(true)} style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontFamily: "var(--font-heading)", fontWeight: 700, cursor: "pointer" }}>
                プランに登録
              </button>
            )
          )}
          </div>
        </div>
      </nav>

      {/* Checkout success banner */}
      {checkoutSuccess && (
        <div style={{ background: "var(--accent)", color: "#fff", textAlign: "center", padding: "12px", fontSize: 14, fontFamily: "var(--font-heading)", fontWeight: 600 }}>
          ご登録ありがとうございます！サブスクリプションが有効になりました 🎉
        </div>
      )}

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px 60px" }}>

        {/* First-time tip */}
        {showTip && (
          <div style={{ background: "#deecd6", borderRadius: 14, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 12, border: "1px solid rgba(74,120,64,0.2)" }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>🌿</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "#2f5228", marginBottom: 4 }}>はじめての方へ</div>
              <div style={{ fontSize: 13, color: "#2f5228", lineHeight: 1.7 }}>
                冷蔵庫にある食材を選んで「献立を生成する」を押すだけ。献立・レシピ・買い物リストがまとめて出てきます。
              </div>
            </div>
            <button onClick={() => setShowTip(false)} style={{ background: "none", border: "none", color: "var(--accent-dark)", fontSize: 18, cursor: "pointer", flexShrink: 0, opacity: 0.6, lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "clamp(20px, 4vw, 28px)", letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 4 }}>
            今週の献立を生成する
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>食材と条件を入力して、献立・レシピ・買い物リストを一括生成。</p>
        </div>

        {/* Input panel */}
        {view === "form" && <div style={{ background: "#fff", borderRadius: 20, padding: "28px", border: "1px solid var(--border)", marginBottom: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

            {/* Ingredients */}
            <div>
              <label style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
                冷蔵庫にある食材
                <span style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "var(--text-muted)", fontSize: 12, marginLeft: 8 }}>チップをタップ or テキスト入力</span>
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                {INGREDIENT_CHIPS.map(group => (
                  <div key={group.category}>
                    <div style={{ fontSize: 10, fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", marginBottom: 5 }}>{group.category}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {group.items.map(chip => {
                        const selected = selectedChips.includes(chip);
                        return (
                          <button key={chip} className="chip-btn" onClick={() => setSelectedChips(prev => selected ? prev.filter(c => c !== chip) : [...prev, chip])}
                            style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`, background: selected ? "var(--accent-light)" : "var(--bg-subtle)", color: selected ? "var(--accent-dark)" : "var(--text-secondary)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: selected ? 600 : 400 }}>
                            {chip}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <input
                className="field"
                style={{ borderRadius: 10 }}
                placeholder="上記以外の食材を追加（例: ニラ、しらす、油揚げ）"
                value={ingredients}
                onChange={e => setIngredients(e.target.value)}
              />
              {allIngredients && (
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                  選択中: <span style={{ color: "var(--accent-dark)", fontWeight: 600 }}>{allIngredients}</span>
                </div>
              )}
            </div>

            {/* Family size + disliked */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 8 }}>家族人数</label>
                <select className="field" style={{ borderRadius: 10 }} value={familySize} onChange={e => setFamilySize(e.target.value)}>
                  {["1", "2", "3", "4", "5以上"].map(n => <option key={n} value={n}>{n}人</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 8 }}>
                  苦手食材
                  <span style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "var(--text-muted)", fontSize: 12, marginLeft: 6 }}>任意</span>
                </label>
                <input className="field" style={{ borderRadius: 10 }} placeholder="例: 納豆、セロリ" value={disliked} onChange={e => setDisliked(e.target.value)} />
              </div>
            </div>

            {/* Style */}
            <div>
              <label style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>料理スタイル</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {STYLE_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setStyle(opt.value)}
                    style={{ padding: "9px 20px", borderRadius: 10, border: `1px solid ${style === opt.value ? "var(--accent)" : "var(--border)"}`, background: style === opt.value ? "var(--accent-light)" : "var(--bg-subtle)", color: style === opt.value ? "var(--accent-dark)" : "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: 13, cursor: "pointer", transition: "all 0.15s", fontWeight: style === opt.value ? 700 : 400 }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cook time */}
            <div>
              <label style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>調理時間の目安</label>
              <div style={{ display: "flex", gap: 8 }}>
                {COOK_TIME_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setCookTime(opt.value as "quick" | "normal" | "slow")}
                    style={{ flex: 1, padding: "10px 8px", borderRadius: 10, border: `1px solid ${cookTime === opt.value ? "var(--accent)" : "var(--border)"}`, background: cookTime === opt.value ? "var(--accent-light)" : "var(--bg-subtle)", color: cookTime === opt.value ? "var(--accent-dark)" : "var(--text-secondary)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span>{opt.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 400, fontFamily: "var(--font-body)", opacity: 0.7 }}>{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div>
              <label style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>オプション</label>
              <button
                onClick={() => setNoKnife(v => !v)}
                style={{
                  padding: "9px 20px", borderRadius: 10, border: `1px solid ${noKnife ? "#4a7840" : "var(--border)"}`,
                  background: noKnife ? "#deecd6" : "var(--bg-subtle)",
                  color: noKnife ? "#2f5228" : "var(--text-secondary)",
                  fontFamily: "var(--font-body)", fontSize: 13, cursor: "pointer",
                  transition: "all 0.15s", fontWeight: noKnife ? 700 : 400,
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <span>✂️</span>
                <span>包丁いらずレシピのみ</span>
                {noKnife && <span style={{ fontSize: 11, background: "#4a7840", color: "#fff", borderRadius: 4, padding: "1px 6px", fontFamily: "var(--font-heading)", fontWeight: 700 }}>ON</span>}
              </button>
              {noKnife && (
                <p style={{ fontSize: 11, color: "#4a7840", marginTop: 6 }}>
                  キッチンバサミや手でちぎれる食材を使ったレシピを提案します
                </p>
              )}
            </div>

            {/* Generate button */}
            {generating ? (
              <button onClick={handleStop}
                style={{ width: "100%", padding: "16px", borderRadius: 12, border: "none", background: "#1a1a1a", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <span className="animate-spin-sm" style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", display: "inline-block" }} />
                生成中... （タップで停止）
              </button>
            ) : !trialStatus ? (
              <button disabled
                style={{ width: "100%", padding: "16px", borderRadius: 12, border: "none", background: "var(--bg-subtle)", color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span className="animate-spin-sm" style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.1)", borderTopColor: "var(--text-muted)", display: "inline-block" }} />
                読み込み中...
              </button>
            ) : (
              <button className="press-btn" onClick={handleGenerate}
                style={{ width: "100%", padding: "16px", borderRadius: 12, border: "none", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 16px rgba(230,149,26,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(230,149,26,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(230,149,26,0.3)"; }}>
                <KoocaBowlIcon size={22} />
                献立を生成する
              </button>
            )}
          </div>
        </div>}

        {/* ── Output Panel (Full Screen Overlay) ── */}
        {view === "result" && (
          <div style={{ position: "fixed", left: 0, right: 0, top: 56, bottom: 0, background: "var(--bg)", zIndex: 40, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "rgba(245,243,238,0.96)", backdropFilter: "blur(8px)", flexShrink: 0 }}>
              <button onClick={() => setView("form")}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-secondary)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                ← 条件を変える
              </button>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                {generating
                  ? <><span className="animate-blink" style={{ color: "var(--accent)", fontSize: 10 }}>●</span> 生成中…</>
                  : "✓ 生成完了"}
              </span>
              {!generating && rawOutput && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleGenerate}
                    style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-secondary)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                    再生成
                  </button>
                  <button onClick={handleShare}
                    style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-secondary)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    📤 シェア
                  </button>
                  <button onClick={handleCopy}
                    style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border)", background: copied ? "var(--accent-light)" : "var(--bg-subtle)", color: copied ? "var(--accent-dark)" : "var(--text-secondary)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 12, cursor: "pointer", transition: "all 0.15s" }}>
                    {copied ? "コピー済 ✓" : "全コピー"}
                  </button>
                </div>
              )}
              {generating && <div style={{ width: 80 }} />}
            </div>

            {/* Streaming: show placeholder */}
            {generating && (
              <div style={{ padding: "40px 20px 36px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                {/* Walking person illustration */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <div className="animate-walk">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/kooca-walk-transparent.png" alt="歩く人" style={{ height: 72 }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--accent-dark)", letterSpacing: "0.1em" }}>{generatingPhase === "image" ? "イラストを描いています" : "コツコツ考えています"}</span>
                    {[0, 1, 2].map(i => (
                      <span key={i} className="animate-blink" style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--accent)", display: "inline-block", animationDelay: `${i * 0.3}s` }} />
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {["📅 献立表", "🍳 レシピ", "🛒 買い物リスト"].map((label, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--bg-subtle)", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                      <span className="animate-blink" style={{ color: "var(--accent)", animationDelay: `${i * 0.3}s` }}>●</span>
                      {label}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.8, margin: 0 }}>
                  {generatingPhase === "image" ? "料理のイラストを生成中..." : "献立表・レシピ・買い物リストをまとめて生成中"}
                </p>
                <div style={{ width: "100%", maxWidth: 260, height: 3, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                  <div className="animate-progress-bar" style={{ height: "100%", background: "linear-gradient(90deg, var(--accent), var(--accent-dark))", borderRadius: 4 }} />
                </div>
              </div>
            )}

            {/* Done: show tabs */}
            {!generating && parsedOutput && (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                {/* Tab bar */}
                <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 20px", flexShrink: 0 }}>
                  {TABS.filter(tab => tab.key !== "schedule").map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      style={{ padding: "12px 16px", border: "none", borderBottom: `2px solid ${activeTab === tab.key ? "#4a7840" : "transparent"}`, background: "none", color: activeTab === tab.key ? "#4a7840" : "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "color 0.15s", display: "flex", alignItems: "center", gap: 6, opacity: tabHasContent(tab.key) ? 1 : 0.4 }}>
                      {tab.icon} {tab.label}
                      {tab.key === "shopping" && checkedItems.size > 0 && (
                        <span style={{ background: "#4a7840", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>
                          {checkedItems.size}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div style={{ padding: "24px", flex: 1, overflowY: "auto" }}>
                  {activeTab === "schedule" && parsedOutput.schedule && (
                    <ScheduleSection text={parsedOutput.schedule} />
                  )}
                  {activeTab === "recipe" && parsedOutput.recipe && (
                    <>
                      <button onClick={toggleWakeLock}
                        style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16, padding: "7px 14px", borderRadius: 20, border: `1px solid ${wakeLockOn ? "#f97316" : "var(--border)"}`, background: wakeLockOn ? "#fff7ed" : "var(--bg-subtle)", color: wakeLockOn ? "#c2410c" : "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 12, cursor: "wakeLock" in navigator ? "pointer" : "default", opacity: "wakeLock" in navigator ? 1 : 0.4 }}>
                        <span style={{ fontSize: 14 }}>{wakeLockOn ? "📲" : "📵"}</span>
                        {wakeLockOn ? "画面常時点灯 ON" : "画面を暗くしない"}
                        <span style={{ marginLeft: 2, width: 28, height: 16, borderRadius: 8, background: wakeLockOn ? "#f97316" : "var(--border)", display: "inline-flex", alignItems: "center", padding: "0 2px", transition: "background 0.2s", flexShrink: 0 }}>
                          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff", transform: wakeLockOn ? "translateX(12px)" : "translateX(0)", transition: "transform 0.2s", display: "block" }} />
                        </span>
                      </button>
                      <RecipeSection text={parsedOutput.recipe} imageResults={imageResults} processImageResults={processImageResults} ratings={dishRatings} onRate={(dish, stars, body) => saveCookedRecord(dish, stars, body)} />
                    </>
                  )}
                  {activeTab === "shopping" && parsedOutput.shopping && (
                    <ShoppingList
                      text={parsedOutput.shopping}
                      checked={checkedItems}
                      onToggle={toggleCheckedItem}
                    />
                  )}
                  {/* Fallback: nothing parsed */}
                  {!parsedOutput[activeTab] && (
                    <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "32px 0" }}>
                      このセクションは生成されませんでした。
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trial expired banner */}
        {trialStatus && !trialStatus.trialActive && !trialStatus.subscribed && !showSubscribeModal && !rawOutput && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 4 }}>無料トライアル期間が終了しました</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>¥480/月で献立生成を無制限に使い続けられます</div>
            </div>
            <button onClick={() => setShowSubscribeModal(true)}
              style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
              プランに登録する →
            </button>
          </div>
        )}
      </div>

      {/* ── Share Modal ── */}
      {showShareModal && (
        <div onClick={() => setShowShareModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 540, padding: "28px 24px 40px", boxShadow: "0 -8px 40px rgba(0,0,0,0.12)" }}>
            {/* ハンドル */}
            <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 4, margin: "0 auto 20px" }} />
            <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16, color: "var(--text-primary)", marginBottom: 4, textAlign: "center" }}>
              献立をシェアする
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginBottom: 20 }}>みんなに今週の献立を教えよう</p>

            {/* シェアカード（スクリーンショット用） */}
            <div style={{ background: "linear-gradient(135deg, #f5a623 0%, #e6951a 50%, #c87c0a 100%)", borderRadius: 16, overflow: "hidden", marginBottom: 14, position: "relative" }}>
              {/* 料理写真（ユーザーが添付した場合） */}
              {shareImageDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shareImageDataUrl} alt="料理写真" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} />
              )}
              <div style={{ padding: "18px 20px", position: "relative" }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 13, color: "rgba(255,255,255,0.9)", letterSpacing: "0.06em" }}>メシリスト AI献立</span>
                  <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 20, padding: "1px 8px", fontSize: 10, color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700 }}>by kooca</span>
                </div>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 15, color: "#fff", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {shareMenuText.split("\n").slice(1, 3).join("\n")}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>冷蔵庫にある食材でAIが作った献立✨</div>
              </div>
            </div>

            {/* 写真を追加 */}
            <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderRadius: 12, border: "1.5px dashed var(--border)", background: "var(--bg-subtle)", cursor: "pointer", marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>{shareImageDataUrl ? "🔄" : "📷"}</span>
              <div>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
                  {shareImageDataUrl ? "写真を変更する" : "料理の写真を追加する（任意）"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>カメラで撮影 or カメラロールから選択</div>
              </div>
              {shareImageDataUrl && (
                <button onClick={e => { e.preventDefault(); setShareImageDataUrl(null); setShareImageFile(null); }}
                  style={{ marginLeft: "auto", fontSize: 18, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", lineHeight: 1 }}>×</button>
              )}
              <input type="file" accept="image/*" capture="environment" onChange={handleShareImageSelect} style={{ display: "none" }} />
            </label>
            <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginBottom: 14 }}>📸 カードをスクリーンショットしてインスタに投稿しよう！</p>

            {/* シェアボタン */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {"share" in navigator && (
                <button onClick={handleShareNative}
                  style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #f5a623, #e6951a)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  📤 Instagram / その他アプリでシェア
                </button>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button onClick={handleShareX}
                  style={{ padding: "12px", borderRadius: 12, border: "1px solid #e1e8ed", background: "#000", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  𝕏 Xに投稿
                </button>
                <button onClick={handleShareLine}
                  style={{ padding: "12px", borderRadius: 12, border: "none", background: "#06c755", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  💬 LINEで送る
                </button>
              </div>
              <button onClick={handleShareCopy}
                style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid var(--border)", background: shareCopied ? "var(--accent-light)" : "var(--bg-subtle)", color: shareCopied ? "var(--accent-dark)" : "var(--text-secondary)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.15s" }}>
                {shareCopied ? "✓ コピーしました" : "📋 テキストをコピー"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── History Modal ── */}
      {showHistory && <HistoryModal records={cookedRecords} onClear={() => { setCookedRecords([]); localStorage.removeItem("meshilist_cooked"); }} onClose={() => setShowHistory(false)} />}

      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <div onClick={() => setShowSubscribeModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 24, padding: "40px 36px", maxWidth: 440, width: "100%", boxShadow: "0 16px 64px rgba(0,0,0,0.16)" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
              <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 22, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 8 }}>
                メシリストを続ける
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                無料トライアルが終了しました。サブスクに登録すると献立生成が無制限で使えます。
              </p>
            </div>
            <div style={{ background: "var(--bg-subtle)", borderRadius: 14, padding: "20px", marginBottom: 24 }}>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 36, color: "var(--text-primary)", textAlign: "center", marginBottom: 4 }}>
                ¥480<span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-muted)" }}>/月</span>
              </div>
              <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {["献立生成 無制限", "1週間分まとめてプランニング", "買い物リスト（チェック機能つき）", "いつでも解約OK"].map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--accent)", fontWeight: 700 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={handleSubscribe}
              style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 10 }}>
              ¥480/月で登録する →
            </button>
            <button onClick={() => setShowSubscribeModal(false)}
              style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid var(--border)", background: "none", color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppPage() {
  return <Suspense><AppContent /></Suspense>;
}
