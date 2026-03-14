"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CopyButton } from "@/components/ui/CopyButton";

type SwipeFile = { id: number; content: string; createdAt: string };
type Prompt = {
  id: number;
  brandName: string | null;
  label: string;
  duration: number;
  shotNumber: number | null;
  promptText: string;
  angle: string | null;
  status: string;
  soraSharedLink: string | null;
};

export default function PromptsPage() {
  const [swipeFiles, setSwipeFiles] = useState<SwipeFile[]>([]);
  const [selectedSwipeFile, setSelectedSwipeFile] = useState<number | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [generating, setGenerating] = useState(false);
  const [filterDuration, setFilterDuration] = useState<number | null>(null);
  const [filterBrand, setFilterBrand] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/swipe-file").then((r) => r.json()).then((files: SwipeFile[]) => {
      setSwipeFiles(files);
      if (files.length > 0) setSelectedSwipeFile(files[0].id);
    });
    fetch("/api/prompts").then((r) => r.json()).then(setPrompts);
  }, []);

  const generate = async () => {
    if (!selectedSwipeFile) return;
    setGenerating(true);
    const res = await fetch("/api/prompts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ swipeFileId: selectedSwipeFile }),
    });
    await res.json();
    setGenerating(false);
    fetch("/api/prompts").then((r) => r.json()).then(setPrompts);
  };

  const brands = Array.from(new Set(prompts.map((p) => p.brandName).filter(Boolean) as string[]));
  const filtered = prompts.filter((p) => {
    if (filterDuration && p.duration !== filterDuration) return false;
    if (filterBrand && p.brandName !== filterBrand) return false;
    return true;
  });

  // Group 30s prompts by label base
  const grouped30 = filtered.filter((p) => p.duration === 30).reduce<Record<string, Prompt[]>>((acc, p) => {
    const base = p.label.replace(/ – 30s Shot \d$/, "");
    if (!acc[base]) acc[base] = [];
    acc[base].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">Prompts</h1>
        <p className="text-white/40 text-sm mt-1">Generate and manage Sora 2 video prompts</p>
      </div>

      {/* Generate controls */}
      <div className="flex items-center gap-4">
        <select
          className="bg-black border border-white/20 text-white text-sm font-mono px-3 py-2 focus:outline-none focus:border-white/50"
          value={selectedSwipeFile ?? ""}
          onChange={(e) => setSelectedSwipeFile(Number(e.target.value))}
        >
          {swipeFiles.map((sf) => (
            <option key={sf.id} value={sf.id}>
              Swipe File #{sf.id} — {new Date(sf.createdAt).toLocaleDateString()}
            </option>
          ))}
          {swipeFiles.length === 0 && <option value="">No swipe files</option>}
        </select>
        <Button onClick={generate} loading={generating} disabled={!selectedSwipeFile || generating}>
          Generate Sora Prompts
        </Button>
      </div>

      {/* Filters */}
      {prompts.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 uppercase tracking-widest">Filter:</span>
          {[null, 15, 30].map((d) => (
            <Button
              key={String(d)}
              variant={filterDuration === d ? "primary" : "ghost"}
              size="sm"
              onClick={() => setFilterDuration(d)}
            >
              {d === null ? "All" : `${d}s`}
            </Button>
          ))}
          <span className="text-white/20">|</span>
          <Button variant={!filterBrand ? "primary" : "ghost"} size="sm" onClick={() => setFilterBrand(null)}>All brands</Button>
          {brands.map((b) => (
            <Button
              key={b}
              variant={filterBrand === b ? "primary" : "ghost"}
              size="sm"
              onClick={() => setFilterBrand(b)}
            >
              {b}
            </Button>
          ))}
        </div>
      )}

      {/* Prompts list */}
      <div className="space-y-4">
        {/* 15s prompts */}
        {filtered.filter((p) => p.duration === 15).map((prompt) => (
          <Card key={prompt.id}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="muted">{prompt.brandName}</Badge>
                <Badge>15s</Badge>
                {prompt.angle && <Badge variant="default">{prompt.angle}</Badge>}
              </div>
              <CopyButton text={prompt.promptText} />
            </div>
            <div className="text-xs text-white/40 mb-1">{prompt.label}</div>
            <div className="text-sm text-white/80 font-mono leading-relaxed">{prompt.promptText}</div>
          </Card>
        ))}

        {/* 30s grouped prompts */}
        {!filterDuration || filterDuration === 30
          ? Object.entries(grouped30).map(([base, shots]) => (
              <Card key={base} className="border-white/20">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="warning">30s</Badge>
                  <span className="text-xs text-white/40">{base}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {shots
                    .sort((a, b) => (a.shotNumber || 0) - (b.shotNumber || 0))
                    .map((shot) => (
                      <div key={shot.id} className="border border-white/10 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-white/40">Shot {shot.shotNumber} of 2</span>
                          <CopyButton text={shot.promptText} label={`Copy Shot ${shot.shotNumber}`} />
                        </div>
                        <div className="text-xs text-white/70 font-mono leading-relaxed">{shot.promptText}</div>
                      </div>
                    ))}
                </div>
              </Card>
            ))
          : null}

        {filtered.length === 0 && (
          <div className="text-white/30 text-sm py-4">
            {prompts.length === 0 ? "No prompts generated yet" : "No prompts match current filters"}
          </div>
        )}
      </div>
    </div>
  );
}
