import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [video] = await db.select().from(videos).where(eq(videos.id, parseInt(params.id)));
    if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(video);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
