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

  const userMessage = `Based on this swipe file, generate Sora 2 video prompts.

Rules:
- For each hook/angle, generate one 15s prompt AND one 30s split (two 15s shots)
- 30s Shot 1 sets the scene/problem; Shot 2 delivers the payoff/CTA
- Reference "the product shown in the reference image" (user uploads product image as start frame in Sora)
- Label format: "[Brand] – [Angle] – 15s" or "[Brand] – [Angle] – 30s Shot 1" / "[Brand] – [Angle] – 30s Shot 2"
- Focus on UGC-style, authentic feel
- Generate at least 2-3 hooks/angles per brand

Return a JSON array ONLY (no markdown, no explanation):
[{ "label": "...", "duration": 15, "shotNumber": null, "angle": "...", "promptText": "...", "brandName": "..." }]

For 30s prompts, shotNumber is 1 or 2. For 15s, shotNumber is null.
Duration must be either 15 or 30.

Brands to cover: ${brandNames.join(", ")}

Swipe File:
${swipeFileContent}

Sora 2 Guide:
${SORA_PROMPTING_GUIDE}`;

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 8192,
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
