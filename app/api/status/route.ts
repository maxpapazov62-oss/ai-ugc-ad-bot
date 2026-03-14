import { NextResponse } from "next/server";
import { db } from "@/db";
import { brands, ads, soraPrompts, videos } from "@/db/schema";
import { count } from "drizzle-orm";

export async function GET() {
  try {
    const [brandCount] = await db.select({ count: count() }).from(brands);
    const [adCount] = await db.select({ count: count() }).from(ads);
    const [promptCount] = await db.select({ count: count() }).from(soraPrompts);
    const [videoCount] = await db.select({ count: count() }).from(videos);

    return NextResponse.json({
      status: "ok",
      counts: {
        brands: brandCount.count,
        ads: adCount.count,
        prompts: promptCount.count,
        videos: videoCount.count,
      }
    });
  } catch (error) {
    return NextResponse.json({ status: "error", message: String(error) }, { status: 500 });
  }
}
