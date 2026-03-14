import { getClaudeClient } from "./claude";

export type AdForAnalysis = {
  brandName: string;
  hook: string | null;
  bodyText: string | null;
  ctaText: string | null;
  creativeType: string;
};

const SYSTEM_PROMPT = `You are a direct response advertising analyst specializing in UGC ads.
Analyze the ad creatives provided and produce a structured swipe file.
For each brand: TOP HOOKS (first ~3 seconds), WINNING ANGLES (pain point/transformation/social proof),
CTA PATTERNS. End with a CROSS-BRAND INSIGHTS section.
Format as clean markdown.`;

export async function analyzeAds(ads: AdForAnalysis[]): Promise<string> {
  const client = getClaudeClient();

  const adsByBrand = ads.reduce<Record<string, AdForAnalysis[]>>((acc, ad) => {
    if (!acc[ad.brandName]) acc[ad.brandName] = [];
    acc[ad.brandName].push(ad);
    return acc;
  }, {});

  const adText = Object.entries(adsByBrand)
    .map(([brand, brandAds]) => {
      const adList = brandAds
        .map(
          (ad, i) => `  Ad ${i + 1}:
    Hook: ${ad.hook || "(no hook)"}
    Body: ${ad.bodyText?.substring(0, 300) || "(no body)"}
    CTA: ${ad.ctaText || "(no CTA)"}
    Type: ${ad.creativeType}`
        )
        .join("\n\n");
      return `## Brand: ${brand}\n${adList}`;
    })
    .join("\n\n---\n\n");

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Analyze these UGC ads and produce a comprehensive swipe file:\n\n${adText}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");
  return content.text;
}
