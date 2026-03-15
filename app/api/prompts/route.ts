import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { soraPrompts, brands } from "@/db/schema";
import { eq, desc, and, SQL } from "drizzle-orm";
import { parseId } from "@/lib/utils/params";

export async function GET(req: NextRequest) {
  try {
    const duration = req.nextUrl.searchParams.get("duration");
    const status = req.nextUrl.searchParams.get("status");
    const brandId = req.nextUrl.searchParams.get("brandId");

    const conditions: SQL[] = [];

    if (duration) {
      const d = parseId(duration);
      if (!d) return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
      conditions.push(eq(soraPrompts.duration, d));
    }
    if (status) {
      conditions.push(eq(soraPrompts.status, status));
    }
    if (brandId) {
      const id = parseId(brandId);
      if (!id) return NextResponse.json({ error: "Invalid brandId" }, { status: 400 });
      conditions.push(eq(soraPrompts.brandId, id));
    }

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
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(soraPrompts.createdAt));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
