import { NextRequest } from "next/server";
import { db } from "@/db";
import { swipeFiles, soraPrompts, brands } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { generateSoraPrompts } from "@/lib/ai/generate-prompts";

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
  const brandRecords = await db.select().from(brands).where(
    brandIds.length > 0 ? inArray(brands.id, brandIds) : sql`1=1`
  );
  const brandNames = brandRecords.map((b) => b.name);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: string) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
      };

      try {
        send("status", "Generating prompts...");

        let fullText = "";
        for await (const chunk of generateSoraPrompts(swipeFile.content, brandNames)) {
          fullText += chunk;
          send("chunk", chunk);
        }

        send("status", "Saving to database...");

        // Strip markdown code fences if present
        let jsonText = fullText.trim();
        jsonText = jsonText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
        jsonText = jsonText.replace(/^```\n?/, "").replace(/\n?```$/, "");

        const parsed = JSON.parse(jsonText);

        const inserted = await Promise.all(
          parsed.map(async (p: { label: string; duration: number; shotNumber: number | null; angle: string; promptText: string; brandName: string }) => {
            const brand = brandRecords.find((b) => b.name === p.brandName);
            const [row] = await db.insert(soraPrompts).values({
              swipeFileId,
              brandId: brand?.id || null,
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
        send("error", String(err));
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
