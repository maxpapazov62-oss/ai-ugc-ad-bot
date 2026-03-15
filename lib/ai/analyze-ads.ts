import { getClaudeClient } from "./claude";
import { CLAUDE_OPUS } from "../constants/models";
import { jsonrepair } from "jsonrepair";

export type AdForAnalysis = {
  dbId: number;
  metaAdId: string;
  brandName: string;
  hook: string | null;
  bodyText: string | null;
  ctaText: string | null;
  creativeType: string;
  daysRunning: number | null;
};

export type AdDeconstruction = {
  dbId: number;
  metaAdId: string;
  format: string;
  setting: string;
  hookType: string;
  hookText: string;
  ctaText: string;
  visualStyle: string;
  productUsage: string;
  tone: string;
  targetAudience: string;
  winningIngredients: string[];
};

export type AnalysisResult = {
  swipeFileContent: string;
  deconstructions: AdDeconstruction[];
};

const SYSTEM_PROMPT = `You are a world-class direct response advertising analyst specializing in UGC video ads.

You will be given a list of WINNING Meta ads (proven to convert — all have been running 30+ days).

Your job is two-fold:
1. Deconstruct each individual ad with surgical precision — identify exactly what makes it work.
2. Write a swipe file synthesis that captures the overarching patterns across all ads.

For the deconstruction, extract:
- format: the video/ad format (e.g. "ugc-selfie", "podcast-interview", "testimonial-to-camera", "b-roll-voiceover", "explainer", "before-after", "unboxing")
- setting: exact physical setting (e.g. "bathroom mirror selfie", "kitchen counter", "outdoor park bench", "professional studio")
- hookType: type of hook used (e.g. "pain-point", "transformation", "social-proof", "curiosity", "bold-claim", "call-out")
- hookText: the actual hook line (first 3 seconds of the ad)
- ctaText: the exact call-to-action used
- visualStyle: camera and visual approach (e.g. "handheld phone camera", "professional lighting with tripod", "raw authentic selfie", "cinematic b-roll")
- productUsage: how the product appears and is used in the ad
- tone: emotional tone (e.g. "casual and authentic", "urgent scarcity", "educational", "emotional transformation", "entertaining and relatable")
- targetAudience: who this ad speaks to
- winningIngredients: 3-5 specific reasons this ad has been running 30+ days (what makes it convert)

Return a JSON object with this exact structure:
{
  "deconstructions": [
    {
      "metaAdId": "...",
      "format": "...",
      "setting": "...",
      "hookType": "...",
      "hookText": "...",
      "ctaText": "...",
      "visualStyle": "...",
      "productUsage": "...",
      "tone": "...",
      "targetAudience": "...",
      "winningIngredients": ["...", "...", "..."]
    }
  ],
  "swipeFile": "## markdown swipe file content here..."
}

The swipeFile should be detailed markdown organized by brand, with top hooks, winning angles, CTA patterns, and a cross-brand insights section.`;

export async function analyzeAds(ads: AdForAnalysis[]): Promise<AnalysisResult> {
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
          (ad, i) => `  Ad ${i + 1} (metaAdId: ${ad.metaAdId}):
    Hook: ${ad.hook || "(no hook)"}
    Body: ${ad.bodyText?.substring(0, 400) || "(no body)"}
    CTA: ${ad.ctaText || "(no CTA)"}
    Type: ${ad.creativeType}
    Running: ${ad.daysRunning ? `${ad.daysRunning} days` : "unknown"}`
        )
        .join("\n\n");
      return `## Brand: ${brand}\n${adList}`;
    })
    .join("\n\n---\n\n");

  const message = await client.messages.create({
    model: CLAUDE_OPUS,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Deconstruct these winning UGC ads and produce a swipe file:\n\n${adText}\n\nReturn valid JSON only — no markdown, no explanation.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from Claude");

  let jsonText = content.text.trim();
  jsonText = jsonText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  jsonText = jsonText.replace(/^```\n?/, "").replace(/\n?```$/, "");

  const parsed = JSON.parse(jsonrepair(jsonText)) as {
    deconstructions: Array<{
      metaAdId: string;
      format: string;
      setting: string;
      hookType: string;
      hookText: string;
      ctaText: string;
      visualStyle: string;
      productUsage: string;
      tone: string;
      targetAudience: string;
      winningIngredients: string[];
    }>;
    swipeFile: string;
  };

  // Map metaAdId back to dbId
  const metaIdToDbId = new Map(ads.map((a) => [a.metaAdId, a.dbId]));
  const deconstructions: AdDeconstruction[] = parsed.deconstructions.map((d) => ({
    ...d,
    dbId: metaIdToDbId.get(d.metaAdId) ?? 0,
  }));

  return {
    swipeFileContent: parsed.swipeFile,
    deconstructions,
  };
}
