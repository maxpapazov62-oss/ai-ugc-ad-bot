import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videos, soraPrompts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select({
      id: videos.id,
      promptId: videos.promptId,
      promptLabel: soraPrompts.label,
      soraSharedLink: videos.soraSharedLink,
      watermarkStatus: videos.watermarkStatus,
      localFilePath: videos.localFilePath,
      errorMessage: videos.errorMessage,
      createdAt: videos.createdAt,
    })
    .from(videos)
    .leftJoin(soraPrompts, eq(videos.promptId, soraPrompts.id))
    .orderBy(desc(videos.createdAt));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { promptId, soraSharedLink } = await req.json() as { promptId: number; soraSharedLink: string };

    if (!promptId || !soraSharedLink) {
      return NextResponse.json({ error: "promptId and soraSharedLink required" }, { status: 400 });
    }

    const [video] = await db.insert(videos).values({
      promptId,
      soraSharedLink,
      watermarkStatus: "pending",
    }).returning();

    // Update prompt status
    await db.update(soraPrompts)
      .set({ soraSharedLink, status: "generated" })
      .where(eq(soraPrompts.id, promptId));

    return NextResponse.json(video);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
