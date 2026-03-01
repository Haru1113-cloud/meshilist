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

  const prompt = `A beautiful Japanese cookbook watercolor illustration of "${dish}". The finished dish beautifully presented in a bowl or plate, surrounded by its key ingredients arranged artistically. Warm cozy home cooking aesthetic, hand-drawn watercolor style with clean line art, cream/beige background, soft orange and brown tones, Studio Ghibli food art style. The illustration is clean, detailed, and appetizing. CRITICAL: zero text, zero letters, zero numbers, zero words, zero labels of any kind anywhere in the image. Pure illustration only, no typography whatsoever.`;

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
