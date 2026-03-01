import { NextRequest } from "next/server";

const MOCK_IMAGE_URL = "";

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

  const prompt = `A beautiful, appetizing top-down photo of Japanese home-cooked "${dish}" served in a ceramic bowl on a warm wooden table. Soft natural lighting, shallow depth of field, food magazine style. Warm pastel tones, cozy and inviting atmosphere. No text, no watermark.`;

  try {
    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "low",
    });

    const url = response.data?.[0]?.url ?? "";

    // gpt-image-1 may return base64 instead of URL
    const b64 = (response.data?.[0] as { b64_json?: string })?.b64_json;
    if (!url && b64) {
      return Response.json({ b64 });
    }

    return Response.json({ url });
  } catch (e) {
    console.error("generate-image error:", e);
    return Response.json({ error: "Image generation failed" }, { status: 500 });
  }
}
