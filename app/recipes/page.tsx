"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { StepGuide } from "@/app/api/generate-steps/route";

// ─── Brand image ──────────────────────────────────────────────────
function KoocaBowlIcon({ size = 28 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/kooca-bowl-transparent.png" alt="kooca" width={size} style={{ display: "block" }} />;
}

// ─── Types ───────────────────────────────────────────────────────
type Category = "すべて" | "肉料理" | "魚料理" | "卵・豆腐" | "野菜" | "ご飯・麺" | "汁物";

interface Nutrition {
  kcal: number;
  protein: number; // g
  fat: number;     // g
  carbs: number;   // g
  salt: number;    // g
}

interface Recipe {
  id: number;
  name: string;
  category: Exclude<Category, "すべて">;
  time: string;
  difficulty: "簡単" | "普通" | "少し手間";
  ingredients: string[];
  steps: string[];
  nutrition: Nutrition; // 1人分
  noKnife?: boolean;   // 包丁いらず
}

// ─── Data ────────────────────────────────────────────────────────
const RECIPES: Recipe[] = [
  // 肉料理
  {
    id: 1, name: "豚の生姜焼き", category: "肉料理", time: "15分", difficulty: "簡単",
    ingredients: ["豚ロース薄切り 200g", "生姜 1かけ", "醤油 大さじ2", "みりん 大さじ2", "酒 大さじ1", "キャベツ 適量"],
    steps: ["生姜はすりおろし、醤油・みりん・酒と合わせてタレを作る", "豚肉をタレに10分漬け込む", "フライパンを中火で熱し、豚肉を広げて焼く", "焼き色がついたら裏返し、残りのタレを絡める", "キャベツ千切りを添えて完成"],
    nutrition: { kcal: 380, protein: 22, fat: 24, carbs: 14, salt: 1.8 },
  },
  {
    id: 2, name: "鶏の唐揚げ", category: "肉料理", time: "25分", difficulty: "普通",
    ingredients: ["鶏もも肉 300g", "醤油 大さじ2", "酒 大さじ1", "生姜・にんにく 各1かけ", "片栗粉 大さじ3", "揚げ油 適量"],
    steps: ["鶏肉を一口大に切り、醤油・酒・すりおろし生姜・にんにくで30分漬ける", "水気を拭き、片栗粉をまぶす", "170℃の油で4分揚げ、一度取り出す", "油を180℃に上げ、再度1分揚げてカリッとさせる", "油を切って完成"],
    nutrition: { kcal: 420, protein: 26, fat: 25, carbs: 20, salt: 1.5 },
  },
  {
    id: 3, name: "肉じゃが", category: "肉料理", time: "30分", difficulty: "普通",
    ingredients: ["牛薄切り肉 150g", "じゃがいも 3個", "玉ねぎ 1個", "にんじん 1本", "だし汁 300ml", "醤油・みりん・砂糖 各大さじ2"],
    steps: ["野菜を一口大に切る", "鍋に油を熱し牛肉を炒め、野菜を加えて炒める", "だし汁・醤油・みりん・砂糖を加え中火で煮る", "野菜が柔らかくなるまで15分煮込む", "味をなじませて完成"],
    nutrition: { kcal: 290, protein: 14, fat: 10, carbs: 36, salt: 2.2 },
  },
  {
    id: 4, name: "鶏の照り焼き", category: "肉料理", time: "20分", difficulty: "簡単",
    ingredients: ["鶏もも肉 2枚", "醤油・みりん・砂糖 各大さじ2", "サラダ油 少々"],
    steps: ["鶏肉は皮目にフォークで穴をあける", "フライパンに油を熱し、皮目から焼く", "両面こんがり焼けたらタレを加えて絡める", "蓋をして弱火で5分蒸し焼きにする", "食べやすく切って完成"],
    nutrition: { kcal: 310, protein: 28, fat: 16, carbs: 12, salt: 1.6 },
  },
  {
    id: 5, name: "ハンバーグ", category: "肉料理", time: "35分", difficulty: "少し手間",
    ingredients: ["合いびき肉 300g", "玉ねぎ 1/2個", "卵 1個", "パン粉 大さじ3", "牛乳 大さじ2", "塩・こしょう 少々"],
    steps: ["玉ねぎをみじん切りにして炒め、冷ます", "ひき肉・卵・パン粉・牛乳・塩こしょうを合わせてよくこねる", "小判型に成形し、中央をくぼませる", "フライパンで両面焼き色をつけ、蓋をして蒸し焼き", "竹串を刺して透明な汁が出れば完成"],
    nutrition: { kcal: 390, protein: 20, fat: 28, carbs: 12, salt: 1.4 },
  },
  {
    id: 6, name: "豚バラともやし炒め", category: "肉料理", time: "20分", difficulty: "簡単",
    ingredients: ["豚バラ薄切り 150g", "もやし 1袋", "ニラ 1/2束", "醤油・酒 各大さじ1", "ごま油 少々"],
    steps: ["豚肉はキッチンバサミで食べやすい大きさに切る", "フライパンにごま油を熱し、豚肉を炒める", "もやしを加えてさらに炒める", "ニラはハサミで5cm幅に切って加え、醤油・酒で味を調える", "さっと混ぜて完成"],
    nutrition: { kcal: 320, protein: 16, fat: 22, carbs: 8, salt: 1.5 },
    noKnife: true,
  },

  // 魚料理
  {
    id: 7, name: "鮭の塩焼き", category: "魚料理", time: "15分", difficulty: "簡単",
    ingredients: ["鮭の切り身 2切れ", "塩 少々", "大根おろし 適量", "醤油 少々"],
    steps: ["鮭に塩を振って10分おく", "出てきた水分をキッチンペーパーで拭く", "グリルを予熱して両面を焼く（各4〜5分）", "大根おろしを添え、醤油をかけて完成"],
    nutrition: { kcal: 200, protein: 22, fat: 10, carbs: 1, salt: 1.0 },
    noKnife: true,
  },
  {
    id: 8, name: "サバの味噌煮", category: "魚料理", time: "25分", difficulty: "普通",
    ingredients: ["サバ 2切れ", "味噌 大さじ2", "みりん・酒 各大さじ2", "砂糖 大さじ1", "生姜 1かけ", "水 150ml"],
    steps: ["サバに熱湯をかけ、水で洗う（臭み取り）", "鍋に水・酒・みりん・砂糖・生姜を入れて煮立てる", "サバを入れて落し蓋をし、中火で10分煮る", "味噌を溶き入れ、さらに5分煮る", "煮汁が少なくなったら完成"],
    nutrition: { kcal: 280, protein: 20, fat: 16, carbs: 14, salt: 2.0 },
  },
  {
    id: 9, name: "ツナと野菜の炒め物", category: "魚料理", time: "10分", difficulty: "簡単",
    ingredients: ["ツナ缶 1缶", "キャベツ 1/4個", "にんじん 1/2本", "醤油・ごま油 各少々", "塩・こしょう 適量"],
    steps: ["野菜を食べやすい大きさに切る", "フライパンにごま油を熱し、にんじんから炒める", "キャベツを加えてさらに炒める", "ツナ缶（汁ごと）を加えて醤油で味を調える", "塩こしょうで仕上げて完成"],
    nutrition: { kcal: 180, protein: 14, fat: 8, carbs: 14, salt: 1.2 },
  },
  {
    id: 10, name: "アジの南蛮漬け", category: "魚料理", time: "30分", difficulty: "少し手間",
    ingredients: ["アジ 4尾（三枚おろし）", "玉ねぎ・にんじん 各1/2個", "酢 大さじ4", "砂糖 大さじ2", "醤油 大さじ1", "唐辛子 1本", "片栗粉・揚げ油 適量"],
    steps: ["野菜を千切りにする", "酢・砂糖・醤油・唐辛子を合わせて南蛮酢を作る", "アジに片栗粉をまぶし170℃の油で揚げる", "熱いうちに南蛮酢に漬け、野菜を加える", "冷蔵庫で30分以上なじませて完成"],
    nutrition: { kcal: 260, protein: 18, fat: 12, carbs: 20, salt: 1.6 },
  },

  // 卵・豆腐
  {
    id: 11, name: "親子丼", category: "卵・豆腐", time: "15分", difficulty: "簡単",
    ingredients: ["鶏もも肉 150g", "卵 3個", "玉ねぎ 1/2個", "だし汁 150ml", "醤油・みりん 各大さじ2", "ご飯 2膳"],
    steps: ["鶏肉と玉ねぎを食べやすく切る", "小鍋にだし汁・醤油・みりんを煮立て、鶏肉と玉ねぎを入れる", "鶏肉に火が通ったら溶き卵を回し入れる", "半熟になったら火を止める", "ご飯の上に盛って完成"],
    nutrition: { kcal: 520, protein: 28, fat: 14, carbs: 68, salt: 2.2 },
  },
  {
    id: 12, name: "だし巻き卵", category: "卵・豆腐", time: "10分", difficulty: "普通",
    ingredients: ["卵 3個", "だし汁 大さじ3", "醤油 小さじ1", "みりん 小さじ1", "塩 少々", "サラダ油 適量"],
    steps: ["卵・だし汁・醤油・みりん・塩をよく混ぜる", "玉子焼き器に油を薄く引き、卵液の1/3を流す", "半熟になったら手前に巻く", "残りの卵液を2回に分けて同様に巻く", "形を整えて冷ましたら完成"],
    nutrition: { kcal: 180, protein: 12, fat: 12, carbs: 4, salt: 0.8 },
    noKnife: true,
  },
  {
    id: 13, name: "麻婆豆腐", category: "卵・豆腐", time: "20分", difficulty: "普通",
    ingredients: ["木綿豆腐 1丁", "豚ひき肉 100g", "豆板醤 小さじ1", "にんにく・生姜 各1かけ", "醤油・みりん 各大さじ1", "水溶き片栗粉 適量"],
    steps: ["豆腐は2cm角に切り、熱湯で1分茹でて水切りする", "油ににんにく・生姜・豆板醤を炒め香りを出す", "ひき肉を加えて炒め、醤油・みりんで味をつける", "水200mlを加えて煮立て、豆腐を入れる", "水溶き片栗粉でとろみをつけて完成"],
    nutrition: { kcal: 240, protein: 16, fat: 14, carbs: 10, salt: 2.0 },
  },
  {
    id: 14, name: "肉豆腐", category: "卵・豆腐", time: "20分", difficulty: "簡単",
    ingredients: ["木綿豆腐 1丁", "牛薄切り肉 150g", "玉ねぎ 1/2個", "だし汁 200ml", "醤油・みりん 各大さじ2", "砂糖 大さじ1"],
    steps: ["豆腐は6等分に切る", "玉ねぎは1cm幅に切る", "鍋にだし汁・醤油・みりん・砂糖を煮立て、牛肉と玉ねぎを加える", "豆腐を入れてアクを取りながら10分煮る", "味がなじんだら完成"],
    nutrition: { kcal: 260, protein: 18, fat: 14, carbs: 14, salt: 1.8 },
  },

  // 野菜
  {
    id: 15, name: "きんぴらごぼう", category: "野菜", time: "15分", difficulty: "簡単",
    ingredients: ["ごぼう 1本", "にんじん 1/2本", "醤油・みりん 各大さじ2", "砂糖 小さじ1", "ごま油 大さじ1", "唐辛子 適量"],
    steps: ["ごぼうとにんじんを細切りにし、ごぼうは水にさらす", "フライパンにごま油・唐辛子を熱する", "水気を切ったごぼう、にんじんを加えて炒める", "醤油・みりん・砂糖で味をつける", "汁気が飛んだら完成"],
    nutrition: { kcal: 120, protein: 2, fat: 4, carbs: 18, salt: 1.2 },
  },
  {
    id: 16, name: "ほうれん草のおひたし", category: "野菜", time: "10分", difficulty: "簡単",
    ingredients: ["ほうれん草 1束", "醤油 大さじ1", "だし汁 大さじ2", "かつお節 適量"],
    steps: ["ほうれん草をさっと茹でる（1〜2分）", "冷水にさらして水気をしっかり絞る", "キッチンバサミで食べやすい長さに切る", "醤油とだし汁を合わせ、ほうれん草に和える", "かつお節をのせて完成"],
    nutrition: { kcal: 40, protein: 4, fat: 0, carbs: 4, salt: 0.8 },
    noKnife: true,
  },
  {
    id: 17, name: "野菜炒め", category: "野菜", time: "10分", difficulty: "簡単",
    ingredients: ["キャベツ 1/4個", "もやし 1袋", "にんじん 1/2本", "ピーマン 2個", "醤油・酒 各大さじ1", "塩・こしょう 少々", "ごま油 少々"],
    steps: ["野菜を食べやすい大きさに切る", "フライパンを強火で熱し、にんじんから炒める", "残りの野菜を加えてさらに炒める", "醤油・酒で味をつける", "塩こしょう・ごま油で仕上げて完成"],
    nutrition: { kcal: 120, protein: 4, fat: 6, carbs: 14, salt: 1.0 },
  },
  {
    id: 18, name: "筑前煮", category: "野菜", time: "40分", difficulty: "少し手間",
    ingredients: ["鶏もも肉 200g", "れんこん・ごぼう・にんじん 各1/2本", "干ししいたけ 4枚", "こんにゃく 1/2枚", "だし汁 300ml", "醤油・みりん・砂糖 各大さじ2"],
    steps: ["干ししいたけは水で戻す。野菜は一口大に切る", "鍋に油を熱し鶏肉を炒め、野菜を加えて炒める", "だし汁・醤油・みりん・砂糖を加えて煮立てる", "落し蓋をして弱火で20分煮る", "煮汁が少なくなったら完成"],
    nutrition: { kcal: 220, protein: 14, fat: 8, carbs: 22, salt: 1.8 },
  },

  // ご飯・麺
  {
    id: 19, name: "カレーライス", category: "ご飯・麺", time: "45分", difficulty: "普通",
    ingredients: ["鶏もも肉 300g", "玉ねぎ 2個", "じゃがいも 3個", "にんじん 2本", "カレールー 1/2箱", "水 800ml", "油 大さじ1"],
    steps: ["野菜と鶏肉を一口大に切る", "鍋に油を熱し玉ねぎを飴色になるまで炒める", "鶏肉・野菜を加えて炒め、水を加えて煮る", "野菜が柔らかくなったら火を止めルーを溶かす", "弱火で10分煮て完成"],
    nutrition: { kcal: 580, protein: 24, fat: 16, carbs: 82, salt: 2.4 },
  },
  {
    id: 20, name: "チャーハン", category: "ご飯・麺", time: "10分", difficulty: "簡単",
    ingredients: ["ご飯 2膳", "卵 2個", "長ねぎ 1/2本", "醤油 大さじ1", "塩・こしょう 少々", "ごま油・サラダ油 各少々"],
    steps: ["卵を溶いてご飯と混ぜる", "フライパンを強火で熱し、サラダ油を引く", "卵ご飯を一気に投入してほぐしながら炒める", "ねぎを加えて醤油・塩こしょうで味をつける", "ごま油を鍋肌から加えて完成"],
    nutrition: { kcal: 480, protein: 14, fat: 16, carbs: 70, salt: 1.6 },
  },
  {
    id: 21, name: "焼きそば", category: "ご飯・麺", time: "15分", difficulty: "簡単",
    ingredients: ["焼きそば麺 2袋", "豚バラ薄切り 100g", "キャベツ 1/4個", "もやし 1/2袋", "ソース 大さじ3", "ごま油 少々"],
    steps: ["野菜を食べやすく切る", "フライパンに油を熱し豚肉を炒める", "野菜を加えて炒め、麺を加えて水を少し振る", "ほぐれたらソースを加えて混ぜ炒める", "ごま油を加えて完成"],
    nutrition: { kcal: 420, protein: 16, fat: 14, carbs: 58, salt: 2.0 },
  },
  {
    id: 22, name: "オムライス", category: "ご飯・麺", time: "25分", difficulty: "普通",
    ingredients: ["ご飯 2膳", "鶏もも肉 100g", "玉ねぎ 1/2個", "ケチャップ 大さじ3", "卵 3個", "塩・こしょう 少々", "バター 10g"],
    steps: ["鶏肉と玉ねぎを炒め、ご飯・ケチャップを加えてチキンライスを作る", "溶き卵に塩こしょうを加える", "フライパンにバターを熱し、卵液を流す", "半熟になったらチキンライスをのせて包む", "ケチャップをかけて完成"],
    nutrition: { kcal: 540, protein: 20, fat: 18, carbs: 76, salt: 2.2 },
  },

  // 汁物
  {
    id: 23, name: "豚汁", category: "汁物", time: "25分", difficulty: "簡単",
    ingredients: ["豚バラ薄切り 150g", "大根 1/4本", "にんじん 1/2本", "ごぼう 1/2本", "こんにゃく 1/2枚", "味噌 大さじ3", "だし汁 800ml"],
    steps: ["野菜は食べやすく切り、ごぼうは水にさらす", "鍋に油を熱し豚肉を炒め、野菜を加える", "だし汁を加えて野菜が柔らかくなるまで煮る", "火を弱め、味噌を溶き入れる", "一煮立ちさせず完成"],
    nutrition: { kcal: 180, protein: 10, fat: 10, carbs: 14, salt: 1.8 },
  },
  {
    id: 24, name: "けんちん汁", category: "汁物", time: "25分", difficulty: "普通",
    ingredients: ["木綿豆腐 1/2丁", "大根・にんじん・ごぼう 各適量", "こんにゃく 1/4枚", "醤油 大さじ2", "だし汁 700ml", "ごま油 大さじ1"],
    steps: ["豆腐は手で崩す。野菜は食べやすく切る", "鍋にごま油を熱し豆腐を炒める", "野菜・こんにゃくを加えてさらに炒める", "だし汁を加えて野菜が柔らかくなるまで煮る", "醤油で味を調えて完成"],
    nutrition: { kcal: 120, protein: 6, fat: 6, carbs: 12, salt: 1.6 },
  },
];

const CATEGORIES: Category[] = ["すべて", "肉料理", "魚料理", "卵・豆腐", "野菜", "ご飯・麺", "汁物"];

const CATEGORY_META: Record<Exclude<Category, "すべて">, { color: string; bg: string; gradient: string; emoji: string }> = {
  "肉料理":  { color: "#c0392b", bg: "#fdf0ee", gradient: "linear-gradient(135deg, #f5c6c2 0%, #fae0dc 100%)", emoji: "🥩" },
  "魚料理":  { color: "#1a6fa8", bg: "#e8f4fb", gradient: "linear-gradient(135deg, #b8d9f0 0%, #daeef9 100%)", emoji: "🐟" },
  "卵・豆腐":{ color: "#b58a00", bg: "#fdf7e3", gradient: "linear-gradient(135deg, #f5e4a0 0%, #fdf3cc 100%)", emoji: "🥚" },
  "野菜":    { color: "#2f7a3c", bg: "#e8f5ec", gradient: "linear-gradient(135deg, #a8d8b0 0%, #d4eedb 100%)", emoji: "🥦" },
  "ご飯・麺":{ color: "#8a5c00", bg: "#fdf4e3", gradient: "linear-gradient(135deg, #e8c88a 0%, #f5e4bc 100%)", emoji: "🍚" },
  "汁物":    { color: "#5a3e2b", bg: "#f5ede8", gradient: "linear-gradient(135deg, #d4b09a 0%, #ead5c8 100%)", emoji: "🍲" },
};

const DIFFICULTY_COLOR: Record<Recipe["difficulty"], string> = {
  "簡単": "#2f7a3c",
  "普通": "#b58a00",
  "少し手間": "#c0392b",
};

// 1日の目安量（厚生労働省基準・成人女性）
const DAILY_REF = { protein: 50, fat: 55, carbs: 250, salt: 6.5 };

const NUTRIENTS: { key: keyof Omit<Nutrition, "kcal">; label: string; unit: string; color: string; ref: number }[] = [
  { key: "protein", label: "たんぱく質", unit: "g", color: "#3b82f6", ref: DAILY_REF.protein },
  { key: "fat",     label: "脂質",       unit: "g", color: "#f97316", ref: DAILY_REF.fat },
  { key: "carbs",   label: "炭水化物",   unit: "g", color: "#eab308", ref: DAILY_REF.carbs },
  { key: "salt",    label: "食塩相当量", unit: "g", color: "#ef4444", ref: DAILY_REF.salt },
];

// ─── Components ───────────────────────────────────────────────────
function NutritionBar({ value, ref: refVal, color }: { value: number; ref: number; color: string }) {
  const pct = Math.min((value / refVal) * 100, 100);
  return (
    <div style={{ height: 5, background: "#f0ede7", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
    </div>
  );
}

function NutritionTable({ nutrition }: { nutrition: Nutrition }) {
  return (
    <div style={{ background: "#f8f6f2", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
      {/* Calorie hero */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 16, justifyContent: "center" }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>🔥</span>
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 38, color: "var(--text-primary)", lineHeight: 1 }}>
          {nutrition.kcal}
        </span>
        <span style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>kcal</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>/ 1人分</span>
      </div>

      {/* Nutrient rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {NUTRIENTS.map(n => {
          const pct = Math.round((nutrition[n.key] / n.ref) * 100);
          return (
            <div key={n.key}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                  {n.label}
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 14, color: "var(--text-primary)" }}>
                    {nutrition[n.key]}{n.unit}
                  </span>
                  <span style={{
                    fontSize: 10, fontFamily: "var(--font-heading)", fontWeight: 700,
                    color: pct >= 60 ? "#c0392b" : "var(--text-muted)",
                    background: pct >= 60 ? "#fdf0ee" : "#ece9e4",
                    borderRadius: 4, padding: "1px 5px",
                  }}>
                    {pct}%
                  </span>
                </div>
              </div>
              <NutritionBar value={nutrition[n.key]} ref={n.ref} color={n.color} />
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "right", marginTop: 10, margin: "10px 0 0" }}>
        ※ バーは成人女性1日の目安量に対する割合
      </p>
    </div>
  );
}

function RecipeCard({ recipe, onClick }: { recipe: Recipe; onClick: () => void }) {
  const meta = CATEGORY_META[recipe.category];
  return (
    <button
      className="press-btn"
      onClick={onClick}
      style={{
        background: "#fff", borderRadius: 16, overflow: "hidden",
        border: "1px solid var(--border)", cursor: "pointer",
        textAlign: "left", padding: 0, width: "100%",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
      }}
    >
      {/* Image placeholder */}
      <div style={{
        height: 140, background: meta.gradient, position: "relative",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        <span style={{ fontSize: 40 }}>{meta.emoji}</span>
        <span style={{ fontSize: 11, color: meta.color, fontFamily: "var(--font-heading)", fontWeight: 600, opacity: 0.7 }}>
          {recipe.name}
        </span>
        {/* Calorie badge */}
        <div style={{
          position: "absolute", top: 10, right: 10,
          background: "rgba(255,255,255,0.88)", backdropFilter: "blur(4px)",
          borderRadius: 8, padding: "3px 8px",
          display: "flex", alignItems: "center", gap: 3,
        }}>
          <span style={{ fontSize: 11 }}>🔥</span>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 12, color: "var(--text-primary)" }}>
            {recipe.nutrition.kcal}
          </span>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>kcal</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px" }}>
        {/* Category badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          background: meta.bg, color: meta.color,
          borderRadius: 20, padding: "2px 10px",
          fontSize: 10, fontFamily: "var(--font-heading)", fontWeight: 700,
          letterSpacing: "0.04em", marginBottom: 8,
        }}>
          {recipe.category}
        </div>

        {/* Name */}
        <div style={{
          fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 15,
          color: "var(--text-primary)", marginBottom: 10, lineHeight: 1.3,
        }}>
          {recipe.name}
        </div>

        {/* Meta row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-muted)" }}>
            <span>⏱</span>{recipe.time}
          </span>
          <span style={{
            fontSize: 11, fontFamily: "var(--font-heading)", fontWeight: 700,
            color: DIFFICULTY_COLOR[recipe.difficulty],
            background: `${DIFFICULTY_COLOR[recipe.difficulty]}18`,
            borderRadius: 6, padding: "2px 8px",
          }}>
            {recipe.difficulty}
          </span>
          {recipe.noKnife && (
            <span style={{
              fontSize: 11, fontFamily: "var(--font-heading)", fontWeight: 700,
              color: "#4a7840", background: "#deecd6",
              borderRadius: 6, padding: "2px 8px",
            }}>
              ✂️ 包丁いらず
            </span>
          )}
        </div>

        {/* Mini nutrition strip */}
        <div style={{
          display: "flex", gap: 8, marginTop: 10,
          paddingTop: 10, borderTop: "1px solid var(--border)",
        }}>
          {[
            { label: "P", value: recipe.nutrition.protein, color: "#3b82f6" },
            { label: "F", value: recipe.nutrition.fat,     color: "#f97316" },
            { label: "C", value: recipe.nutrition.carbs,   color: "#eab308" },
          ].map(n => (
            <div key={n.label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 9, fontFamily: "var(--font-heading)", fontWeight: 700, color: n.color, marginBottom: 2 }}>{n.label}</div>
              <div style={{ fontSize: 11, fontFamily: "var(--font-heading)", fontWeight: 800, color: "var(--text-primary)" }}>{n.value}g</div>
            </div>
          ))}
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 9, fontFamily: "var(--font-heading)", fontWeight: 700, color: "#ef4444", marginBottom: 2 }}>塩</div>
            <div style={{ fontSize: 11, fontFamily: "var(--font-heading)", fontWeight: 800, color: "var(--text-primary)" }}>{recipe.nutrition.salt}g</div>
          </div>
        </div>
      </div>
    </button>
  );
}

