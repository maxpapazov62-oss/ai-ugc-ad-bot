import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { swipeFiles, soraPrompts, brands } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { generateSoraPrompts } from "@/lib/ai/generate-prompts";

export async function POST(req: NextRequest) {
  try {
    const { swipeFileId } = await req.json() as { swipeFileId: number };

    if (!swipeFileId) {
      return NextResponse.json({ error: "swipeFileId is required" }, { status: 400 });
    }

    const [swipeFile] = await db.select().from(swipeFiles).where(eq(swipeFiles.id, swipeFileId));
    if (!swipeFile) {
      return NextResponse.json({ error: "Swipe file not found" }, { status: 404 });
    }

    const brandIds = JSON.parse(swipeFile.brandIds) as number[];
    const brandRecords = await db.select().from(brands).where(
      brandIds.length > 0
        ? inArray(brands.id, brandIds)
        : sql`1=1`
    );
    const brandNames = brandRecords.map((b) => b.name);

    const generatedPrompts = await generateSoraPrompts(swipeFile.content, brandNames);

    const inserted = await Promise.all(
      generatedPrompts.map(async (p) => {
        const brand = brandRecords.find((b) => b.name === p.brandName);
        const [row] = await db.insert(soraPrompts).values({
          swipeFileId,
          brandId: brand?.id || null,
          label: p.label,
          duration: p.duration,
          shotNumber: p.shotNumber,
          promptText: p.promptText,
          angle: p.angle,
          status: "generated",
        }).returning();
        return row;
      })
    );

    return NextResponse.json({ count: inserted.length, prompts: inserted });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
