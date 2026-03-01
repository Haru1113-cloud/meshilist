import { NextRequest } from "next/server";

const MOCK_IMAGE_URL = "";

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

  const prompt = `「${dish}」の完成料理イラスト。温かみのあるクリーム色の背景に、美しく盛り付けられた${dish}を手描き水彩スタイルで描いてください。主な食材も周囲にさりげなく配置。Studio Ghibli風の食べ物イラスト、温かいオレンジ・茶色トーン。テキストや文字は一切不要。料理のみのシンプルで美しいイラスト。`;

  try {
    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "medium",
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
