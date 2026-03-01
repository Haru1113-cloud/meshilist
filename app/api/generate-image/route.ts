import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { dish } = await request.json();

  if (!dish) {
    return Response.json({ error: "Missing dish name" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !apiKey.startsWith("sk-")) {
    await new Promise((r) => setTimeout(r, 500));
    return Response.json({ url: "" });
  }

  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });

  const prompt = `Professional food photography of Japanese home-cooked "${dish}". Beautifully plated in an artisan ceramic dish on a rustic wooden table. Warm golden-hour side lighting creating depth and highlights. Visible steam rising gently. Glossy sauce glistening. Vibrant fresh colors — golden-brown crust, rich caramelized tones, bright green garnish. Shallow depth of field with soft bokeh background. Shot with a 50mm lens, f/1.8. Michelin-quality food styling. Utterly mouth-watering and irresistible. No text, no watermark.`;

  try {
    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "low",
    });

    const url = response.data?.[0]?.url ?? "";
    const b64 = (response.data?.[0] as { b64_json?: string })?.b64_json;
    if (!url && b64) return Response.json({ b64 });
    return Response.json({ url });
  } catch (e) {
    console.error("generate-image error:", e);
    return Response.json({ error: "Image generation failed" }, { status: 500 });
  }
}
