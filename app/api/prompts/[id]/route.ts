import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { soraPrompts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parseId } from "@/lib/utils/params";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    await db.delete(soraPrompts).where(eq(soraPrompts.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const { soraSharedLink, status } = await req.json() as { soraSharedLink?: string; status?: string };

    const updates: Record<string, unknown> = {};
    if (soraSharedLink !== undefined) updates.soraSharedLink = soraSharedLink;
    if (status !== undefined) updates.status = status;

    const [updated] = await db.update(soraPrompts)
      .set(updates)
      .where(eq(soraPrompts.id, id!))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
