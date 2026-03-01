import { NextRequest } from "next/server";
import { initUser, canGenerate } from "@/lib/trial";

const MOCK_OUTPUT_WEEK = `### 📅 献立表
| 日 | 朝食 | 昼食 | 夕食 |
|---|---|---|---|
| 月 | トースト・目玉焼き | 鶏そぼろ丼 | 肉じゃが |
| 火 | 納豆ご飯・味噌汁 | 豚汁うどん | 鮭の塩焼き・ほうれん草のおひたし |
| 水 | ヨーグルト・バナナ | ツナサンド | 鶏の照り焼き・ブロッコリー |
| 木 | オートミール | 野菜炒め定食 | 豚の生姜焼き・キャベツ千切り |
| 金 | 和定食（ご飯・焼き魚） | 親子丼 | 麻婆豆腐・ご飯 |
| 土 | パンケーキ・ベーコンエッグ | 冷やし中華 | 焼肉・わかめスープ |
| 日 | ご飯・お味噌汁・漬物 | ざるそば | すき焼き・ご飯 |

### 🍳 レシピ概要（夕食のみ）
**肉じゃが**
📊 290kcal / P:14g / F:10g / C:36g / 塩:2.2g
材料: 牛肉200g・じゃがいも3個・玉ねぎ1個・にんじん1本・糸こんにゃく・だし汁300ml・醤油大さじ3・みりん大さじ2・砂糖大さじ1
手順:
1. 野菜を一口大に切り、牛肉は食べやすい大きさに切る
2. 鍋にサラダ油を熱し、牛肉を炒めて色が変わったら野菜を加える
3. だし汁・醤油・みりん・砂糖を加えて中火で煮る
4. 野菜が柔らかくなるまで約15分煮込む
5. 火を止めて味をなじませ、器に盛る

**鮭の塩焼き・ほうれん草のおひたし**
📊 240kcal / P:26g / F:10g / C:5g / 塩:1.8g
材料: 鮭の切り身2切れ・塩少々・ほうれん草1束・醤油・かつお節
手順:
1. 鮭に塩を振って10分おき、余分な水分をキッチンペーパーで拭く
2. グリルを予熱し、鮭を両面こんがり焼く（各4〜5分）
3. ほうれん草はさっと茹でて水にさらし、水気を絞る
4. ほうれん草を食べやすい長さに切り、醤油をかけてかつお節をのせる
5. 鮭とほうれん草を盛り合わせて完成

**鶏の照り焼き・ブロッコリー**
📊 310kcal / P:28g / F:16g / C:12g / 塩:1.6g
材料: 鶏もも肉2枚・醤油大さじ2・みりん大さじ2・砂糖大さじ1・サラダ油・ブロッコリー1株
手順:
1. 鶏肉は皮目にフォークで数か所穴をあけ、一口大に切る
2. フライパンに油を熱し、鶏肉を皮目から焼く
3. 両面焼き色がついたら、合わせたタレを加えて絡める
4. 蓋をして弱火で5分蒸し焼きにする
5. ブロッコリーを茹でて添えて完成

### 🛒 まとめ買いリスト
【肉類・魚介類】
- 牛薄切り肉 200g
- 鮭の切り身 2切れ
- 鶏もも肉 2枚
- 豚ロース薄切り 200g

【野菜】
- じゃがいも 3個
- 玉ねぎ 2個
- にんじん 1本
- ほうれん草 1束
- ブロッコリー 1株
- キャベツ 1/4個

【大豆・卵・乳製品】
- 豆腐 1丁
- 卵 6個
- 納豆 3パック

【調味料・その他】
- だし汁（または顆粒だし）
- 醤油
- みりん・砂糖
- 糸こんにゃく 1袋`;

