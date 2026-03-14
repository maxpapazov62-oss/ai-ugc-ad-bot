import { NextResponse } from "next/server";
import { db } from "@/db";
import { swipeFiles } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const files = await db.select().from(swipeFiles).orderBy(desc(swipeFiles.createdAt));
    return NextResponse.json(files);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
