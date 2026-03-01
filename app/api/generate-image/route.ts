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

  const stepList = Array.isArray(steps) && steps.length > 0
    ? steps.slice(0, 6).map((s: string, i: number) => `${i + 1}. ${s}`).join("／")
    : "";

  const prompt = stepList
    ? `日本の家庭料理「${dish}」の作り方イラストカード。クリーム色の背景。手描き水彩スタイル。以下の手順を2行3列（最大6コマ）のグリッドで図解してください：${stepList}。各コマに①②③…の丸数字、調理シーンのイラスト（フライパン・鍋・食材など）、短い日本語キャプションを大きめの文字で。コマ間に矢印。Studio Ghibli風のかわいい食べ物イラスト。温かいオレンジ・茶色トーン。`
    : `「${dish}」の完成料理イラスト。クリーム色の背景に手描き水彩スタイルで描いてください。Studio Ghibli風、温かいオレンジ・茶色トーン。`;

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
