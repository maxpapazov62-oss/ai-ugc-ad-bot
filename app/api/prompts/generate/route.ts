import { NextRequest } from "next/server";
import { db } from "@/db";
import { swipeFiles, soraPrompts, brands, ads } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { generateSoraPrompts } from "@/lib/ai/generate-prompts";
import type { AdDeconstruction } from "@/lib/ai/analyze-ads";
import { jsonrepair } from "jsonrepair";

export async function POST(req: NextRequest) {
  const { swipeFileId } = await req.json() as { swipeFileId: number };

  if (!swipeFileId) {
    return new Response(JSON.stringify({ error: "swipeFileId is required" }), { status: 400 });
  }

  const [swipeFile] = await db.select().from(swipeFiles).where(eq(swipeFiles.id, swipeFileId));
  if (!swipeFile) {
    return new Response(JSON.stringify({ error: "Swipe file not found" }), { status: 404 });
  }

  const brandIds = JSON.parse(swipeFile.brandIds) as number[];

  // Fetch all deconstructed winning ads for these brands
  const deconstructedAds = await db.select({
    id: ads.id,
    brandId: ads.brandId,
    brandName: brands.name,
    deconstruction: ads.deconstruction,
  })
  .from(ads)
  .leftJoin(brands, eq(ads.brandId, brands.id))
  .where(
    inArray(ads.brandId, brandIds.length > 0 ? brandIds : [-1])
  );

  const adsWithDeconstruction = deconstructedAds.filter((a) => a.deconstruction);

  if (adsWithDeconstruction.length === 0) {
    return new Response(JSON.stringify({ error: "No deconstructed ads found — run Analyze first" }), { status: 400 });
  }

  const adInputs = adsWithDeconstruction.map((a) => ({
    adDbId: a.id,
    brandName: a.brandName || "Unknown",
    deconstruction: JSON.parse(a.deconstruction!) as AdDeconstruction,
  }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: string) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
      };

      try {
        send("status", `Generating prompts for ${adInputs.length} winning ads...`);

        let fullText = "";
        for await (const chunk of generateSoraPrompts(adInputs)) {
          fullText += chunk;
          send("chunk", chunk);
        }

        send("status", "Saving to database...");

        let jsonText = fullText.trim();
        jsonText = jsonText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
        jsonText = jsonText.replace(/^```\n?/, "").replace(/\n?```$/, "");

        const parsed = JSON.parse(jsonrepair(jsonText)) as Array<{
          adDbId: number;
          label: string;
          duration: number;
          shotNumber: number | null;
          angle: string;
          promptText: string;
          brandName: string;
        }>;

        // Map brandName to brandId
        const brandRecords = await db.select().from(brands).where(
          inArray(brands.id, brandIds.length > 0 ? brandIds : [-1])
        );
        const brandNameToId = new Map(brandRecords.map((b) => [b.name, b.id]));

        const inserted = await Promise.all(
          parsed.map(async (p) => {
            const brandId = brandNameToId.get(p.brandName) ?? null;
            const [row] = await db.insert(soraPrompts).values({
              swipeFileId,
              brandId,
              sourceAdId: p.adDbId || null,
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

        send("done", JSON.stringify({ count: inserted.length }));
      } catch (err) {
        send("error", err instanceof Error ? err.message : String(err));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
