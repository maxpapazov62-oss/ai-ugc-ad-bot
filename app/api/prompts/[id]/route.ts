import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { soraPrompts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { soraSharedLink, status } = await req.json() as { soraSharedLink?: string; status?: string };
    const id = parseInt(params.id);

    const updates: Record<string, unknown> = {};
    if (soraSharedLink !== undefined) updates.soraSharedLink = soraSharedLink;
    if (status !== undefined) updates.status = status;

    const [updated] = await db.update(soraPrompts)
      .set(updates)
      .where(eq(soraPrompts.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
