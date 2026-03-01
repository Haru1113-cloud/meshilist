import { NextRequest } from "next/server";

// モック用プレースホルダー（APIキー未設定時）
const MOCK_IMAGE_URL = ""; // 空文字 = 表示しない

export async function POST(request: NextRequest) {
  const { dish } = await request.json();

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

  const prompt = `Japanese home cooking recipe illustration of "${dish}". Warm watercolor and line art style, cozy cookbook aesthetic, cream/beige background. Shows the finished dish beautifully plated. Cute and inviting, hand-drawn look with gentle warm colors. No text or labels in the image.`;

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
