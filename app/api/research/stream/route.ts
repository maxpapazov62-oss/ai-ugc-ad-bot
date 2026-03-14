import { NextRequest } from "next/server";
import { createJobSSEStream } from "@/lib/utils/sse";

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return new Response("Missing jobId", { status: 400 });
  }
  return createJobSSEStream(jobId);
}
