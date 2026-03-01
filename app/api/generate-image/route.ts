import { NextRequest } from "next/server";

// モック用プレースホルダー（APIキー未設定時）
const MOCK_IMAGE_URL = ""; // 空文字 = 表示しない

export async function POST(request: NextRequest) {
  const { dish, steps } = await request.json();

  if (!dish) {
    return Response.json({ error: "Missing dish name" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !apiKey.startsWith("sk-")) {
    await new Promise((r) => setTimeout(r, 500));
    return Response.json({ url: MOCK_IMAGE_URL });
  }

  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });

  const stepCount = Array.isArray(steps) ? steps.length : 4;
  const stepsDesc = Array.isArray(steps) && steps.length > 0
    ? steps.map((s: string, i: number) => `panel ${i + 1}: ${s}`).join(" | ")
    : "";

  const prompt = `A cute Japanese cookbook-style recipe illustration card for "${dish}". ${stepCount} panels arranged in a 2-row grid, each panel showing one cooking action with hand-drawn watercolor illustrations of food and kitchen utensils. ${stepsDesc}. Style: warm watercolor, cozy home cooking, cream background, orange and brown tones, Studio Ghibli food aesthetic. IMPORTANT: absolutely no text, no letters, no numbers, no labels, no characters of any language anywhere in the image. Pure illustration only.`;

  try {
    const response = await client.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "vivid",
    });

    const url = response.data?.[0]?.url ?? "";
    return Response.json({ url });
  } catch (e) {
    console.error("generate-image error:", e);
    return Response.json({ error: "Image generation failed" }, { status: 500 });
  }
}
