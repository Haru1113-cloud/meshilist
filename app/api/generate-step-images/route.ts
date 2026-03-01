import { NextRequest } from "next/server";
import type { StepGuide } from "@/app/api/generate-steps/route";

type Step = StepGuide["steps"][number];

async function generateStepImage(
  ai: InstanceType<typeof import("@google/genai").GoogleGenAI>,
  step: Step,
  dish: string
): Promise<string> {
  const prompt = `日本の家庭料理「${dish}」の調理手順イラスト。
手順${step.num}: ${step.action}${step.heat ? `（${step.heat}）` : ""}${step.time ? `、${step.time}` : ""}。
明るく親しみやすいイラスト風、白背景。画像の中に「STEP ${step.num}」のテキストを大きく表示。
シンプルで見やすく、料理初心者にわかりやすいビジュアル。`;

  const response = await ai.models.generateImages({
    model: "imagen-3.0-generate-002",
    prompt,
    config: { numberOfImages: 1, aspectRatio: "1:1" },
  });

  const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
  return imageBytes ? `data:image/png;base64,${imageBytes}` : "";
}

export async function POST(request: NextRequest) {
  const { steps, dish }: { steps: Step[]; dish: string } = await request.json();

  if (!steps || !dish) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    // APIキー未設定時はモック（空配列）を返す
    await new Promise((r) => setTimeout(r, 500));
    return Response.json({ images: steps.map(() => "") });
  }

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });

  // 全ステップを並列生成
  const imagePromises = steps.map((step) =>
    generateStepImage(ai, step, dish).catch(() => "")
  );

  const images = await Promise.all(imagePromises);
  return Response.json({ images });
}
