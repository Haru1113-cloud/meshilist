import { NextRequest } from "next/server";

// ── 型定義 ───────────────────────────────────────────────────────
export interface IngredientGroup {
  category: string;
  emoji: string;
  items: string[];
}

export interface StepGuide {
  dish: string;
  totalTime: string;
  ingredientGroups?: IngredientGroup[];
  steps: {
    num: number;
    emoji: string;
    title?: string;
    action: string;
    heat?: string;
    time?: string;
    tip?: string;
  }[];
}

// ── モックデータ ──────────────────────────────────────────────────
const MOCK_STEP_GUIDE: StepGuide = {
  dish: "豚の生姜焼き",
  totalTime: "15分",
  ingredientGroups: [
    { category: "ベース", emoji: "🥩", items: ["豚ロース薄切り…200g"] },
    { category: "たれ", emoji: "🧄", items: ["生姜…1かけ", "醤油…大さじ2", "みりん…大さじ2", "酒…大さじ1"] },
    { category: "添え物", emoji: "🥬", items: ["キャベツ…適量"] },
  ],
  steps: [
    { num: 1, emoji: "🧄", action: "生姜をすりおろし醤油・みりん・酒と合わせてタレを作る" },
    { num: 2, emoji: "🥩", action: "豚肉をタレに10分漬け込む", time: "10分", tip: "漬けすぎると塩辛くなるので注意" },
    { num: 3, emoji: "🍳", action: "中火でフライパンを熱し油を薄く引く", heat: "中火" },
    { num: 4, emoji: "🔥", action: "豚肉を広げて並べ焼き色がつくまで動かさない", heat: "中火", time: "2〜3分" },
    { num: 5, emoji: "✅", action: "裏返して残りのタレを加え強火で絡めて完成", heat: "強火" },
  ],
};

export async function POST(request: NextRequest) {
  const { dish, ingredients, steps } = await request.json();

  if (!dish || !steps) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // APIキー未設定の場合はモックを返す
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.startsWith("sk-ant-")) {
    await new Promise((r) => setTimeout(r, 800));
    return Response.json({ ...MOCK_STEP_GUIDE, dish });
  }

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const prompt = `以下のレシピを、料理初心者でも一目でわかるイラスト風レシピカードデータに変換してください。

料理名: ${dish}
材料: ${Array.isArray(ingredients) ? ingredients.join("、") : ingredients}
手順:
${steps.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}

以下のJSON形式だけを返してください（マークダウンや説明文は一切不要）：
{
  "dish": "料理名",
  "totalTime": "合計時間（例: 20分）",
  "ingredientGroups": [
    {
      "category": "カテゴリ名（例: ベース、たれ、香り＆油、具材、仕上げ）",
      "emoji": "カテゴリを表す絵文字1つ",
      "items": ["食材名…分量", "食材名…分量"]
    }
  ],
  "steps": [
    {
      "num": 1,
      "emoji": "調理動作を表す絵文字1つ",
      "action": "具体的な説明。その手順で使う食材は分量も一緒に書く（例: 醤油大さじ2を加える）。40文字以内。",
      "heat": "弱火 または 中火 または 強火（火を使わない場合は省略）",
      "time": "所要時間（例: 1〜2分、省略可）",
      "tip": "コツや注意点（省略可、20文字以内）"
    }
  ]
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const guide: StepGuide = JSON.parse(jsonMatch[0]);
    return Response.json(guide);
  } catch (e) {
    console.error("generate-steps error:", e);
    return Response.json({ error: "Generation failed" }, { status: 500 });
  }
}
