import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createJob, appendLog, updateJob } from "@/lib/utils/sse";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { scrapeBrands } from "@/lib/automation/brandsearch";

export async function POST() {
  const jobId = randomUUID();
  createJob(jobId);

  const brandsearchUrl = process.env.BRANDSEARCH_URL;
  const email = process.env.BRANDSEARCH_EMAIL;
  const password = process.env.BRANDSEARCH_PASSWORD;

  if (!brandsearchUrl || !email || !password) {
    return NextResponse.json({ error: "BrandSearch credentials not configured" }, { status: 400 });
  }

  // Run async in background
  (async () => {
    try {
      const results = await scrapeBrands(
        brandsearchUrl,
        email,
        password,
        (msg) => appendLog(jobId, msg)
      );

      for (const brand of results) {
        await db.insert(brands).values(brand).onConflictDoNothing().catch(() => {});
      }

      appendLog(jobId, `Saved ${results.length} brands to database.`);
      updateJob(jobId, { status: "done", data: { count: results.length } });
    } catch (err) {
      appendLog(jobId, `Error: ${String(err)}`);
      updateJob(jobId, { status: "failed" });
    }
  })();

  return NextResponse.json({ jobId });
}
