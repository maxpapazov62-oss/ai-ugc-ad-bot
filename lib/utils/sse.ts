export type SSEEvent = {
  type: string;
  data: unknown;
};

export function createSSEStream(
  generator: (send: (event: SSEEvent) => void) => Promise<void>
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => {
        const message = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      try {
        await generator(send);
      } catch (err) {
        const message = `event: error\ndata: ${JSON.stringify({ message: String(err) })}\n\n`;
        controller.enqueue(encoder.encode(message));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// In-memory job state store
export type JobState = {
  logs: string[];
  status: "running" | "done" | "failed";
  data: unknown;
  createdAt: number;
};

const jobStore = new Map<string, JobState>();

export function createJob(jobId: string): JobState {
  const job: JobState = {
    logs: [],
    status: "running",
    data: null,
    createdAt: Date.now(),
  };
  jobStore.set(jobId, job);
  return job;
}

export function getJob(jobId: string): JobState | undefined {
  return jobStore.get(jobId);
}

export function updateJob(
  jobId: string,
  updates: Partial<JobState>
): void {
  const job = jobStore.get(jobId);
  if (job) {
    Object.assign(job, updates);
  }
}

export function appendLog(jobId: string, log: string): void {
  const job = jobStore.get(jobId);
  if (job) {
    job.logs.push(log);
  }
}

export function createJobSSEStream(jobId: string): Response {
  const encoder = new TextEncoder();
  let lastLogIndex = 0;

  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        const job = jobStore.get(jobId);
        if (!job) {
          const msg = `event: error\ndata: ${JSON.stringify({ message: "Job not found" })}\n\n`;
          controller.enqueue(encoder.encode(msg));
          clearInterval(interval);
          controller.close();
          return;
        }

        // Send new logs
        const newLogs = job.logs.slice(lastLogIndex);
        for (const log of newLogs) {
          const msg = `event: log\ndata: ${JSON.stringify({ message: log })}\n\n`;
          controller.enqueue(encoder.encode(msg));
        }
        lastLogIndex = job.logs.length;

        // Send status update
        if (job.status === "done" || job.status === "failed") {
          const msg = `event: ${job.status}\ndata: ${JSON.stringify({ data: job.data })}\n\n`;
          controller.enqueue(encoder.encode(msg));
          clearInterval(interval);
          controller.close();
        }
      }, 500);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
