import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { swipeFiles, soraPrompts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const files = await db.select().from(swipeFiles).orderBy(desc(swipeFiles.createdAt));
    return NextResponse.json(files);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json() as { id: number };
    // Delete associated prompts first
    await db.delete(soraPrompts).where(eq(soraPrompts.swipeFileId, id));
    await db.delete(swipeFiles).where(eq(swipeFiles.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
