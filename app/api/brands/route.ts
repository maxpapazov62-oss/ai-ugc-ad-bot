import { NextResponse } from "next/server";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const allBrands = await db.select().from(brands).orderBy(desc(brands.createdAt));
    return NextResponse.json(allBrands);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
