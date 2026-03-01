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

  const stepsJa = Array.isArray(steps) && steps.length > 0
    ? steps.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")
    : "";

  const stepCount = Array.isArray(steps) && steps.length > 0 ? steps.length : 5;
  const cols = stepCount <= 3 ? stepCount : 3;
  const rows = Math.ceil(stepCount / cols);

  const prompt = `日本の家庭料理レシピカードのイラスト。料理名：「${dish}」。

温かみのあるクリーム色の背景に、${rows}行×${cols}列のグリッドレイアウトで作り方を図解してください。
各コマには手描き水彩風のかわいい料理イラストと、以下の日本語テキストを明確に表示してください：

${stepsJa}

デザイン要件：
- 各コマに丸数字（①②③…）と日本語の手順テキストを読みやすく配置
- コマ間には矢印（→）でつなぐ
- 手描き水彩＋ライン画のスタイル
- 温かいオレンジ・茶色トーン
- 「${dish}」のタイトルを上部に太字で表示
- Studio Ghibli風の食べ物イラスト

料理のイラストは鮮明で食欲をそそるものにしてください。`;

  try {
    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1536x1024",
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
