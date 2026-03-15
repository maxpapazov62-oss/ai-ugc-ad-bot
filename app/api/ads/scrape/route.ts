import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { brands, ads } from "@/db/schema";
import { inArray, eq } from "drizzle-orm";
import { scrapeMetaAds, lookupFacebookPageId } from "@/lib/automation/meta-ad-library";

export async function POST(req: NextRequest) {
  try {
    const { brandIds } = await req.json() as { brandIds: number[] };

    if (!brandIds || brandIds.length === 0) {
      return NextResponse.json({ error: "No brand IDs provided" }, { status: 400 });
    }

    if (brandIds.length > 20) {
      return NextResponse.json({ error: "Max 20 brands per request" }, { status: 400 });
    }

    const accessToken = process.env.META_ACCESS_TOKEN;
    const apiVersion = process.env.META_API_VERSION || "v19.0";

    if (!accessToken) {
      return NextResponse.json({ error: "META_ACCESS_TOKEN not configured" }, { status: 400 });
    }

    const selectedBrands = await db.select().from(brands).where(inArray(brands.id, brandIds));

    const results = { scraped: 0, skipped: 0, errors: [] as string[] };

    for (const brand of selectedBrands) {
      try {
        let pageId = brand.facebookPageId;

        // Auto-lookup page ID if not stored — ensures we scrape the right advertiser
        if (!pageId) {
          pageId = await lookupFacebookPageId(brand.name, accessToken, apiVersion);
          if (pageId) {
            await db.update(brands).set({ facebookPageId: pageId }).where(eq(brands.id, brand.id));
          }
        }

        const useSearchTerm = !pageId;
        const searchParam = pageId || brand.name;
        const metaAds = await scrapeMetaAds(searchParam, accessToken, apiVersion, 50, useSearchTerm);

        for (const ad of metaAds) {
          const inserted = await db.insert(ads).values({
            brandId: brand.id,
            metaAdId: ad.metaAdId,
            hook: ad.hook,
            bodyText: ad.bodyText,
            ctaText: ad.ctaText,
            angle: ad.angle,
            creativeType: ad.creativeType,
            thumbnailUrl: ad.thumbnailUrl,
            rawPayload: ad.rawPayload,
            adDeliveryStartTime: ad.adDeliveryStartTime,
            daysRunning: ad.daysRunning,
          }).onConflictDoNothing().returning({ id: ads.id });

          if (inserted.length > 0) results.scraped++;
          else results.skipped++;
        }
      } catch (err) {
        results.errors.push(`${brand.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