function StepDiagram({ recipe, meta }: { recipe: Recipe; meta: typeof CATEGORY_META[keyof typeof CATEGORY_META] }) {
  const [guide, setGuide] = useState<StepGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"steps" | "diagram">("steps");

  const fetchDiagram = useCallback(async () => {
    if (guide) { setMode("diagram"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/generate-steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dish: recipe.name, ingredients: recipe.ingredients, steps: recipe.steps }),
      });
      const data: StepGuide = await res.json();
      setGuide(data);
      setMode("diagram");
    } catch { /* fallback to plain steps */ }
    finally { setLoading(false); }
  }, [guide, recipe]);

  return (
    <div>
      {/* Mode toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12, color: meta.color, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
          手順
        </h3>
        <button
          onClick={mode === "steps" ? fetchDiagram : () => setMode("steps")}
          disabled={loading}
          style={{
            padding: "4px 12px", borderRadius: 20, border: `1px solid ${meta.color}`,
            background: mode === "diagram" ? meta.color : "#fff",
            color: mode === "diagram" ? "#fff" : meta.color,
            fontSize: 11, fontFamily: "var(--font-heading)", fontWeight: 700,
            cursor: loading ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 5,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", border: `2px solid ${meta.color}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} /> 生成中</>
          ) : mode === "diagram" ? "📝 テキスト表示" : "✏️ 図解を見る"}
        </button>
      </div>

      {mode === "steps" || !guide ? (
        /* Plain step list */
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recipe.steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: meta.color, color: "#fff", fontSize: 11, fontFamily: "var(--font-heading)", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {i + 1}
              </div>
              <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, paddingTop: 3 }}>{step}</span>
            </div>
          ))}
        </div>
      ) : (
        /* Diagram grid — all steps visible at once, no scroll */
        <div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12, textAlign: "right" }}>
            合計時間: <strong style={{ color: "var(--text-primary)" }}>{guide.totalTime}</strong>
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(guide.steps.length, 3)}, 1fr)`,
            gap: 8,
          }}>
            {guide.steps.map((step) => (
              <div key={step.num} style={{
                background: meta.bg, borderRadius: 14, padding: "12px 10px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                textAlign: "center", border: `1px solid ${meta.color}20`,
                position: "relative",
              }}>
                {/* Step number */}
                <div style={{ position: "absolute", top: 8, left: 8, width: 18, height: 18, borderRadius: "50%", background: meta.color, color: "#fff", fontSize: 9, fontFamily: "var(--font-heading)", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {step.num}
                </div>
                <span style={{ fontSize: 28, lineHeight: 1, marginTop: 6 }}>{step.emoji}</span>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 12, color: meta.color }}>{step.title}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>{step.action}</div>
                {step.tip && (
                  <div style={{ fontSize: 10, color: meta.color, background: "#fff", borderRadius: 8, padding: "3px 8px", border: `1px solid ${meta.color}30`, lineHeight: 1.5 }}>
                    💡 {step.tip}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecipeModal({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const meta = CATEGORY_META[recipe.category];
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 24, width: "100%", maxWidth: 520,
          maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        }}
      >
        {/* Modal image */}
        <div style={{
          height: 160, background: meta.gradient, flexShrink: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 8, position: "relative",
        }}>
          <span style={{ fontSize: 52 }}>{meta.emoji}</span>
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 14, right: 14,
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(0,0,0,0.15)", border: "none",
              color: "#fff", fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >×</button>
        </div>

        {/* Modal content */}
        <div style={{ overflowY: "auto", padding: "24px 28px 32px" }}>
          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              display: "inline-flex", alignItems: "center",
              background: meta.bg, color: meta.color,
              borderRadius: 20, padding: "2px 12px",
              fontSize: 10, fontFamily: "var(--font-heading)", fontWeight: 700,
              letterSpacing: "0.04em", marginBottom: 10,
            }}>
              {recipe.category}
            </div>
            <h2 style={{
              fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 22,
              color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 8,
            }}>
              {recipe.name}
            </h2>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>⏱ {recipe.time}</span>
              <span style={{
                fontSize: 12, fontFamily: "var(--font-heading)", fontWeight: 700,
                color: DIFFICULTY_COLOR[recipe.difficulty],
              }}>
                難易度：{recipe.difficulty}
              </span>
              {recipe.noKnife && (
                <span style={{
                  fontSize: 12, fontFamily: "var(--font-heading)", fontWeight: 700,
                  color: "#4a7840", background: "#deecd6",
                  borderRadius: 8, padding: "3px 10px",
                }}>
                  ✂️ 包丁いらず
                </span>
              )}
            </div>
          </div>

          {/* Nutrition */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{
              fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12,
              color: meta.color, letterSpacing: "0.08em", textTransform: "uppercase",
              marginBottom: 10,
            }}>
              栄養成分（1人分）
            </h3>
            <NutritionTable nutrition={recipe.nutrition} />
          </div>

          {/* Ingredients */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{
              fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12,
              color: meta.color, letterSpacing: "0.08em", textTransform: "uppercase",
              marginBottom: 10,
            }}>
              材料
            </h3>
            <div style={{
              background: meta.bg, borderRadius: 12, padding: "14px 16px",
              display: "flex", flexDirection: "column", gap: 6,
            }}>
              {recipe.ingredients.map((ing, i) => (
                <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                  <span style={{ color: meta.color, fontSize: 10, flexShrink: 0 }}>●</span>
                  {ing}
                </div>
              ))}
            </div>
          </div>

          {/* Steps + Diagram toggle */}
          <StepDiagram recipe={recipe} meta={meta} />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export default function RecipesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<Category>("すべて");
  const [noKnifeOnly, setNoKnifeOnly] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const filtered = RECIPES
    .filter(r => activeCategory === "すべて" || r.category === activeCategory)
    .filter(r => !noKnifeOnly || r.noKnife);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(245,243,238,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)", padding: "0 20px",
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none" }}>
            <KoocaBowlIcon size={34} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                メシ<span style={{ color: "var(--accent)" }}>リスト</span>
              </span>
              <span style={{ fontFamily: "var(--font-pacifico)", fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.02em" }}>by kooca</span>
            </div>
          </a>
          <div style={{ display: "flex", gap: 8 }}>
            <a href="/recipes" style={{
              padding: "7px 14px", borderRadius: 8, fontSize: 12,
              fontFamily: "var(--font-heading)", fontWeight: 700,
              color: "var(--accent-dark)", background: "var(--accent-light)",
              textDecoration: "none", border: "1px solid rgba(230,149,26,0.2)",
            }}>
              レシピ集
            </a>
            <button
              onClick={() => router.push("/app")}
              style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
            >
              献立を生成する ✨
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding: "48px 20px 32px", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#deecd6", borderRadius: 20, padding: "4px 14px", marginBottom: 16,
        }}>
          <span style={{ fontSize: 12 }}>📖</span>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 11, fontWeight: 700, color: "#2f5228", letterSpacing: "0.08em" }}>
            {RECIPES.length}品のレシピ・カロリー付き
          </span>
        </div>
        <h1 style={{
          fontFamily: "var(--font-heading)", fontWeight: 800,
          fontSize: "clamp(24px, 4vw, 36px)", letterSpacing: "-0.03em",
          color: "var(--text-primary)", marginBottom: 8,
        }}>
          レシピ集
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          カードをタップするとカロリー・栄養素・手順を確認できます。
        </p>
      </div>

      {/* Category filter */}
      <div style={{
        position: "sticky", top: 56, zIndex: 40,
        background: "rgba(245,243,238,0.95)", backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border)", padding: "10px 20px",
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "6px 16px", borderRadius: 20, border: "1px solid",
                borderColor: activeCategory === cat ? "var(--accent)" : "var(--border)",
                background: activeCategory === cat ? "var(--accent)" : "#fff",
                color: activeCategory === cat ? "#fff" : "var(--text-secondary)",
                fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12,
                cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
              }}
            >
              {cat === "すべて" ? `すべて (${RECIPES.length})` : cat}
            </button>
          ))}
          {/* Divider */}
          <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />
          {/* No-knife toggle */}
          <button
            onClick={() => setNoKnifeOnly(v => !v)}
            style={{
              padding: "6px 14px", borderRadius: 20, border: "1px solid",
              borderColor: noKnifeOnly ? "#4a7840" : "var(--border)",
              background: noKnifeOnly ? "#4a7840" : "#fff",
              color: noKnifeOnly ? "#fff" : "var(--text-secondary)",
              fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12,
              cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            ✂️ 包丁いらず
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px 60px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
              該当するレシピがありません
            </div>
            <div style={{ fontSize: 13 }}>フィルターを変えて試してみてください</div>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
          }}>
            {filtered.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} onClick={() => setSelectedRecipe(recipe)} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div style={{ background: "#fff", borderTop: "1px solid var(--border)", padding: "32px 20px", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>
          気になる料理が見つかったら、AIで献立に組み込んでみよう
        </p>
        <button
          onClick={() => router.push("/app")}
          style={{
            padding: "14px 36px", borderRadius: 12, border: "none",
            background: "var(--accent)", color: "#fff",
            fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15,
            cursor: "pointer", boxShadow: "0 4px 16px rgba(230,149,26,0.3)",
            transition: "transform 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = ""}
        >
          献立を生成する ✨
        </button>
      </div>

      {/* Modal */}
      {selectedRecipe && (
        <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
      )}
    </div>
  );
}
