import { NextRequest } from "next/server";
import { canGenerateImage, getImageQuality, incrementImageGeneration } from "@/lib/trial";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { dish, deviceId } = await request.json();

  if (!dish) {
    return Response.json({ error: "Missing dish name" }, { status: 400 });
  }

  let canGen = false;
  let quality: "low" | "medium" | "high" = "low";
  try {
    canGen = await canGenerateImage(deviceId);
    quality = await getImageQuality(deviceId);
  } catch {
    // Redis unavailable (e.g. no internet in local dev) — allow with low quality
    canGen = true;
    quality = "low";
  }

  if (!deviceId || !canGen) {
    return Response.json({ url: "" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !apiKey.startsWith("sk-")) {
    await new Promise((r) => setTimeout(r, 500));
    return Response.json({ url: "" });
  }
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });

  const prompt = quality === "high"
    ? `Cinematic food photography of Japanese home-cooked "${dish}". Served in a handcrafted Japanese ceramic bowl on a dark wooden table. Soft natural window light from the left creating gentle highlights and realistic shadows. Thin wisps of steam rising. True-to-life food colors — vibrant and accurate, not warm-tinted or oversaturated. Bright green garnish. Ultra-sharp focus on the food, creamy bokeh background. 50mm f/1.8 lens. Editorial Japanese food magazine style. No text, no watermark.`
    : `Professional food photography of Japanese home-cooked "${dish}". Beautifully plated in an artisan ceramic dish on a rustic wooden table. Warm golden-hour side lighting creating depth and highlights. Visible steam rising gently. Glossy sauce glistening. Vibrant fresh colors — golden-brown crust, rich caramelized tones, bright green garnish. Shallow depth of field with soft bokeh background. Shot with a 50mm lens, f/1.8. Michelin-quality food styling. Utterly mouth-watering and irresistible. No text, no watermark.`;

  try {
    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024",
      quality,
    });

    await incrementImageGeneration(deviceId);

    const url = response.data?.[0]?.url ?? "";
    const b64 = (response.data?.[0] as { b64_json?: string })?.b64_json;
    if (!url && b64) return Response.json({ b64 });
    return Response.json({ url });
  } catch (e) {
    console.error("generate-image error:", e);
    return Response.json({ error: "Image generation failed" }, { status: 500 });
  }
}