const MOCK_OUTPUT_NOKNIFE_WEEK = `### 📅 献立表
| 日 | 朝食 | 昼食 | 夕食 |
|---|---|---|---|
| 月 | ヨーグルト・バナナ・グラノーラ | 納豆ご飯・お味噌汁 | 鮭の塩焼き・もやしナムル |
| 火 | トースト・ゆで卵 | ツナ缶サラダご飯 | だし巻き卵・豆腐の味噌汁 |
| 水 | オートミール・はちみつ | 卵かけご飯・ほうれん草おひたし | 豚バラともやし炒め |
| 木 | ヨーグルト・果物 | ちくわとネギの醤油炒めご飯 | 蒸し豚ともやしのポン酢がけ |
| 金 | 納豆ご飯・味噌汁 | サバ缶の冷奴のせ | 鮭フレークとほうれん草の炒め |
| 土 | パン・スクランブルエッグ | そうめん・ツナ缶のせ | だし巻き卵・もやしスープ |
| 日 | ご飯・味噌汁・焼き魚 | 冷やっこ・納豆ご飯 | 豚バラともやし炒め・ゆで卵 |

### 🍳 レシピ概要（夕食のみ）
**鮭の塩焼き・もやしナムル**
📊 230kcal / P:24g / F:11g / C:5g / 塩:1.4g
材料: 鮭の切り身2切れ・塩少々・もやし1袋・ごま油小さじ1・塩・鶏がらスープの素少々・いりごま
手順:
1. 鮭に塩を振って10分おき、キッチンペーパーで水分を拭く
2. グリルを予熱して鮭を両面こんがり焼く（各4〜5分）
3. もやしをさっと茹で（1分）、ざるに上げて水気を切る
4. もやしにごま油・塩・鶏がらスープの素を合わせて和える
5. いりごまをふって鮭と盛り合わせて完成

**だし巻き卵・豆腐の味噌汁**
📊 200kcal / P:14g / F:13g / C:6g / 塩:1.6g
材料: 卵3個・だし汁大さじ3・醤油小さじ1・みりん小さじ1・豆腐1/2丁・わかめ・味噌大さじ1.5・だし汁400ml
手順:
1. 卵・だし汁・醤油・みりんをよく混ぜる
2. 玉子焼き器に油を薄く引き、卵液を3回に分けて巻く
3. 鍋にだし汁を温め、食べやすく手でちぎった豆腐を加える
4. わかめを加えてひと煮立ちしたら味噌を溶き入れる
5. だし巻き卵と味噌汁を盛り付けて完成

**豚バラともやし炒め**
📊 310kcal / P:16g / F:22g / C:8g / 塩:1.5g
材料: 豚バラ薄切り150g・もやし1袋・ニラ1/2束・醤油・酒各大さじ1・ごま油少々
手順:
1. 豚肉はキッチンバサミで食べやすい大きさに切る
2. フライパンにごま油を熱し、豚肉を炒める
3. もやしを加えてさらに炒める
4. ニラはハサミで5cm幅に切って加え、醤油・酒で味を調える
5. さっと混ぜて完成

### 🛒 まとめ買いリスト
【肉類・魚介類】
- 豚バラ薄切り 300g
- 鮭の切り身 4切れ

【卵・大豆】
- 卵 1パック（10個）
- 豆腐 1丁
- 納豆 3パック

【野菜】
- もやし 3袋
- ほうれん草 1束
- ニラ 1束

【その他・調味料】
- だし汁（または顆粒だし）
- 醤油・みりん
- ごま油
- 味噌`;

const MOCK_OUTPUT_TODAY = `### 📅 献立表
| 日 | 夕食 |
|---|---|
| 今夜 | 豚の生姜焼き |

### 🍳 レシピ概要
**豚の生姜焼き**
📊 380kcal / P:22g / F:24g / C:14g / 塩:1.8g
材料: 豚ロース薄切り200g・生姜1かけ・醤油大さじ2・みりん大さじ2・酒大さじ1・キャベツ適量
手順:
1. 生姜はすりおろし、醤油・みりん・酒と合わせてタレを作る
2. 豚肉をタレに10分ほど漬け込む
3. フライパンを中火で熱し、豚肉を広げて焼く
4. 焼き色がついたら裏返し、残りのタレを加えて絡める
5. キャベツの千切りを添えて完成

### 🛒 まとめ買いリスト
【肉類】
- 豚ロース薄切り 200g

【野菜】
- キャベツ 1/4個
- 生姜 1かけ

【調味料】
- 醤油
- みりん
- 料理酒`;

async function streamMockResponse(text: string): Promise<ReadableStream> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for (const char of text) {
        controller.enqueue(encoder.encode(char));
        await new Promise((r) => setTimeout(r, 6));
      }
      controller.close();
    },
  });
}

