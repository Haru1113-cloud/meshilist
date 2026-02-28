import { NextRequest } from "next/server";

// ── 図解ステップの型 ──────────────────────────────────────────────
export interface StepGuide {
  dish: string;
  totalTime: string;
  steps: {
    num: number;
    emoji: string;
    title: string;
    action: string;
    tip?: string;
  }[];
}

// ── モックデータ ──────────────────────────────────────────────────
const MOCK_STEP_GUIDE: StepGuide = {
  dish: "豚の生姜焼き",
  totalTime: "15分",
  steps: [
    { num: 1, emoji: "🧄", title: "タレを作る", action: "生姜をすりおろし、醤油・みりん・酒と混ぜ合わせる", tip: "生姜は皮ごとすりおろすと香りが強い" },
    { num: 2, emoji: "🥩", title: "肉を漬ける", action: "豚肉をタレに入れ10分漬け込む", tip: "漬けすぎると塩辛くなるので注意" },
    { num: 3, emoji: "🍳", title: "フライパン熱する", action: "中火でフライパンを熱し油を薄く引く" },
    { num: 4, emoji: "🔥", title: "肉を焼く", action: "豚肉を広げて並べ、焼き色がつくまで動かさない", tip: "片面2〜3分が目安" },
    { num: 5, emoji: "✅", title: "タレを絡める", action: "裏返して残りのタレを加えて強火で絡めて完成" },
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
    await new Promise((r) => setTimeout(r, 800)); // simulate latency
    return Response.json({ ...MOCK_STEP_GUIDE, dish });
  }

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const prompt = `以下のレシピの手順を、料理初心者でも直感的にわかる図解ステップに変換してください。

料理名: ${dish}
材料: ${Array.isArray(ingredients) ? ingredients.join("、") : ingredients}
手順:
${steps.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}

以下のJSON形式だけを返してください（マークダウンや説明文は一切不要）：
{
  "dish": "料理名",
  "totalTime": "合計時間（例: 20分）",
  "steps": [
    {
      "num": 1,
      "emoji": "動作を表す絵文字1つ",
      "title": "動作タイトル（6文字以内）",
      "action": "具体的な説明（35文字以内）",
      "tip": "コツや注意点（省略可、25文字以内）"
    }
  ]
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    // Extract JSON from response (strip any accidental markdown)
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const guide: StepGuide = JSON.parse(jsonMatch[0]);
    return Response.json(guide);
  } catch (e) {
    console.error("generate-steps error:", e);
    return Response.json({ error: "Generation failed" }, { status: 500 });
  }
}
