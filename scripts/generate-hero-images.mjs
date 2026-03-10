/**
 * ヒーロー画像を1回だけ生成して public/hero-dishes/ に保存するスクリプト
 *
 * 使い方:
 *   OPENAI_API_KEY=sk-... node scripts/generate-hero-images.mjs
 *
 * 生成後はコードの imgSrc がそのまま使われるので、再実行不要。
 */

import { writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "../public/hero-dishes");

const DISHES = [
  { name: "豚の生姜焼き", file: "ginger-pork.jpg" },
  { name: "鶏むね肉の照り焼き", file: "teriyaki-chicken.jpg" },
  { name: "さばの味噌煮", file: "saba-miso.jpg" },
];

const PROMPT_TEMPLATE = (dish) =>
  `Professional food photography of Japanese home-cooked "${dish}". ` +
  `Beautifully plated in an artisan ceramic dish on a rustic wooden table. ` +
  `Warm golden-hour side lighting creating depth and highlights. Visible steam rising gently. ` +
  `Glossy sauce glistening. Vibrant fresh colors. Shallow depth of field with soft bokeh background. ` +
  `Shot with a 50mm lens, f/1.8. Michelin-quality food styling. Utterly mouth-watering. No text, no watermark.`;

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey || !apiKey.startsWith("sk-")) {
  console.error("❌ OPENAI_API_KEY が設定されていません。");
  console.error("   例: OPENAI_API_KEY=sk-... node scripts/generate-hero-images.mjs");
  process.exit(1);
}

const { default: OpenAI } = await import("openai");
const client = new OpenAI({ apiKey });

for (const dish of DISHES) {
  const outPath = join(OUTPUT_DIR, dish.file);
  if (existsSync(outPath)) {
    console.log(`⏭  スキップ（既存）: ${dish.file}`);
    continue;
  }

  console.log(`🎨 生成中: ${dish.name} ...`);
  try {
    const res = await client.images.generate({
      model: "gpt-image-1",
      prompt: PROMPT_TEMPLATE(dish.name),
      n: 1,
      size: "1024x1024",
      quality: "high",
    });

    const b64 = res.data?.[0]?.b64_json;
    const url = res.data?.[0]?.url;

    if (b64) {
      writeFileSync(outPath, Buffer.from(b64, "base64"));
      console.log(`✅ 保存: ${dish.file}`);
    } else if (url) {
      const imgRes = await fetch(url);
      const buf = Buffer.from(await imgRes.arrayBuffer());
      writeFileSync(outPath, buf);
      console.log(`✅ 保存: ${dish.file}`);
    } else {
      console.error(`❌ 画像データが取得できませんでした: ${dish.name}`);
    }
  } catch (e) {
    console.error(`❌ エラー (${dish.name}):`, e.message);
  }
}

console.log("\n🍽  完了！ public/hero-dishes/ に保存されました。");
