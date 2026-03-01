import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { dish } = await request.json();

  if (!dish) {
    return Response.json({ error: "Missing dish name" }, { status: 400 });
  }

  const apiKey = process.env.AIML_API_KEY;
  if (!apiKey) {
    await new Promise((r) => setTimeout(r, 500));
    return Response.json({ url: "" });
  }

  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.aimlapi.com/v1",
  });

  const prompt = `日本の家庭料理「${dish}」の作り方を示した手描き風レシピイラスト。
上部に「作り方」という見出し。
6〜8ステップをグリッド（3列×2〜3行）に配置。
各セルに：ステップ番号（1、2、3…）、調理内容を説明する短い日本語テキスト（例：「玉ねぎをみじん切りにする」）、その調理工程を表すかわいい手描き風の鍋・ボウル・食材のイラスト。
スタイル：日本の料理本・レシピカードのような温かみのある手描き風イラスト、鉛筆・水彩タッチ、クリーム色の背景、やわらかい茶系・オレンジ系の配色。
テキストはすべて日本語。ステップ番号は丸囲み数字または太字。`;

  try {
    const response = await client.images.generate({
      model: "google/gemini-3-pro-image-preview",
      prompt,
      n: 1,
      // @ts-ignore
      aspect_ratio: "16:9",
    });

    const url = response.data?.[0]?.url ?? "";
    const b64 = (response.data?.[0] as { b64_json?: string })?.b64_json;
    if (!url && b64) return Response.json({ b64 });
    return Response.json({ url });
  } catch (e) {
    console.error("generate-process-image error:", e);
    return Response.json({ error: "Image generation failed" }, { status: 500 });
  }
}
