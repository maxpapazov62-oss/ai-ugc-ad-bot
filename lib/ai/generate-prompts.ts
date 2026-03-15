import { getClaudeClient } from "./claude";
import { SORA_PROMPTING_GUIDE } from "../constants/sora-prompting-guide";
import { CLAUDE_SONNET } from "../constants/models";
import type { AdDeconstruction } from "./analyze-ads";

export type AdPromptInput = {
  adDbId: number;
  brandName: string;
  deconstruction: AdDeconstruction;
};

export async function* generateSoraPrompts(
  ads: AdPromptInput[]
): AsyncGenerator<string> {
  const client = getClaudeClient();

  const adList = ads.map((a, i) => {
    const d = a.deconstruction;
    return `Ad ${i + 1} (adDbId: ${a.adDbId}, brand: ${a.brandName}):
  Format: ${d.format}
  Setting: ${d.setting}
  Hook type: ${d.hookType}
  Hook text: "${d.hookText}"
  CTA: "${d.ctaText}"
  Visual style: ${d.visualStyle}
  Product usage: ${d.productUsage}
  Tone: ${d.tone}
  Target audience: ${d.targetAudience}
  Winning ingredients: ${d.winningIngredients.join(", ")}`;
  }).join("\n\n");

  const userMessage = `You are a world-class UGC video director writing Sora 2 prompts for paid social ads.

Each prompt you write must be a DIRECT REPLICA of a specific winning Meta ad. You are not guessing or going on vibes — you are translating a proven, data-backed ad into a Sora video prompt. Every creative decision must mirror the source ad exactly: same format, same setting, same hook, same CTA, same tone.

Rules:
- For each ad below, generate a 30-second concept: Shot 1 (hook/problem, ~15s) and Shot 2 (payoff/CTA, ~15s)
- The format, setting, hook, and CTA MUST match the source ad exactly
- Shot 1 must open with the exact hook from the source ad, in the exact same format and setting
- Shot 2 must close with the exact CTA from the source ad, with the product payoff
- Each shot must be 200–400 words — long, rich, director-level detail
- Describe the person physically: age range, hair, skin tone, eye color, complexion, outfit
- Describe the product with specificity: color, label, packaging, how it's held/used
- Describe the setting with specificity: exact location, lighting, what's visible in background
- Describe motion as bullet-point micro-actions
- Write actual scripted dialogue matching the source ad's tone
- Describe ambient sound — no music unless the source ad implies it
- Label format: "[Brand] – [Hook/Angle] – 30s Shot 1" and "[Brand] – [Hook/Angle] – 30s Shot 2"

Sora 2 Framework (follow all 8 sections per shot):
${SORA_PROMPTING_GUIDE}

Winning ads to replicate:
${adList}

Return a JSON array ONLY — no markdown, no explanation, no code blocks:
[{
  "adDbId": <number>,
  "label": "...",
  "duration": 30,
  "shotNumber": 1,
  "angle": "...",
  "promptText": "...",
  "brandName": "..."
}, ...]

Generate both Shot 1 and Shot 2 for each ad (each ad produces 2 entries in the array).`;

  const stream = client.messages.stream({
    model: CLAUDE_SONNET,
    max_tokens: 16000,
    messages: [{ role: "user", content: userMessage }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