export async function POST(request: NextRequest) {
  const { ingredients, familySize, disliked, style, days, deviceId, noKnife, cookTime } =
    await request.json();

  if (!deviceId || !ingredients) {
    return new Response("Missing required fields", { status: 400 });
  }

  initUser(deviceId);

  if (!canGenerate(deviceId)) {
    return new Response("Trial expired", { status: 402 });
  }

  // APIキー未設定の場合はモック献立を返す
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.startsWith("sk-ant-")) {
    let mockText: string;
    if (days === "today") {
      mockText = MOCK_OUTPUT_TODAY;
    } else if (noKnife) {
      mockText = MOCK_OUTPUT_NOKNIFE_WEEK;
    } else {
      mockText = MOCK_OUTPUT_WEEK;
    }
    const mockStream = await streamMockResponse(mockText);
    return new Response(mockStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const noKnifeInstruction = noKnife
    ? "包丁を使わずキッチンバサミや手でちぎるだけで作れる料理のみにしてください。"
    : "";

  const cookTimeLabel =
    cookTime === "quick" ? "15分以内" :
    cookTime === "slow"  ? "1時間程度" :
    "30分程度";

  const systemPrompt = `あなたは15年以上の経験を持つプロの家庭料理人です。家族のために心のこもった、本格的かつ現実的な献立を提案してください。旬の食材を活かし、栄養バランスと美味しさを両立した、愛情のある料理を心がけてください。カップ麺・インスタント食品・冷凍食品は絶対に含めないでください。${noKnifeInstruction}`;

  const isTonightMode = days === "today";

  const userPrompt = isTonightMode
    ? `以下の条件で今夜の夕食を1品提案してください。

- 使える食材: ${ingredients}
- 人数: ${familySize}人
- 苦手・アレルギー: ${disliked || "特になし"}
- 料理スタイル: ${style}
- 1品あたりの調理時間: ${cookTimeLabel}

## 出力形式

### 📅 献立表
| 日 | 夕食 |
|---|---|
| 今夜 | （料理名） |

### 🍳 レシピ概要
**（料理名）**
📊 （カロリー数字のみ）kcal / P:（g数字のみ）g / F:（g数字のみ）g / C:（g数字のみ）g / 塩:（g数字のみ）g
材料: （材料を「食材200g・調味料大さじ1」のようにカンマ区切りで1行に）
手順:
1. 〜
2. 〜
3. 〜
4. 〜
5. 〜

出力例（この形式を厳守）：
**豚の生姜焼き**
📊 380kcal / P:22g / F:24g / C:14g / 塩:1.8g
材料: 豚ロース薄切り200g・生姜1かけ・醤油大さじ2・みりん大さじ2・酒大さじ1・キャベツ適量
手順:
1. 生姜をすりおろし醤油・みりん・酒と合わせてタレを作る
2. 豚肉をタレに10分漬け込む
3. フライパンを中火で熱し豚肉を広げて焼く
4. 焼き色がついたら裏返し残りのタレを加えて絡める
5. キャベツの千切りを添えて完成

### 🛒 買い物リスト
食材カテゴリ別（肉類・魚介類・野菜・調味料など）に整理してください。`
    : `以下の条件で${days}日分の献立を作成してください。

- 使える食材: ${ingredients}
- 人数: ${familySize}人
- 苦手・アレルギー: ${disliked || "特になし"}
- 料理スタイル: ${style}
- 1品あたりの調理時間: ${cookTimeLabel}

## 出力形式

### 📅 献立表
| 日 | 朝食 | 昼食 | 夕食 |
|---|---|---|---|
（${days}日分を埋めてください）

### 🍳 レシピ概要（夕食のみ）
各夕食料理を以下の形式で記載してください（表・箇条書き・説明文は一切不要。この形式のみ）：
**（料理名）**
📊 （カロリー数字のみ）kcal / P:（g数字のみ）g / F:（g数字のみ）g / C:（g数字のみ）g / 塩:（g数字のみ）g
材料: （材料を「食材200g・調味料大さじ1」のようにカンマ区切りで1行に）
手順:
1. 〜（5ステップ以内）

出力例（この形式を厳守）：
**豚の生姜焼き**
📊 380kcal / P:22g / F:24g / C:14g / 塩:1.8g
材料: 豚ロース薄切り200g・生姜1かけ・醤油大さじ2・みりん大さじ2・酒大さじ1・キャベツ適量
手順:
1. 生姜をすりおろし醤油・みりん・酒と合わせてタレを作る
2. 豚肉をタレに10分漬け込む
3. フライパンを中火で熱し豚肉を広げて焼く
4. 焼き色がついたら裏返し残りのタレを加えて絡める
5. キャベツの千切りを添えて完成

### 🛒 まとめ買いリスト
食材カテゴリ別（肉類・魚介類・野菜・調味料など）に整理してください。`;

  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
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
