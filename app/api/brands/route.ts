import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { parseId } from "@/lib/utils/params";

export async function GET() {
  try {
    const allBrands = await db.select().from(brands).orderBy(desc(brands.createdAt));
    return NextResponse.json(allBrands);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, facebookPageId } = await req.json() as { id: number; facebookPageId: string };
    const brandId = parseId(String(id));
    if (!brandId) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const [updated] = await db.update(brands)
      .set({ facebookPageId: facebookPageId || null })
      .where(eq(brands.id, brandId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
