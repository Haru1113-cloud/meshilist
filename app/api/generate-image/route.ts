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

  const stepsText = Array.isArray(steps) && steps.length > 0
    ? steps.map((s: string, i: number) => `Step ${i + 1}: ${s}`).join(", ")
    : "";

  const prompt = `Japanese home cooking recipe step-by-step illustration for "${dish}". Watercolor and line art style, warm cream/beige background, cozy cookbook aesthetic. Shows all cooking steps arranged in a grid layout (like a recipe card): ${stepsText}. Each step in its own panel with cute hand-drawn illustrations of food ingredients and cooking utensils (frying pan, bowl, knife, etc). Arrows connecting each step. Warm orange and brown tones, inviting and charming style. No text or numbers in the image.`;

  try {
    const response = await client.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
      style: "natural",
    });

    const url = response.data?.[0]?.url ?? "";
    return Response.json({ url });
  } catch (e) {
    console.error("generate-image error:", e);
    return Response.json({ error: "Image generation failed" }, { status: 500 });
  }
}
