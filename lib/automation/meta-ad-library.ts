const META_API_BASE = "https://graph.facebook.com";

export type MetaAd = {
  id: string;
  ad_snapshot_url: string;
  ad_creative_bodies?: string[];
  ad_creative_link_captions?: string[];
  ad_creative_link_descriptions?: string[];
  ad_creative_link_titles?: string[];
  call_to_action_type?: string;
  impressions?: { lower_bound: string; upper_bound: string };
  spend?: { lower_bound: string; upper_bound: string };
  publisher_platforms?: string[];
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
};

function extractHook(bodyText: string | null): string | null {
  if (!bodyText) return null;
  const sentences = bodyText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  return sentences[0]?.trim() || null;
}

export async function scrapeMetaAds(
  facebookPageIdOrSearchTerm: string,
  accessToken: string,
  apiVersion: string = "v22.0",
  limit: number = 50,
  useSearchTerm: boolean = false
): Promise<ScrapedAd[]> {
  const results: ScrapedAd[] = [];
  let after: string | null = null;

  while (true) {
    const params = new URLSearchParams({
      ...(useSearchTerm
        ? { search_terms: facebookPageIdOrSearchTerm }
        : { search_page_ids: facebookPageIdOrSearchTerm }),
      ad_reached_countries: '["US"]',
      ad_active_status: "ACTIVE",
      ad_type: "ALL",
      limit: String(Math.min(limit - results.length, 50)),
      fields:
        "id,ad_snapshot_url,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_descriptions,ad_creative_link_titles,call_to_action_type,publisher_platforms",
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
    console.log("Meta API response:", JSON.stringify(json).slice(0, 500));
    const ads: MetaAd[] = json.data || [];

    for (const ad of ads) {
      const bodyText = ad.ad_creative_bodies?.[0] || null;
      const hook = extractHook(bodyText);
      const ctaText = ad.call_to_action_type
        ? ad.call_to_action_type.replace(/_/g, " ")
        : null;
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
      });
    }

    const nextCursor = json.paging?.cursors?.after;
    if (!nextCursor || results.length >= limit || ads.length === 0) {
      break;
    }
    after = nextCursor;
  }

  return results;
}
