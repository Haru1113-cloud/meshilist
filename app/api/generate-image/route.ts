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

  const prompt = `Professional food photography of Japanese home-cooked "${dish}". Beautifully plated in an artisan ceramic dish on a wooden table. Warm side lighting. Visible steam. Vibrant colors. Shallow depth of field. No text, no watermark.`;

  // JPEG + compression で PNG 比 1/5〜1/8 に削減 → Vercel 4.5MB 上限・タイムアウト対策
  const genParams = {
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1024x1024" as const,
    quality: "low" as const, // 速度優先（low が最速）
    output_format: "jpeg",
    output_compression: 75,
  };

  // 失敗時に1回リトライ
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (client.images.generate as (p: any) => Promise<any>)(genParams);

      const b64: string | undefined = response.data?.[0]?.b64_json;
      const url: string = response.data?.[0]?.url ?? "";

      await incrementImageGeneration(deviceId);

      if (b64) {
        // JPEG b64 → data URL（正しい MIME タイプ）
        return Response.json({ dataUrl: `data:image/jpeg;base64,${b64}` });
      }
      return Response.json({ url });
    } catch (e) {
      console.error(`generate-image error (attempt ${attempt + 1}):`, e);
      if (attempt === 1) {
        return Response.json({ error: "Image generation failed" }, { status: 500 });
      }
      // 1秒待ってリトライ
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return Response.json({ error: "Image generation failed" }, { status: 500 });
}
