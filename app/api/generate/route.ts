import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { initUser, canGenerate } from "@/lib/trial";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const { ingredients, familySize, disliked, style, days, deviceId } =
    await request.json();

  if (!deviceId || !ingredients) {
    return new Response("Missing required fields", { status: 400 });
  }

  initUser(deviceId);

  if (!canGenerate(deviceId)) {
    return new Response("Trial expired", { status: 402 });
  }

  const systemPrompt = `あなたはプロの栄養士兼料理研究家です。忙しい家庭向けに、現実的で作りやすい献立を提案してください。`;

  const isTonightMode = days === "today";

  const userPrompt = isTonightMode
    ? `以下の条件で今夜の夕食を1品提案してください。

- 使える食材: ${ingredients}
- 人数: ${familySize}人
- 苦手・アレルギー: ${disliked || "特になし"}
- 料理スタイル: ${style}

## 出力形式

### 📅 献立表
| 日 | 夕食 |
|---|---|
| 今夜 | （料理名） |

### 🍳 レシピ概要
**（料理名）**
材料: （人数分の材料）
手順:
1. 〜
2. 〜
3. 〜
4. 〜
5. 〜

### 🛒 買い物リスト
食材カテゴリ別（肉類・魚介類・野菜・調味料など）に整理してください。`
    : `以下の条件で${days}日分の献立を作成してください。

- 使える食材: ${ingredients}
- 人数: ${familySize}人
- 苦手・アレルギー: ${disliked || "特になし"}
- 料理スタイル: ${style}

## 出力形式

### 📅 献立表
| 日 | 朝食 | 昼食 | 夕食 |
|---|---|---|---|
（${days}日分を埋めてください）

### 🍳 レシピ概要（夕食のみ）
各夕食料理の材料と簡単な手順（5ステップ以内）

### 🛒 まとめ買いリスト
食材カテゴリ別（肉類・魚介類・野菜・調味料など）に整理してください。`;

  const stream = client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch {
        controller.error(new Error("Generation failed"));
      }
    },
    async cancel() {
      stream.abort();
    },
  });

  return new Response(readableStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
