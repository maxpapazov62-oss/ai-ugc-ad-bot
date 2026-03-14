"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusIndicator } from "@/components/ui/StatusIndicator";

type Prompt = {
  id: number;
  label: string;
  duration: number;
  shotNumber: number | null;
  soraSharedLink: string | null;
};

type Video = {
  id: number;
  promptId: number | null;
  promptLabel: string | null;
  soraSharedLink: string | null;
  watermarkStatus: string;
  localFilePath: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export default function VideosPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [links, setLinks] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});
  const [removing, setRemoving] = useState<Record<number, boolean>>({});
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/prompts").then((r) => r.json()).then(setPrompts);
    fetch("/api/videos").then((r) => r.json()).then(setVideos);
  }, []);

  // Poll processing videos
  useEffect(() => {
    const processing = videos.filter((v) => v.watermarkStatus === "processing");
    if (processing.length === 0) return;

    pollRef.current = setInterval(async () => {
      const updated = await Promise.all(
        processing.map((v) => fetch(`/api/videos/${v.id}`).then((r) => r.json()))
      );
      setVideos((prev) =>
        prev.map((v) => {
          const u = updated.find((u) => u.id === v.id);
          return u || v;
        })
      );
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [videos]);

  const submitLink = async (promptId: number) => {
    const link = links[promptId];
    if (!link) return;
    setSubmitting((prev) => ({ ...prev, [promptId]: true }));
    await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptId, soraSharedLink: link }),
    });
    setSubmitting((prev) => ({ ...prev, [promptId]: false }));
    setLinks((prev) => ({ ...prev, [promptId]: "" }));
    fetch("/api/videos").then((r) => r.json()).then(setVideos);
  };

  const removeWatermark = async (videoId: number) => {
    setRemoving((prev) => ({ ...prev, [videoId]: true }));
    await fetch(`/api/videos/${videoId}/watermark`, { method: "POST" });
    setRemoving((prev) => ({ ...prev, [videoId]: false }));
    fetch("/api/videos").then((r) => r.json()).then(setVideos);
  };

  const pendingPrompts = prompts.filter((p) => !videos.find((v) => v.promptId === p.id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">Videos</h1>
        <p className="text-white/40 text-sm mt-1">Track Sora videos and remove watermarks</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Left: Prompts awaiting links */}
        <div className="space-y-3">
          <div className="text-xs text-white/40 uppercase tracking-widest">
            Awaiting Sora Link ({pendingPrompts.length})
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {pendingPrompts.map((prompt) => (
              <Card key={prompt.id}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="muted">{prompt.duration}s</Badge>
                  {prompt.shotNumber && <Badge>Shot {prompt.shotNumber}</Badge>}
                </div>
                <div className="text-xs text-white/60 mb-3 font-mono">{prompt.label}</div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Paste Sora shared link..."
                    className="flex-1 bg-black border border-white/20 text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-white/50 placeholder:text-white/20"
                    value={links[prompt.id] || ""}
                    onChange={(e) => setLinks((prev) => ({ ...prev, [prompt.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitLink(prompt.id);
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => submitLink(prompt.id)}
                    loading={submitting[prompt.id]}
                    disabled={!links[prompt.id]}
                  >
                    Save
                  </Button>
                </div>
              </Card>
            ))}
            {pendingPrompts.length === 0 && (
              <div className="text-white/30 text-sm py-4">
                {prompts.length === 0 ? "No prompts — generate prompts first" : "All prompts have videos!"}
              </div>
            )}
          </div>
        </div>

        {/* Right: Watermark removal queue */}
        <div className="space-y-3">
          <div className="text-xs text-white/40 uppercase tracking-widest">
            Watermark Removal Queue ({videos.length})
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {videos.map((video) => (
              <Card key={video.id}>
                <div className="flex items-center justify-between mb-2">
                  <StatusIndicator status={video.watermarkStatus as "pending" | "processing" | "done" | "failed"} />
                  <span className="text-xs text-white/30 font-mono">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {video.promptLabel && (
                  <div className="text-xs text-white/60 font-mono mb-2">{video.promptLabel}</div>
                )}
                {video.soraSharedLink && (
                  <div className="text-xs text-white/30 font-mono truncate mb-3">
                    {video.soraSharedLink}
                  </div>
                )}
                {video.watermarkStatus === "done" && video.localFilePath && (
                  <div className="text-xs text-green-400 font-mono">{video.localFilePath}</div>
                )}
                {video.errorMessage && (
                  <div className="text-xs text-red-400 font-mono">{video.errorMessage}</div>
                )}
                {video.watermarkStatus === "pending" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => removeWatermark(video.id)}
                    loading={removing[video.id]}
                  >
                    Remove Watermark
                  </Button>
                )}
              </Card>
            ))}
            {videos.length === 0 && (
              <div className="text-white/30 text-sm py-4">No videos yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
