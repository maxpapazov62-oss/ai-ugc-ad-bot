import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { removeWatermark } from "@/lib/automation/watermark-removal";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const videoId = parseInt(params.id);

  try {
    const [video] = await db.select().from(videos).where(eq(videos.id, videoId));
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });
    if (!video.soraSharedLink) return NextResponse.json({ error: "No Sora link on this video" }, { status: 400 });

    const watermarkUrl = process.env.WATERMARK_REMOVAL_URL;
    if (!watermarkUrl) return NextResponse.json({ error: "WATERMARK_REMOVAL_URL not configured" }, { status: 400 });

    // Start async
    await db.update(videos).set({ watermarkStatus: "processing" }).where(eq(videos.id, videoId));

    // Run in background (non-blocking response)
    removeWatermark(video.soraSharedLink, watermarkUrl)
      .then(async (localPath) => {
        await db.update(videos).set({
          watermarkStatus: "done",
          localFilePath: localPath,
        }).where(eq(videos.id, videoId));
      })
      .catch(async (err) => {
        await db.update(videos).set({
          watermarkStatus: "failed",
          errorMessage: String(err),
        }).where(eq(videos.id, videoId));
      });

    return NextResponse.json({ status: "processing", videoId });
  } catch (error) {
    await db.update(videos).set({
      watermarkStatus: "failed",
      errorMessage: String(error),
    }).where(eq(videos.id, videoId));
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
