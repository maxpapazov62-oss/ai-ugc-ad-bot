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
  const [generateStatus, setGenerateStatus] = useState("");
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
    setGenerateStatus("Connecting...");

    const res = await fetch("/api/prompts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ swipeFileId: selectedSwipeFile }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("event: status")) continue;
        if (line.startsWith("event: chunk")) continue;
        if (line.startsWith("event: error")) {
          setGenerateStatus("Error generating prompts");
        }
        if (line.startsWith("event: done")) {
          setGenerateStatus("Done");
        }
        if (line.startsWith("data: ") && !line.startsWith("data: {")) {
          setGenerateStatus(line.slice(6));
        }
        if (line.startsWith("data: ") && line.includes('"count"')) {
          const data = JSON.parse(line.slice(6));
          setGenerateStatus(`Generated ${data.count} prompts`);
        }
      }
    }

    setGenerating(false);
    fetch("/api/prompts").then((r) => r.json()).then(setPrompts);
  };

  const deleteSwipeFile = async (id: number) => {
    await fetch("/api/swipe-file", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const files: SwipeFile[] = await fetch("/api/swipe-file").then((r) => r.json());
    setSwipeFiles(files);
    setSelectedSwipeFile(files.length > 0 ? files[0].id : null);
    fetch("/api/prompts").then((r) => r.json()).then(setPrompts);
  };

  const deletePrompt = async (id: number) => {
    await fetch(`/api/prompts/${id}`, { method: "DELETE" });
    setPrompts((prev) => prev.filter((p) => p.id !== id));
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
        {generating && generateStatus && (
          <span className="text-xs text-white/40 font-mono animate-pulse">{generateStatus}</span>
        )}
        {!generating && generateStatus && generateStatus !== "" && (
          <span className="text-xs text-white/40 font-mono">{generateStatus}</span>
        )}
        {selectedSwipeFile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Delete this swipe file and all its prompts?")) {
                deleteSwipeFile(selectedSwipeFile);
              }
            }}
          >
            Delete Swipe File
          </Button>
        )}
      </div>

      {/* Filters */}
      {prompts.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
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
              <div className="flex items-center gap-2">
                <CopyButton text={prompt.promptText} />
                <button
                  onClick={() => deletePrompt(prompt.id)}
                  className="text-white/20 hover:text-red-400 text-xs font-mono transition-colors"
                >
                  delete
                </button>
              </div>
            </div>
            <div className="text-xs text-white/40 mb-1">{prompt.label}</div>
            <div className="text-sm text-white/80 font-mono leading-relaxed whitespace-pre-wrap">{prompt.promptText}</div>
          </Card>
        ))}

        {/* 30s grouped prompts */}
        {!filterDuration || filterDuration === 30
          ? Object.entries(grouped30).map(([base, shots]) => (
              <Card key={base} className="border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">30s</Badge>
                    <span className="text-xs text-white/40">{base}</span>
                  </div>
                  <button
                    onClick={() => shots.forEach((s) => deletePrompt(s.id))}
                    className="text-white/20 hover:text-red-400 text-xs font-mono transition-colors"
                  >
                    delete
                  </button>
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
                        <div className="text-xs text-white/70 font-mono leading-relaxed whitespace-pre-wrap">{shot.promptText}</div>
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
