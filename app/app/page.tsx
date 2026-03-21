"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";

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
  imageUrl?: string | null;
}

// ─── Constants ───────────────────────────────────────────────────
const ALLERGY_CHIPS = [
  { emoji: "🥚", label: "卵" },
  { emoji: "🥛", label: "乳製品" },
  { emoji: "🌾", label: "小麦" },
  { emoji: "🦐", label: "えび" },
  { emoji: "🦀", label: "かに" },
  { emoji: "🍜", label: "そば" },
  { emoji: "🥜", label: "落花生" },
  { emoji: "🫘", label: "大豆" },
  { emoji: "🐟", label: "魚介類" },
  { emoji: "🐷", label: "豚肉" },
  { emoji: "🐄", label: "牛肉" },
  { emoji: "🍑", label: "果物類" },
  { emoji: "⚪", label: "ごま" },
  { emoji: "🌰", label: "ナッツ類" },
];

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
const DISH_COUNT_OPTIONS = [
  { value: "1", label: "主菜のみ", sub: "1品" },
  { value: "2", label: "主菜＋副菜1", sub: "2品" },
  { value: "3", label: "主菜＋副菜2", sub: "3品" },
  { value: "4", label: "主菜＋副菜3", sub: "4品" },
];
const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "schedule", label: "献立表", icon: "📅" },
  { key: "recipe",   label: "レシピ", icon: "🍳" },
  { key: "shopping", label: "買い物リスト", icon: "🛒" },
];
const CONDITION_OPTIONS = [
  { value: "疲れ気味", label: "😴 疲れ気味", hint: "さっぱり・栄養重視" },
  { value: "体調不良", label: "🤧 体調不良", hint: "消化に良いもの" },
  { value: "冷え気味", label: "❄️ 冷え気味", hint: "体が温まるもの" },
  { value: "夏バテ",   label: "☀️ 夏バテ",   hint: "さっぱり・食べやすい" },
  { value: "がっつり", label: "💪 がっつり",  hint: "ボリューム重視" },
  { value: "ダイエット中", label: "🥗 ダイエット中", hint: "カロリー控えめ" },
];
const SPECIAL_SEASONINGS = [
  "鶏がらスープの素", "鶏ガラスープの素", "オイスターソース", "ナンプラー",
  "豆板醤", "甜麺醤", "コチュジャン", "XO醤", "バルサミコ酢",
  "ウスターソース", "ガラムマサラ", "白だし", "コンソメ", "創味シャンタン",
  "ダシダ", "柚子胡椒", "五香粉", "タヒニ", "アンチョビ",
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

// ─── Streak & Badges ─────────────────────────────────────────────
function calcStreak(records: CookedRecord[]): number {
  if (records.length === 0) return 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dates = new Set(records.map(r => {
    const d = new Date(r.cookedAt); d.setHours(0, 0, 0, 0); return d.getTime();
  }));
  let streak = 0; let cur = today.getTime();
  if (!dates.has(cur)) cur -= 86400000;
  while (dates.has(cur)) { streak++; cur -= 86400000; }
  return streak;
}

const BADGES: { id: string; emoji: string; name: string; desc: string; check: (r: CookedRecord[], s: number) => boolean }[] = [
  { id: "first",    emoji: "🍳", name: "はじめての一品",    desc: "最初の料理を記録",        check: (r)    => r.length >= 1 },
  { id: "5dishes",  emoji: "⭐", name: "5品達成",            desc: "5品を作って記録",          check: (r)    => r.length >= 5 },
  { id: "10dishes", emoji: "🏆", name: "料理マスター",       desc: "10品を作って記録",         check: (r)    => r.length >= 10 },
  { id: "perfect",  emoji: "🤩", name: "パーフェクトシェフ", desc: "最高評価を3品獲得",        check: (r)    => r.filter(x => x.rating === 3).length >= 3 },
  { id: "streak3",  emoji: "🔥", name: "3日連続",            desc: "3日連続で料理を記録",      check: (_, s) => s >= 3 },
  { id: "streak7",  emoji: "💪", name: "1週間継続",          desc: "7日連続で料理を記録",      check: (_, s) => s >= 7 },
  { id: "variety",  emoji: "🌍", name: "バリエーション名人", desc: "10種類以上の料理を記録",   check: (r)    => new Set(r.map(x => x.dishName)).size >= 10 },
];

function getEarnedBadges(records: CookedRecord[]) {
  const streak = calcStreak(records);
  return BADGES.filter(b => b.check(records, streak));
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

function RecipeBlock({ title, body, imageUrl, imageLoading, savedRating, onRate, canSave, onUpgrade }: {
  title: string;
  body: string[];
  imageUrl?: string | null;
  imageLoading?: boolean;
  savedRating?: number;
  onRate?: (stars: 1 | 2 | 3, body: string[]) => void;
  canSave?: boolean;
  onUpgrade?: () => void;
}) {
  const [ratingOpen, setRatingOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const handleRate = (stars: 1 | 2 | 3) => {
    onRate?.(stars, body);
    setJustSaved(true);
    setRatingOpen(false);
    setTimeout(() => setJustSaved(false), 2500);
  };

  // 各セクションをパース
  const nutritionLine = body.find(l => l.trim().startsWith("📊")) ?? "";
  const ingredientsLine = body.find(l => l.trim().startsWith("材料:")) ?? "";
  const ingredients = ingredientsLine
    ? ingredientsLine.replace(/^材料:\s*/, "").split(/[・,、]/).map(s => s.trim()).filter(Boolean)
    : [];
  const steps = body.filter(l => /^\d+\./.test(l.trim())).map(l => l.trim().replace(/^\d+\.\s*/, ""));
  const tipLine = body.find(l => l.trim().startsWith("💡"))?.replace(/^💡\s*(コツ[：:]?\s*)?/, "") ?? "";
  const specialFound = SPECIAL_SEASONINGS.filter(s => ingredientsLine.includes(s));

  // 食材名と分量を分離
  const parseIngredient = (s: string) => {
    const m = s.match(/^(.*?)(\d+(?:[./]\d+)?(?:g|ml|kg|L|cc|枚|個|本|缶|束|房|かけ|切れ|丁|袋|パック|カップ|合|玉|片)|[大小]さじ\d+(?:[./]\d+)?|適量|少々|少量|ひとつまみ|お好みで|適宜)$/);
    if (m?.[1]) return { name: m[1].trim(), amount: m[2] };
    return { name: s.trim(), amount: "" };
  };

  return (
    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

      {/* ① 料理写真（大きくトップに） */}
      {imageLoading && (
        <div style={{ height: 240, background: "#f0ebe0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <span className="animate-spin-sm" style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.1)", borderTopColor: "var(--accent)", display: "inline-block" }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>写真を生成中...</span>
        </div>
      )}
      {imageUrl && !imageLoading && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={title} style={{ width: "100%", height: 240, objectFit: "cover", display: "block" }} />
      )}

      <div style={{ padding: "20px 18px 0" }}>

        {/* ② タイトル */}
        <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 18, color: "var(--text-primary)", margin: "0 0 6px", lineHeight: 1.4 }}>
          {title}
        </h3>
        {specialFound.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
            <span style={{ fontSize: 10, color: "#92400e", fontFamily: "var(--font-heading)", fontWeight: 700, flexShrink: 0 }}>💡 特殊調味料:</span>
            {specialFound.map(s => (
              <span key={s} style={{ fontSize: 11, background: "#fef3c7", color: "#92400e", borderRadius: 20, padding: "2px 9px", border: "1px solid #f5d060", fontFamily: "var(--font-body)", fontWeight: 600 }}>{s}</span>
            ))}
          </div>
        )}

        {/* ③ 栄養情報（コンパクトな横並び） */}
        {nutritionLine && (() => {
          const m = nutritionLine.match(/📊\s*(\d+)kcal\s*\/\s*P:([\d.]+)[gG]\s*\/\s*F:([\d.]+)[gG]\s*\/\s*C:([\d.]+)[gG]\s*\/\s*塩:([\d.]+)[gG]/i);
          if (!m) return null;
          const [, kcal, protein, fat, carbs, salt] = m;
          return (
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {[
                { label: "カロリー", value: `${kcal}kcal`, highlight: true },
                { label: "たんぱく質", value: `${protein}g` },
                { label: "脂質", value: `${fat}g` },
                { label: "炭水化物", value: `${carbs}g` },
                { label: "塩分", value: `${salt}g` },
              ].map(n => (
                <div key={n.label} style={{ flex: 1, minWidth: 54, textAlign: "center", background: n.highlight ? "var(--accent-light)" : "var(--bg-subtle)", borderRadius: 10, padding: "8px 4px", border: n.highlight ? "1.5px solid rgba(230,149,26,0.3)" : "1px solid var(--border)" }}>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 13, color: n.highlight ? "var(--accent-dark)" : "var(--text-primary)", lineHeight: 1.2 }}>{n.value}</div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 600, marginTop: 2 }}>{n.label}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ④ 材料（縦並び・フルwidth） */}
        {ingredients.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 13, color: "var(--text-primary)", letterSpacing: "0.04em", marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid var(--accent)" }}>材料</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {ingredients.map((ing, i) => {
                const { name, amount } = parseIngredient(ing);
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "10px 0", borderBottom: i < ingredients.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <span style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.4 }}>{name}</span>
                    {amount && <span style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 600, flexShrink: 0, marginLeft: 16 }}>{amount}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ⑤ 作り方（縦並び・フルwidth・写真なし） */}
        {steps.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 13, color: "var(--text-primary)", letterSpacing: "0.04em", marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid var(--accent)" }}>作り方</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 0", borderBottom: i < steps.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.75, flex: 1, paddingTop: 3 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ⑥ ポイント */}
        {tipLine && (
          <div style={{ background: "#fffbf0", borderRadius: 12, padding: "12px 16px", marginBottom: 16, border: "1px solid #f0e0a0" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 11, color: "#92400e", letterSpacing: "0.08em", marginBottom: 4 }}>💡 ポイント</div>
            <div style={{ fontSize: 13, color: "#78350f", lineHeight: 1.75 }}>{tipLine}</div>
          </div>
        )}

      </div>

      {/* ⑦ 作った！評価エリア */}
      <div style={{ padding: "12px 18px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        {canSave === false ? (
          <button onClick={onUpgrade}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 20, border: "1px dashed #d4a017", background: "#fffbf0", color: "#a07010", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            🔒 スタンダード以上で保存できます
          </button>
        ) : justSaved ? (
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
    </div>
  );
}

function RecipeSection({ text, imageResults, ratings, onRate, canSave, onUpgrade }: {
  text: string;
  imageResults: Record<string, string | null>;
  ratings?: Record<string, number>;
  onRate?: (dish: string, stars: 1 | 2 | 3, body: string[]) => void;
  canSave?: boolean;
  onUpgrade?: () => void;
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
          savedRating={ratings?.[b.title]}
          onRate={onRate ? (stars, body) => onRate(b.title, stars, body) : undefined}
          canSave={canSave}
          onUpgrade={onUpgrade}
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

function HistoryModal({ records, streak, earnedBadges, onClear, onClose }: {
  records: CookedRecord[];
  streak: number;
  earnedBadges: typeof BADGES;
  onClear: () => void;
  onClose: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 540, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 -8px 40px rgba(0,0,0,0.12)" }}>
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

          {/* Stats row */}
          {records.length > 0 && (
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <div style={{ flex: 1, background: "var(--bg-subtle)", borderRadius: 12, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 20, color: "var(--accent-dark)" }}>{records.length}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>累計品数</div>
              </div>
              <div style={{ flex: 1, background: streak > 0 ? "#fff7ed" : "var(--bg-subtle)", borderRadius: 12, padding: "10px 14px", textAlign: "center", border: streak >= 3 ? "1.5px solid #f97316" : "none" }}>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 20, color: streak >= 3 ? "#ea580c" : "var(--text-secondary)" }}>
                  {streak > 0 ? `🔥 ${streak}` : "—"}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>連続日数</div>
              </div>
              <div style={{ flex: 1, background: "var(--bg-subtle)", borderRadius: 12, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 20, color: "#4a7840" }}>{earnedBadges.length}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>バッジ</div>
              </div>
            </div>
          )}

          {/* Badges */}
          {BADGES.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", marginBottom: 8 }}>バッジ</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {BADGES.map(b => {
                  const earned = earnedBadges.some(e => e.id === b.id);
                  return (
                    <div key={b.id} title={b.desc}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 20,
                        background: earned ? "#deecd6" : "var(--bg-subtle)",
                        border: earned ? "1px solid rgba(74,120,64,0.3)" : "1px solid var(--border)",
                        opacity: earned ? 1 : 0.4 }}>
                      <span style={{ fontSize: 14 }}>{b.emoji}</span>
                      <span style={{ fontSize: 11, fontFamily: "var(--font-heading)", fontWeight: 700, color: earned ? "#2f5228" : "var(--text-muted)" }}>{b.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div style={{ overflowY: "auto", padding: "0 24px 36px" }}>
          {records.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🍳</div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, marginBottom: 6 }}>まだ記録がありません</div>
              <div style={{ fontSize: 12 }}>レシピの「作った！」ボタンで記録できます</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingTop: 4 }}>
              {records.map(r => {
                const opt = RATING_OPTIONS.find(o => o.value === r.rating);
                const date = new Date(r.cookedAt);
                const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
                const ingredientsLine = r.recipeBody?.find(l => l.trim().startsWith("材料:")) ?? "";
                const ingredients = ingredientsLine
                  ? ingredientsLine.replace(/^材料:\s*/, "").split(/[・,、]/).map(s => s.trim()).filter(Boolean).slice(0, 4)
                  : [];
                return (
                  <div key={r.id} style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column" }}>
                    {/* 上半分: 写真 */}
                    <div style={{ height: 110, background: "#f0ebe0", flexShrink: 0, position: "relative", overflow: "hidden" }}>
                      {r.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.imageUrl} alt={r.dishName} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🍽️</div>
                      )}
                      <div style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.45)", borderRadius: 8, padding: "2px 6px", fontSize: 10, color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700 }}>
                        {dateStr}
                      </div>
                      <div style={{ position: "absolute", top: 6, left: 6, fontSize: 16 }}>{opt?.emoji}</div>
                    </div>
                    {/* 下半分: タイトル＋材料 */}
                    <div style={{ padding: "10px 10px 12px", flex: 1 }}>
                      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 12, color: "var(--text-primary)", lineHeight: 1.4, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {r.dishName}
                      </div>
                      {ingredients.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                          {ingredients.map((ing, i) => (
                            <span key={i} style={{ fontSize: 10, background: "var(--bg-subtle)", color: "var(--text-muted)", borderRadius: 6, padding: "2px 6px", fontFamily: "var(--font-body)" }}>{ing}</span>
                          ))}
                          {(r.recipeBody?.find(l => l.trim().startsWith("材料:")) ?? "")
                            .replace(/^材料:\s*/, "").split(/[・,、]/).filter(Boolean).length > 4 && (
                            <span style={{ fontSize: 10, color: "var(--text-muted)", padding: "2px 4px" }}>…</span>
                          )}
                        </div>
                      )}
                    </div>
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

// ─── Celebration Modal ───────────────────────────────────────────
function CelebrationModal({ dishName, imageUrl, onClose, onShare, isAdmin }: {
  dishName: string;
  imageUrl?: string | null;
  onClose: () => void;
  onShare: (text: string) => void;
  isAdmin?: boolean;
}) {
  const shareText = isAdmin
    ? `🍳 ${dishName} を作りました！\nメシリストのAI献立でチャレンジ✨\n#メシリスト #今日の夕食 #料理記録`
    : `🍳 ${dishName} を作りました！\n#今日のごはん #料理記録 #今日の夕食`;
  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 540, padding: "28px 24px 48px", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
        <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 4, margin: "0 auto 24px" }} />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 12 }}>🎉</div>
          <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 22, color: "var(--text-primary)", marginBottom: 6 }}>完成！最高の一品！</h3>
          <p style={{ fontSize: 15, color: "var(--accent-dark)", fontFamily: "var(--font-heading)", fontWeight: 700 }}>{dishName}</p>
        </div>

        {/* Dish image */}
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 16, height: 160 }}>
            <img src={imageUrl} alt={dishName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        {/* Share card preview */}
        <div style={{ background: "linear-gradient(135deg, #f5a623 0%, #c87c0a 100%)", borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "#fff", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{shareText}</div>
        </div>

        {/* Buttons */}
        {"share" in navigator && (
          <button
            onClick={() => { onShare(shareText); onClose(); }}
            style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #f5a623, #c87c0a)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            📤 SNSでシェアする
          </button>
        )}
        <button onClick={onClose}
          style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid var(--border)", background: "none", color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          閉じる
        </button>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────
function AppContent() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const searchParams = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";
  const planParam = searchParams.get("plan") as "light" | "standard" | "premium" | null;

  const [ready, setReady] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2>(1);
  const [onboardingAllergies, setOnboardingAllergies] = useState<string[]>([]);
  const [onboardingFamilySize, setOnboardingFamilySize] = useState("4");
  const [trialStatus, setTrialStatus] = useState<{ trialActive: boolean; daysLeft: number; subscribed: boolean; plan: string | null; generationsLeft: number | null; imageGenerationsLeft: number | null; freeCreditsLeft: number; freeCreditsTotal: number } | null>(null);

  // Input state
  const [ingredients, setIngredients] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [familySize, setFamilySize] = useState("4");
  const [disliked, setDisliked] = useState("");
  const [style, setStyle] = useState("何でも");
  const days = "today";
  const [noKnife, setNoKnife] = useState(false);
  const [cookTime, setCookTime] = useState<"quick" | "normal" | "slow">("normal");
  const [dishCount, setDishCount] = useState("3");
  const [condition, setCondition] = useState("");

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

  // Celebration after cooking
  const [showCelebration, setShowCelebration] = useState<{ dishName: string; imageUrl?: string | null } | null>(null);

  // UI
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showPostGenModal, setShowPostGenModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"light" | "standard" | "premium">("standard");
  const [copied, setCopied] = useState(false);
  const [showTip, setShowTip] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [wakeLockOn, setWakeLockOn] = useState(false);

  // Image generation: keyed by dish name. undefined = pending, null = failed, string = url
  const [imageResults, setImageResults] = useState<Record<string, string | null>>({});
  const pendingImagesRef = useRef<Set<string>>(new Set());
  const imagePromisesRef = useRef<Promise<void>[]>([]);
  const imageResultsRef = useRef<Record<string, string | null>>({});

  const triggerImageGen = (dish: string) => {
    if (pendingImagesRef.current.has(dish)) return;
    pendingImagesRef.current.add(dish);
    const p: Promise<void> = fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dish, deviceId }),
    })
      .then(r => r.json())
      .then(d => {
        const url = d.url || (d.b64 ? `data:image/png;base64,${d.b64}` : null) || null;
        imageResultsRef.current[dish] = url;
        setImageResults(prev => ({ ...prev, [dish]: url }));
      })
      .catch(() => {
        imageResultsRef.current[dish] = null;
        setImageResults(prev => ({ ...prev, [dish]: null }));
      });
    imagePromisesRef.current.push(p);
  };


  // Initialize from localStorage + Redisユーザーデータ
  useEffect(() => {
    if (!isUserLoaded) return;
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
        if (p.dishCount)                setDishCount(p.dishCount);
        if (p.condition !== undefined)  setCondition(p.condition);
      }
      const savedChecked = localStorage.getItem("meshilist_checked");
      if (savedChecked) setCheckedItems(new Set(JSON.parse(savedChecked)));
      // リフレッシュ後に生成済み献立を復元
      const savedOutput = localStorage.getItem("meshilist_raw_output");
      if (savedOutput) {
        setRawOutput(savedOutput);
        setView("result");
        const nullResults: Record<string, null> = {};
        for (const m of savedOutput.matchAll(/\*\*(.+?)\*\*/g)) nullResults[m[1]] = null;
        setImageResults(nullResults);
      }
    } catch {}

    const hasVisited = localStorage.getItem("meshilist_visited");
    if (!hasVisited) { setShowTip(true); localStorage.setItem("meshilist_visited", "1"); }

    const hasOnboarded = localStorage.getItem("meshilist_onboarded");
    if (!hasOnboarded) { setShowOnboarding(true); }

    // 料理記録はlocalStorageから読み込み（RedisはtrialStatus確定後に上書き）
    const savedCooked = localStorage.getItem("meshilist_cooked");
    if (savedCooked) setCookedRecords(JSON.parse(savedCooked));

    setReady(true);

    fetch("/api/trial", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: id }),
    }).then(r => r.json()).then(setTrialStatus).catch(() => {});
  }, [isUserLoaded, user]);

  // Auto-redirect to Stripe when coming from pricing page (?plan=xxx)
  useEffect(() => {
    if (!planParam || !deviceId || !trialStatus) return;
    setSelectedPlan(planParam);
    fetch("/api/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, planId: planParam }),
    }).then(r => r.json()).then(d => { if (d.url) window.location.href = d.url; }).catch(() => {});
  }, [planParam, deviceId, trialStatus]);

  // Persist inputs to localStorage
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("meshilist_inputs", JSON.stringify({ ingredients, selectedChips, familySize, disliked, style, noKnife, cookTime, dishCount, condition }));
  }, [ready, ingredients, selectedChips, familySize, disliked, style, days, noKnife]);

  // サブスク済み＋ログイン済みになったらRedisからデータを読み込む
  useEffect(() => {
    if (!user || !trialStatus?.subscribed) return;
    fetch("/api/user-data")
      .then(r => r.json())
      .then(data => {
        if (data.cooked && data.cooked.length > 0) setCookedRecords(data.cooked);
        if (data.prefs && Object.keys(data.prefs).length > 0) {
          const p = data.prefs;
          if (p.familySize) setFamilySize(p.familySize);
          if (p.disliked !== undefined) setDisliked(p.disliked);
          if (p.style) setStyle(p.style);
          if (p.noKnife !== undefined) setNoKnife(p.noKnife);
          if (p.cookTime) setCookTime(p.cookTime);
          if (p.dishCount) setDishCount(p.dishCount);
        }
      })
      .catch(() => {});
  }, [user, trialStatus]);

  // サブスク済み＋ログイン済みならユーザー設定をRedisに保存
  useEffect(() => {
    if (!ready || !user || !trialStatus?.subscribed) return;
    const timer = setTimeout(() => {
      fetch("/api/user-data", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefs: { familySize, disliked, style, noKnife, cookTime, dishCount } }),
      }).catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, [ready, user, trialStatus, familySize, disliked, style, noKnife, cookTime, dishCount]);

  // Parse output when generation finishes
  useEffect(() => {
    if (!generating && rawOutput) {
      setParsedOutput(parseOutput(rawOutput));
    } else if (!rawOutput) {
      setParsedOutput(null);
    }
  }, [generating, rawOutput]);

  // 生成済み献立をlocalStorageに保存（リフレッシュ後に復元するため）
  useEffect(() => {
    if (rawOutput) localStorage.setItem("meshilist_raw_output", rawOutput);
  }, [rawOutput]);

  // iOS Safariのプルトゥリフレッシュを防止
  useEffect(() => {
    let startY = 0;
    const onStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onMove = (e: TouchEvent) => {
      if (e.touches[0].clientY <= startY) return;
      const el = scrollRef.current;
      if (el && el.contains(e.target as Node)) {
        if (el.scrollTop === 0) e.preventDefault();
      } else if ((document.documentElement.scrollTop || document.body.scrollTop) === 0) {
        e.preventDefault();
      }
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
    };
  }, []);

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

  const goToStripeFromApp = async (planId: "light" | "standard" | "premium" = "standard") => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, planId }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch { alert("エラーが発生しました。"); }
  };

  const handleGenerate = async () => {
    if (!trialStatus) return;
    if (!trialStatus.trialActive && !trialStatus.subscribed) { goToStripeFromApp(); return; }
    // standard・premiumサブスク済みで未ログインならログインを促す
    if (trialStatus.subscribed && (trialStatus.plan === "standard" || trialStatus.plan === "premium") && !user) {
      setShowLoginPrompt(true); return;
    }
    if (trialStatus.subscribed && trialStatus.plan === "light" && (trialStatus.generationsLeft ?? 0) <= 0) { setShowSubscribeModal(true); return; }
    if (!allIngredients.trim()) { alert("食材を入力してください"); return; }

    setGenerating(true);
    setView("result");
    setRawOutput("");
    setParsedOutput(null);
    setActiveTab("recipe");
    setCheckedItems(new Set());
    setDishRatings({});
    setImageResults({});
    imageResultsRef.current = {};
    pendingImagesRef.current = new Set();
    imagePromisesRef.current = [];
    localStorage.removeItem("meshilist_checked");
    localStorage.removeItem("meshilist_raw_output");
    abortRef.current = new AbortController();
    let accumulated = "";

    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: allIngredients, familySize, disliked, style, days, deviceId, noKnife, cookTime, dishCount, condition }),
        signal: abortRef.current.signal,
      });
      if (res.status === 402) { goToStripeFromApp(); return; }
      if (!res.ok || !res.body) throw new Error("failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) {
          accumulated += decoder.decode(value, { stream: true });
          setRawOutput(accumulated);
          // Detect recipe titles in stream and start dish photo generation in parallel (all active users)
          if (trialStatus?.trialActive) {
            const recipeMatch = accumulated.match(/###\s*🍳[^\n]*\n([\s\S]*?)(?=###\s*📅|###\s*🛒|$)/);
            if (recipeMatch) {
              for (const match of recipeMatch[1].matchAll(/\*\*(.+?)\*\*/g)) {
                if (pendingImagesRef.current.size >= 3) break;
                triggerImageGen(match[1]);
              }
            }
          }
        }
      }
      // Wait for dish photo generations to complete
      await Promise.all(imagePromisesRef.current);
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") alert("エラーが発生しました。もう一度お試しください。");
    } finally {
      setGenerating(false);
      // 画像がトリガーされなかったdishのスピナーをクリア
      const recipeSection = accumulated.match(/###\s*🍳[^\n]*\n([\s\S]*?)(?=###\s*📅|###\s*🛒|$)/);
      if (recipeSection) {
        setImageResults(prev => {
          const next = { ...prev };
          for (const m of recipeSection[1].matchAll(/\*\*(.+?)\*\*/g)) {
            if (!(m[1] in next)) next[m[1]] = null;
          }
          return next;
        });
      }
      // 管理者デバイスは生成した全レシピを自動保存
      if (deviceId === process.env.NEXT_PUBLIC_ADMIN_DEVICE_ID && recipeSection) {
        const blocks: { title: string; body: string[] }[] = [];
        let cur: { title: string; body: string[] } | null = null;
        for (const line of recipeSection[1].split("\n")) {
          const t = line.trim();
          if (t.startsWith("**") && t.endsWith("**") && t.length > 4) {
            if (cur) blocks.push(cur);
            cur = { title: t.slice(2, -2), body: [] };
          } else if (cur) {
            cur.body.push(line);
          }
        }
        if (cur) blocks.push(cur);
        for (const block of blocks) {
          const imgUrl = imageResultsRef.current[block.title] ?? null;
          const record: CookedRecord = { id: crypto.randomUUID(), dishName: block.title, cookedAt: new Date().toISOString(), rating: 3, recipeBody: block.body, imageUrl: imgUrl };
          setCookedRecords(prev => {
            const next = [record, ...prev].slice(0, 50);
            localStorage.setItem("meshilist_cooked", JSON.stringify(next));
            return next;
          });
        }
      }
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      // trial status を再取得
      fetch("/api/trial", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      }).then(r => r.json()).then(status => {
        setTrialStatus(status);
        // 無料クレジットを使い切ったら少し待ってモーダル表示
        if (!status.subscribed && status.freeCreditsLeft === 0) {
          setTimeout(() => setShowPostGenModal(true), 1800);
        }
      }).catch(() => {});
    }
  };

  const handleStop = () => { abortRef.current?.abort(); setGenerating(false); };

  const completeOnboarding = () => {
    setFamilySize(onboardingFamilySize);
    if (onboardingAllergies.length > 0) {
      setDisliked(prev => {
        const base = prev ? prev + "、" : "";
        return base + onboardingAllergies.join("、");
      });
    }
    localStorage.setItem("meshilist_onboarded", "1");
    setShowOnboarding(false);
  };

  const saveCookedRecord = (dishName: string, stars: 1 | 2 | 3, recipeBody?: string[], imageUrl?: string | null) => {
    const record: CookedRecord = { id: crypto.randomUUID(), dishName, cookedAt: new Date().toISOString(), rating: stars, recipeBody, imageUrl: imageUrl ?? imageResults[dishName] ?? null };
    setCookedRecords(prev => {
      const next = [record, ...prev].slice(0, 50);
      localStorage.setItem("meshilist_cooked", JSON.stringify(next));
      // サブスク済み＋ログイン済みならRedisにも保存
      if (user && trialStatus?.subscribed) {
        fetch("/api/user-data", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cooked: next }),
        }).catch(() => {});
      }
      return next;
    });
    setDishRatings(prev => ({ ...prev, [dishName]: stars }));
    if (stars === 3) {
      setShowCelebration({ dishName, imageUrl: imageResults[dishName] ?? null });
    }
  };

  const handleShare = () => {
    if (!parsedOutput) return;
    const dishNames = parsedOutput.recipe
      .match(/\*\*(.+?)\*\*/g)?.map(s => s.replace(/\*\*/g, "")) ?? [];
    const menuLine = dishNames.slice(0, 3).join("・") + (dishNames.length > 3 ? "など" : "");
    const isAdmin = deviceId === process.env.NEXT_PUBLIC_ADMIN_DEVICE_ID;
    const text = isAdmin
      ? `「今日何作ろう」をAIが即解決🤖\n\n${menuLine}\n\n食材を入れるだけで献立＋レシピ＋買い物リストが自動生成✨\n無料で試せます👇\nhttps://meshilist.com\n\n#今日の献立 #献立決め #時短料理 #共働き飯 #子育てごはん #AI献立`
      : `${menuLine}\n\n#今日の献立 #今日のごはん #料理 #献立`;
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
    const url = encodeURIComponent("https://meshilist.com");
    const text = encodeURIComponent(shareMenuText);
    window.open(`https://social-plugins.line.me/lineit/share?url=${url}&text=${text}`, "_blank");
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
        body: JSON.stringify({ deviceId, planId: selectedPlan }),
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
        <div style={{ maxWidth: 820, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* ロゴ */}
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none" }}>
            <KoocaBowlIcon size={32} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                メシ<span style={{ color: "var(--accent)" }}>リスト</span>
              </span>
              <span style={{ fontFamily: "var(--font-pacifico)", fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.02em" }}>
                by kooca
              </span>
            </div>
          </a>

          {/* 右側ナビ：アイコン上・ラベル下 */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>

            {/* レシピ集 */}
            <a href="/recipes" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 10px", borderRadius: 10, textDecoration: "none", color: "var(--text-secondary)", background: "none", minWidth: 44 }}>
              <span style={{ fontSize: 20 }}>📖</span>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 10, whiteSpace: "nowrap" }}>レシピ集</span>
            </a>

            {/* 記録 */}
            <button onClick={() => setShowHistory(v => !v)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 10px", borderRadius: 10, border: "none", background: "none", cursor: "pointer", color: cookedRecords.length > 0 ? "var(--accent-dark)" : "var(--text-secondary)", minWidth: 44, position: "relative" }}>
              <span style={{ fontSize: 20, position: "relative" }}>
                📓
                {cookedRecords.length > 0 && (
                  <span style={{ position: "absolute", top: -4, right: -6, background: "var(--accent)", color: "#fff", borderRadius: 10, padding: "0 4px", fontSize: 9, fontWeight: 700, lineHeight: "14px" }}>
                    {cookedRecords.length}
                  </span>
                )}
              </span>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 10, whiteSpace: "nowrap" }}>記録</span>
            </button>

            {/* 連続記録（あるときだけ） */}
            {(() => { const s = calcStreak(cookedRecords); return s > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 10px", borderRadius: 10, minWidth: 44, color: s >= 3 ? "#ea580c" : "var(--text-secondary)" }}>
                <span style={{ fontSize: 20 }}>🔥</span>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap" }}>{s}日連続</span>
              </div>
            ) : null; })()}

            {/* プランバッジ（サブスク済みのみ） */}
            {trialStatus?.subscribed && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 10px", borderRadius: 10, minWidth: 44 }}>
                <span style={{ fontSize: 20 }}>✅</span>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 10, color: "#2f5228", whiteSpace: "nowrap" }}>
                  {trialStatus.plan === "light" ? `ライト` : trialStatus.plan === "premium" ? "プレミアム" : "スタンダード"}
                </span>
              </div>
            )}

            {/* ログイン / UserButton */}
            {user
              ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 10px", minWidth: 44 }}>
                  <UserButton />
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap" }}>アカウント</span>
                </div>
              : (trialStatus?.subscribed || deviceId === process.env.NEXT_PUBLIC_ADMIN_DEVICE_ID)
                ? <SignInButton mode="modal">
                    <button style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 10px", borderRadius: 10, border: "none", background: "none", cursor: "pointer", color: "var(--accent-dark)", minWidth: 44 }}>
                      <span style={{ fontSize: 20 }}>🔑</span>
                      <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 10, whiteSpace: "nowrap" }}>ログイン</span>
                    </button>
                  </SignInButton>
                : null
            }

          </div>
        </div>
      </nav>

      {/* Checkout success banner */}
      {checkoutSuccess && (
        <div style={{ background: "var(--accent)", color: "#fff", textAlign: "center", padding: "12px", fontSize: 14, fontFamily: "var(--font-heading)", fontWeight: 600 }}>
          ご登録ありがとうございます！サブスクリプションが有効になりました 🎉
        </div>
      )}

      {/* ── Credit counter bar (free trial only) ── */}
      {trialStatus && !trialStatus.subscribed && (
        <div style={{
          background: trialStatus.freeCreditsLeft === 0 ? "#fff1f0" : trialStatus.freeCreditsLeft === 1 ? "#fff7ed" : "#f0fdf4",
          borderBottom: `1px solid ${trialStatus.freeCreditsLeft === 0 ? "#fca5a5" : trialStatus.freeCreditsLeft === 1 ? "#fcd34d" : "#86efac"}`,
          padding: "10px 20px",
        }}>
          <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>🍽️</span>
              <div>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 13, color: trialStatus.freeCreditsLeft === 0 ? "#dc2626" : "var(--text-primary)" }}>
                  無料クレジット
                </span>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>
                  {trialStatus.freeCreditsLeft > 0
                    ? <>無料お試し — あと <strong style={{ fontSize: 15, color: "#16a34a" }}>{trialStatus.freeCreditsLeft}</strong> 回</>
                    : <strong style={{ color: "#dc2626" }}>無料お試し終了</strong>
                  }
                </span>
              </div>
              {/* Dot indicators */}
              <div style={{ display: "flex", gap: 4, marginLeft: 4 }}>
                {Array.from({ length: trialStatus.freeCreditsTotal }).map((_, i) => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: i < trialStatus.freeCreditsLeft
                      ? (trialStatus.freeCreditsLeft === 1 ? "#f59e0b" : "#22c55e")
                      : "#e5e7eb",
                    transition: "background 0.3s",
                  }} />
                ))}
              </div>
            </div>
            {trialStatus.freeCreditsLeft === 0 ? (
              <button onClick={() => setShowSubscribeModal(true)}
                style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12, cursor: "pointer", flexShrink: 0 }}>
                プランに登録して続ける →
              </button>
            ) : trialStatus.freeCreditsLeft === 1 ? (
              <span style={{ fontFamily: "var(--font-heading)", fontSize: 11, color: "#d97706", fontWeight: 600, flexShrink: 0 }}>
                ⚠️ あと1回で終了
              </span>
            ) : null}
          </div>
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <label style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
                  冷蔵庫にある食材
                  <span style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "var(--text-muted)", fontSize: 12, marginLeft: 8 }}>チップをタップ or テキスト入力</span>
                </label>
                {(selectedChips.length > 0 || ingredients) && (
                  <button
                    onClick={() => { setSelectedChips([]); setIngredients(""); }}
                    style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0, flexShrink: 0 }}
                  >
                    リセット
                  </button>
                )}
              </div>
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

            {/* Condition */}
            <div>
              <label style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
                今日の体調
                <span style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "var(--text-muted)", fontSize: 12, marginLeft: 6 }}>任意</span>
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CONDITION_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setCondition(v => v === opt.value ? "" : opt.value)}
                    style={{ padding: "9px 14px", borderRadius: 10, border: `1px solid ${condition === opt.value ? "var(--accent)" : "var(--border)"}`, background: condition === opt.value ? "var(--accent-light)" : "var(--bg-subtle)", color: condition === opt.value ? "var(--accent-dark)" : "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: 13, cursor: "pointer", transition: "all 0.15s", fontWeight: condition === opt.value ? 700 : 400, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    <span>{opt.label}</span>
                    <span style={{ fontSize: 10, opacity: 0.7, fontFamily: "var(--font-body)", fontWeight: 400 }}>{opt.hint}</span>
                  </button>
                ))}
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

            {/* Dish count */}
            <div>
              <label style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>品数</label>
              <div style={{ display: "flex", gap: 8 }}>
                {DISH_COUNT_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setDishCount(opt.value)}
                    style={{ flex: 1, padding: "10px 8px", borderRadius: 10, border: `1px solid ${dishCount === opt.value ? "var(--accent)" : "var(--border)"}`, background: dishCount === opt.value ? "var(--accent-light)" : "var(--bg-subtle)", color: dishCount === opt.value ? "var(--accent-dark)" : "var(--text-secondary)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
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
              <>
                <button className="press-btn" onClick={handleGenerate}
                  style={{ width: "100%", padding: "16px", borderRadius: 12, border: "none", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 16px rgba(230,149,26,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(230,149,26,0.4)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(230,149,26,0.3)"; }}>
                  <KoocaBowlIcon size={22} />
                  献立を生成する
                </button>
                <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 4 }}>
                  ※品数にかかわらず1回分のクレジットを消費します
                </p>
              </>
            )}
          </div>
        </div>}

        {/* ── Output Panel (Full Screen Overlay) ── */}
        {view === "result" && (
          <div style={{ position: "fixed", left: 0, right: 0, top: 56, bottom: 0, background: "var(--bg)", zIndex: 40, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "rgba(245,243,238,0.96)", backdropFilter: "blur(8px)", flexShrink: 0 }}>
              <button onClick={() => { setView("form"); localStorage.removeItem("meshilist_raw_output"); }}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-secondary)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                <span className="result-back-full">← 条件を変える</span>
                <span className="result-back-short">← 戻る</span>
              </button>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                {generating
                  ? <><span className="animate-blink" style={{ color: "var(--accent)", fontSize: 10 }}>●</span> 生成中…</>
                  : "✓ 生成完了"}
              </span>
              {!generating && rawOutput && (
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={handleGenerate}
                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-secondary)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
                    再生成
                  </button>
                  <button onClick={handleShare}
                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-secondary)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                    📤 シェア
                  </button>
                  <button onClick={handleCopy}
                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: copied ? "var(--accent-light)" : "var(--bg-subtle)", color: copied ? "var(--accent-dark)" : "var(--text-secondary)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 12, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}>
                    {copied ? "✓" : "📋"}<span className="result-btn-label-copy">{copied ? " 済" : " コピー"}</span>
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
                    <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--accent-dark)", letterSpacing: "0.1em" }}>コツコツ考えています</span>
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
                  献立表・レシピ・買い物リストをまとめて生成中
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
                <div ref={scrollRef} style={{ padding: "24px", flex: 1, overflowY: "auto" }}>
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
                      <RecipeSection text={parsedOutput.recipe} imageResults={imageResults} ratings={dishRatings} onRate={(dish, stars, body) => saveCookedRecord(dish, stars, body)} canSave={deviceId === process.env.NEXT_PUBLIC_ADMIN_DEVICE_ID || (trialStatus ? (trialStatus.subscribed ? trialStatus.plan !== "light" : trialStatus.trialActive) : false)} onUpgrade={() => setShowSubscribeModal(true)} />
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
      {showHistory && (
        <HistoryModal
          records={cookedRecords}
          streak={calcStreak(cookedRecords)}
          earnedBadges={getEarnedBadges(cookedRecords)}
          onClear={() => { setCookedRecords([]); localStorage.removeItem("meshilist_cooked"); }}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* ── Celebration Modal ── */}
      {showCelebration && (
        <CelebrationModal
          dishName={showCelebration.dishName}
          imageUrl={showCelebration.imageUrl}
          isAdmin={deviceId === process.env.NEXT_PUBLIC_ADMIN_DEVICE_ID}
          onClose={() => setShowCelebration(null)}
          onShare={async (text) => {
            try {
              await navigator.share({ title: "メシリスト", text });
            } catch { /* キャンセルor非対応 */ }
          }}
        />
      )}

      {/* ── Post-generation upgrade modal ── */}
      {showPostGenModal && (
        <div onClick={() => setShowPostGenModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 24, padding: "32px 24px", maxWidth: 420, width: "100%", boxShadow: "0 20px 80px rgba(0,0,0,0.2)", textAlign: "center" }}>

            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 20, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 8 }}>
              この献立、いかがでしたか？
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
              無料お試しはここまでです。<br />続けるには以下から選んでください。
            </p>

            {/* Option A: クレジット単品 */}
            <div onClick={() => {
              setShowPostGenModal(false);
              fetch("/api/checkout", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deviceId, planId: "credits" }),
              }).then(r => r.json()).then(d => { if (d.url) window.location.href = d.url; });
            }}
              style={{ borderRadius: 14, padding: "16px 20px", marginBottom: 10, border: "2px solid var(--accent)", background: "var(--accent-light)", cursor: "pointer", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 14, color: "var(--text-primary)" }}>
                    🎟️ クレジット単品購入
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>5回分 — 期限なし・サブスク不要</div>
                </div>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 22, color: "var(--accent)" }}>¥400</div>
              </div>
            </div>

            {/* Option B: サブスク */}
            <div onClick={() => { setShowPostGenModal(false); setShowSubscribeModal(true); }}
              style={{ borderRadius: 14, padding: "16px 20px", marginBottom: 20, border: "1.5px solid var(--border)", background: "#fff", cursor: "pointer", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 14, color: "var(--text-primary)" }}>
                    🔄 月額プラン
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>¥280〜 / 月 — 無制限で使いたい方に</div>
                </div>
                <span style={{ fontSize: 18 }}>→</span>
              </div>
            </div>

            <button onClick={() => setShowPostGenModal(false)}
              style={{ width: "100%", padding: "11px", borderRadius: 10, border: "1px solid var(--border)", background: "none", color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              結果だけ確認する
            </button>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: "36px 28px", maxWidth: 420, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>

            {/* ステップ1：家族人数 */}
            {onboardingStep === 1 && (
              <>
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍👩‍👧‍👦</div>
                  <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 22, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 8 }}>
                    何人分の献立を作りますか？
                  </h2>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>あとから変更できます</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 28 }}>
                  {["1", "2", "3", "4", "5以上"].map(n => (
                    <button key={n} onClick={() => setOnboardingFamilySize(n)}
                      style={{ padding: "16px 8px", borderRadius: 14, border: `2px solid ${onboardingFamilySize === n ? "var(--accent)" : "var(--border)"}`, background: onboardingFamilySize === n ? "var(--accent-light)" : "var(--bg-subtle)", color: onboardingFamilySize === n ? "var(--accent-dark)" : "var(--text-primary)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, cursor: "pointer", transition: "all 0.15s" }}>
                      {n}人
                    </button>
                  ))}
                </div>
                <button onClick={() => setOnboardingStep(2)}
                  style={{ width: "100%", padding: "15px", borderRadius: 12, border: "none", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                  次へ →
                </button>
              </>
            )}

            {/* ステップ2：アレルギー */}
            {onboardingStep === 2 && (
              <>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
                  <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 22, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 8 }}>
                    アレルギーはありますか？
                  </h2>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>該当するものをタップしてください（複数選択可）</p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28, justifyContent: "center" }}>
                  {ALLERGY_CHIPS.map(a => {
                    const selected = onboardingAllergies.includes(a.label);
                    return (
                      <button key={a.label} onClick={() => setOnboardingAllergies(prev => selected ? prev.filter(x => x !== a.label) : [...prev, a.label])}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${selected ? "#ef4444" : "var(--border)"}`, background: selected ? "#fff1f1" : "var(--bg-subtle)", color: selected ? "#dc2626" : "var(--text-secondary)", fontFamily: "var(--font-heading)", fontWeight: selected ? 700 : 400, fontSize: 13, cursor: "pointer", transition: "all 0.15s" }}>
                        <span>{a.emoji}</span>{a.label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setOnboardingStep(1)}
                    style={{ flex: 1, padding: "14px", borderRadius: 12, border: "1px solid var(--border)", background: "#fff", color: "var(--text-secondary)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                    ← 戻る
                  </button>
                  <button onClick={completeOnboarding}
                    style={{ flex: 2, padding: "14px", borderRadius: 12, border: "none", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                    {onboardingAllergies.length > 0 ? "設定して始める ✓" : "なし・始める →"}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div onClick={() => setShowLoginPrompt(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 20, padding: "36px 28px", maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}>
            <div style={{ fontSize: 44, marginBottom: 16 }}>🔐</div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 20, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 10 }}>
              ログインしてください
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
              サブスク会員は無料でアカウントを作成できます。<br />
              ログインすると料理記録や設定がどのデバイスでも引き継がれます。
            </p>
            <SignInButton mode="modal">
              <button
                onClick={() => setShowLoginPrompt(false)}
                style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 10 }}>
                ログイン / 新規登録
              </button>
            </SignInButton>
            <button onClick={() => { setShowLoginPrompt(false); handleGenerate(); }}
              style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid var(--border)", background: "#fff", color: "var(--text-secondary)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              今はしない（このまま生成）
            </button>
          </div>
        </div>
      )}

      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <div onClick={() => setShowSubscribeModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, overflowY: "auto" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 24, padding: "32px 28px", maxWidth: 480, width: "100%", boxShadow: "0 16px 64px rgba(0,0,0,0.16)" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🍽️</div>
              <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 20, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 6 }}>
                メシリストを続ける
              </h2>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                プランを選んで登録してください。全プラン7日間無料。
              </p>
            </div>

            {/* Plan cards */}
            {([
              {
                id: "light" as const, label: "ライト", price: "¥280", unit: "/月", sub: "月10回",
                features: [
                  { text: "献立生成 月10回", ok: true },
                  { text: "料理写真つき", ok: true },
                  { text: "レシピ・手順つき", ok: true },
                  { text: "まとめ買いリスト", ok: true },
                  { text: "レシピ保存・評価", ok: false },
                ],
              },
              {
                id: "standard" as const, label: "スタンダード", price: "¥480", unit: "/月", sub: "無制限",
                features: [
                  { text: "献立生成 無制限", ok: true },
                  { text: "料理写真つき", ok: true },
                  { text: "レシピ・手順つき", ok: true },
                  { text: "まとめ買いリスト", ok: true },
                  { text: "レシピ保存・評価 ★", ok: true },
                ],
                recommended: true,
              },
              {
                id: "premium" as const, label: "プレミアム", price: "¥980", unit: "/月", sub: "無制限＋高画質",
                features: [
                  { text: "献立生成 無制限", ok: true },
                  { text: "料理写真 高画質 ✨", ok: true },
                  { text: "レシピ・手順つき", ok: true },
                  { text: "まとめ買いリスト", ok: true },
                  { text: "レシピ保存・評価 ★", ok: true },
                ],
              },
            ] as const).map(plan => (
              <div key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                style={{ borderRadius: 14, padding: "14px 16px", marginBottom: 10, border: selectedPlan === plan.id ? "2px solid var(--accent)" : "1.5px solid var(--border)", background: selectedPlan === plan.id ? "var(--accent-light)" : "#fff", cursor: "pointer", position: "relative" }}>
                {"recommended" in plan && plan.recommended && (
                  <span style={{ position: "absolute", top: -10, left: 16, background: "#4a7840", color: "#fff", fontSize: 10, fontFamily: "var(--font-heading)", fontWeight: 700, padding: "2px 10px", borderRadius: 10 }}>👑 おすすめ</span>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{plan.label}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>{plan.sub}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 20, color: "var(--text-primary)" }}>{plan.price}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{plan.unit}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 8 }}>
                  {plan.features.map(f => (
                    <span key={f.text} style={{ fontSize: 11, color: f.ok ? "var(--text-secondary)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, textDecoration: f.ok ? "none" : "line-through" }}>
                      <span style={{ color: f.ok ? "#4a7840" : "#ccc", fontWeight: 700 }}>{f.ok ? "✓" : "✕"}</span>{f.text}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            <button onClick={handleSubscribe}
              style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 4, marginBottom: 10, boxShadow: "0 4px 16px rgba(230,149,26,0.3)" }}>
              {selectedPlan === "light" ? "¥280" : selectedPlan === "standard" ? "¥480" : "¥980"}/月で登録する →
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
