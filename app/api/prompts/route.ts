import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { soraPrompts, brands } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const duration = req.nextUrl.searchParams.get("duration");
    const status = req.nextUrl.searchParams.get("status");
    const brandId = req.nextUrl.searchParams.get("brandId");

    const result = await db.select({
      id: soraPrompts.id,
      swipeFileId: soraPrompts.swipeFileId,
      brandId: soraPrompts.brandId,
      brandName: brands.name,
      label: soraPrompts.label,
      duration: soraPrompts.duration,
      shotNumber: soraPrompts.shotNumber,
      promptText: soraPrompts.promptText,
      angle: soraPrompts.angle,
      status: soraPrompts.status,
      soraSharedLink: soraPrompts.soraSharedLink,
      createdAt: soraPrompts.createdAt,
    })
    .from(soraPrompts)
    .leftJoin(brands, eq(soraPrompts.brandId, brands.id))
    .orderBy(desc(soraPrompts.createdAt));

    let filtered = result;
    if (duration) filtered = filtered.filter((p) => p.duration === parseInt(duration));
    if (status) filtered = filtered.filter((p) => p.status === status);
    if (brandId) filtered = filtered.filter((p) => p.brandId === parseInt(brandId));

    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
