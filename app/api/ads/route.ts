import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ads, brands } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { parseId } from "@/lib/utils/params";

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json() as { id: number };
    const adId = parseId(String(id));
    if (!adId) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    await db.delete(ads).where(eq(ads.id, adId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const brandId = req.nextUrl.searchParams.get("brandId");

    const query = db.select({
      id: ads.id,
      brandId: ads.brandId,
      brandName: brands.name,
      metaAdId: ads.metaAdId,
      hook: ads.hook,
      bodyText: ads.bodyText,
      ctaText: ads.ctaText,
      angle: ads.angle,
      creativeType: ads.creativeType,
      thumbnailUrl: ads.thumbnailUrl,
      daysRunning: ads.daysRunning,
      adFormat: ads.adFormat,
      createdAt: ads.createdAt,
    }).from(ads).leftJoin(brands, eq(ads.brandId, brands.id));

    if (brandId) {
      const id = parseId(brandId);
      if (!id) return NextResponse.json({ error: "Invalid brandId" }, { status: 400 });
      const result = await query.where(eq(ads.brandId, id));
      return NextResponse.json(result);
    }

    const result = await query;
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
