import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ads, brands, swipeFiles } from "@/db/schema";
import { inArray, eq } from "drizzle-orm";
import { analyzeAds } from "@/lib/ai/analyze-ads";

export async function POST(req: NextRequest) {
  try {
    const { brandIds } = await req.json() as { brandIds: number[] };

    if (!brandIds || brandIds.length === 0) {
      return NextResponse.json({ error: "No brand IDs provided" }, { status: 400 });
    }

    const brandAds = await db.select({
      brandName: brands.name,
      hook: ads.hook,
      bodyText: ads.bodyText,
      ctaText: ads.ctaText,
      creativeType: ads.creativeType,
    })
    .from(ads)
    .leftJoin(brands, eq(ads.brandId, brands.id))
    .where(inArray(ads.brandId, brandIds));

    if (brandAds.length === 0) {
      return NextResponse.json({ error: "No ads found for selected brands" }, { status: 400 });
    }

    const content = await analyzeAds(
      brandAds.map((a) => ({
        brandName: a.brandName || "Unknown",
        hook: a.hook,
        bodyText: a.bodyText,
        ctaText: a.ctaText,
        creativeType: a.creativeType ?? "unknown",
      }))
    );

    const [swipeFile] = await db.insert(swipeFiles).values({
      content,
      brandIds: JSON.stringify(brandIds),
    }).returning();

    return NextResponse.json({ swipeFileId: swipeFile.id, content });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
