const META_API_BASE = "https://graph.facebook.com";

const WINNING_AD_MIN_DAYS = 30;

export type MetaAd = {
  id: string;
  ad_snapshot_url: string;
  ad_creative_bodies?: string[];
  ad_creative_link_captions?: string[];
  ad_creative_link_descriptions?: string[];
  ad_creative_link_titles?: string[];
  call_to_action_type?: string;
  publisher_platforms?: string[];
  ad_delivery_start_time?: string;
};

export type ScrapedAd = {
  metaAdId: string;
  hook: string | null;
  bodyText: string | null;
  ctaText: string | null;
  angle: string | null;
  creativeType: string;
  thumbnailUrl: string | null;
  rawPayload: string;
  adDeliveryStartTime: string | null;
  daysRunning: number | null;
};

function extractHook(bodyText: string | null): string | null {
  if (!bodyText) return null;
  const sentences = bodyText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  return sentences[0]?.trim() || null;
}

function computeDaysRunning(startTime: string | null): number | null {
  if (!startTime) return null;
  const startDate = new Date(startTime);
  if (isNaN(startDate.getTime())) return null;
  return Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

export async function scrapeMetaAds(
  facebookPageIdOrSearchTerm: string,
  accessToken: string,
  apiVersion: string = "v22.0",
  limit: number = 50,
  useSearchTerm: boolean = false
): Promise<ScrapedAd[]> {
  const results: ScrapedAd[] = [];
  const seenIds = new Set<string>();
  const seenContent = new Set<string>();
  let after: string | null = null;
  // Fetch extra to account for filtering — winning ads may be a subset
  const fetchLimit = Math.min(limit * 3, 200);

  while (results.length < limit) {
    const params = new URLSearchParams({
      ...(useSearchTerm
        ? { search_terms: facebookPageIdOrSearchTerm }
        : { search_page_ids: facebookPageIdOrSearchTerm }),
      ad_reached_countries: '["US"]',
      ad_active_status: "ACTIVE",
      ad_type: "ALL",
      limit: String(Math.min(fetchLimit - results.length, 50)),
      fields:
        "id,ad_snapshot_url,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_descriptions,ad_creative_link_titles,call_to_action_type,publisher_platforms,ad_delivery_start_time",
      access_token: accessToken,
    });

    if (after) {
      params.set("after", after);
    }

    const url = `${META_API_BASE}/${apiVersion}/ads_archive?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Meta API error: ${response.status} ${error}`);
    }

    const json = await response.json();
    const ads: MetaAd[] = json.data || [];

    for (const ad of ads) {
      const daysRunning = computeDaysRunning(ad.ad_delivery_start_time || null);

      // Skip duplicate ad IDs within this scrape run
      if (seenIds.has(ad.id)) continue;
      seenIds.add(ad.id);

      // Only keep winning ads (30+ days running)
      if (!daysRunning || daysRunning < WINNING_AD_MIN_DAYS) continue;

      const bodyText = ad.ad_creative_bodies?.[0] || null;
      const hook = extractHook(bodyText);
      const ctaText = ad.call_to_action_type
        ? ad.call_to_action_type.replace(/_/g, " ")
        : null;

      // Skip ads with identical content (same creative running under multiple ad IDs)
      const contentKey = `${hook}||${bodyText}||${ctaText}`;
      if (seenContent.has(contentKey)) continue;
      seenContent.add(contentKey);

      const creativeType = ad.publisher_platforms?.includes("instagram")
        ? "video"
        : "image";

      results.push({
        metaAdId: ad.id,
        hook,
        bodyText,
        ctaText,
        angle: null,
        creativeType,
        thumbnailUrl: ad.ad_snapshot_url || null,
        rawPayload: JSON.stringify(ad),
        adDeliveryStartTime: ad.ad_delivery_start_time || null,
        daysRunning,
      });

      if (results.length >= limit) break;
    }

    const nextCursor = json.paging?.cursors?.after;
    if (!nextCursor || ads.length === 0) break;
    after = nextCursor;
  }

  return results;
}
