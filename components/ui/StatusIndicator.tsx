type Status = "pending" | "running" | "processing" | "done" | "failed" | "generated";

interface StatusIndicatorProps {
  status: Status;
}

const statusConfig: Record<Status, { dot: string; label: string }> = {
  pending: { dot: "bg-white/30", label: "Pending" },
  running: { dot: "bg-yellow-400 animate-pulse", label: "Running" },
  processing: { dot: "bg-yellow-400 animate-pulse", label: "Processing" },
  done: { dot: "bg-green-400", label: "Done" },
  failed: { dot: "bg-red-400", label: "Failed" },
  generated: { dot: "bg-blue-400", label: "Generated" },
};

export function StatusIndicator({ status }: StatusIndicatorProps) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-white/60">
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
