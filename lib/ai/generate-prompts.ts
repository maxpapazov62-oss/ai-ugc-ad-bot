import { getClaudeClient } from "./claude";
import { SORA_PROMPTING_GUIDE } from "../constants/sora-prompting-guide";

export type GeneratedPrompt = {
  label: string;
  duration: 15 | 30;
  shotNumber: 1 | 2 | null;
  angle: string;
  promptText: string;
  brandName: string;
};

export async function generateSoraPrompts(
  swipeFileContent: string,
  brandNames: string[]
): Promise<GeneratedPrompt[]> {
  const client = getClaudeClient();

  const userMessage = `You are a world-class UGC video director writing Sora 2 prompts for paid social ads.

Your prompts must be LONG, SPECIFIC, and CINEMATIC. Every prompt must include all 8 sections from the guide: scene header, API parameters, style block, subject description, cinematography, motion sequence, dialogue, and background sound. A weak, vague prompt is useless — describe exactly what you see in your mind as if painting every pixel.

Rules:
- For each hook/angle, generate one 15s scene AND one 30s concept (two 15s scenes: Scene 1 = hook/problem, Scene 2 = payoff/CTA)
- Each scene must be 200–400 words minimum — long, rich, director-level detail
- Describe the person physically: age range, hair, skin tone, eye color, complexion, outfit with specific colors and fabrics, physical/emotional state
- Describe the product with specificity: color, label, logo, packaging details, how it is held or used
- Describe the setting with specificity: exact location, time of day, what is visible in background, bokeh, shadows, light direction
- Describe motion as a bullet-point sequence of micro-actions — not just "she holds the product" but exactly what she does with her hand, where she looks, how she moves
- Write actual scripted dialogue lines with tone notes in parentheses
- Describe ambient sound — no music unless specified
- Reference "the product shown in the reference image" when describing the product
- Label format: "[Brand] – [Angle] – 15s" or "[Brand] – [Angle] – 30s Shot 1" / "[Brand] – [Angle] – 30s Shot 2"
- Generate 2–3 distinct hooks/angles per brand
- The promptText field must contain the full multi-section prompt as plain text (no JSON escaping issues)

Brands to cover: ${brandNames.join(", ")}

Swipe File (use the hooks, angles, and ad styles here as your creative brief):
${swipeFileContent}

Sora 2 Framework:
${SORA_PROMPTING_GUIDE}

Return a JSON array ONLY — no markdown, no explanation, no code blocks:
[{ "label": "...", "duration": 15, "shotNumber": null, "angle": "...", "promptText": "...", "brandName": "..." }]

For 30s prompts: shotNumber is 1 or 2, duration is 30. For 15s: shotNumber is null, duration is 15.`;

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 16000,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  let jsonText = content.text.trim();
  // Strip markdown code blocks if present
  jsonText = jsonText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  jsonText = jsonText.replace(/^```\n?/, "").replace(/\n?```$/, "");

  const parsed = JSON.parse(jsonText) as GeneratedPrompt[];
  return parsed;
}
