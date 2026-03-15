"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Brand = {
  id: number;
  name: string;
  domain: string;
  monthlyTraffic: number | null;
  threeMonthGrowth: number | null;
  metaAdCount: number | null;
  niche: string | null;
  facebookPageId: string | null;
};

function formatTraffic(n: number | null) {
  if (!n) return "—";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

export default function ResearchPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [collapsedNiches, setCollapsedNiches] = useState<Set<string>>(new Set());
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [pageIdInput, setPageIdInput] = useState("");
  const logsRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetch("/api/brands")
      .then((r) => r.json())
      .then(setBrands)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  const startResearch = async () => {
    setLogs([]);
    setRunning(true);

    const res = await fetch("/api/research/start", { method: "POST" });
    const { jobId: id, error } = await res.json();
    if (error) {
      setLogs([`Error: ${error}`]);
      setRunning(false);
      return;
    }

    const es = new EventSource(`/api/research/stream?jobId=${id}`);
    esRef.current = es;

    es.addEventListener("log", (e) => {
      const { message } = JSON.parse(e.data);
      setLogs((prev) => [...prev, message]);
    });

    es.addEventListener("done", (e) => {
      const { data } = JSON.parse(e.data);
      setLogs((prev) => [...prev, `✓ Complete. Found ${data?.count || 0} brands.`]);
      setRunning(false);
      es.close();
      fetch("/api/brands").then((r) => r.json()).then(setBrands);
    });

    es.addEventListener("failed", () => {
      setLogs((prev) => [...prev, "✗ Job failed."]);
      setRunning(false);
      es.close();
    });

    es.onerror = () => {
      setRunning(false);
      es.close();
    };
  };

  const savePageId = async (brandId: number) => {
    await fetch("/api/brands", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: brandId, facebookPageId: pageIdInput.trim() }),
    });
    setBrands((prev) =>
      prev.map((b) => b.id === brandId ? { ...b, facebookPageId: pageIdInput.trim() || null } : b)
    );
    setEditingPageId(null);
    setPageIdInput("");
  };

  const toggleNiche = (niche: string) => {
    setCollapsedNiches((prev) => {
      const next = new Set(prev);
      if (next.has(niche)) next.delete(niche);
      else next.add(niche);
      return next;
    });
  };

  // Group brands by niche
  const grouped = brands.reduce<Record<string, Brand[]>>((acc, brand) => {
    const niche = brand.niche || "Other";
    if (!acc[niche]) acc[niche] = [];
    acc[niche].push(brand);
    return acc;
  }, {});

  const sortedNiches = Object.keys(grouped).sort((a, b) =>
    a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">Research</h1>
        <p className="text-white/40 text-sm mt-1">Discover winning brands via BrandSearch automation</p>
      </div>

      <div className="flex gap-4">
        <Button onClick={startResearch} loading={running} disabled={running}>
          {running ? "Scraping..." : "Start BrandSearch Scrape"}
        </Button>
      </div>

      {(logs.length > 0 || running) && (
        <Card>
          <div className="text-xs text-white/40 uppercase tracking-widest mb-3">Live Log</div>
          <div
            ref={logsRef}
            className="font-mono text-xs text-white/70 space-y-1 max-h-48 overflow-y-auto"
          >
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
            {running && <div className="text-white/30 animate-pulse">...</div>}
          </div>
        </Card>
      )}

      {brands.length > 0 && (
        <div className="space-y-0">
          <div className="text-xs text-white/40 uppercase tracking-widest mb-3">
            {brands.length} Brands — {sortedNiches.length} Niches
          </div>

          {sortedNiches.map((niche) => {
            const nicheBrands = grouped[niche];
            const isCollapsed = collapsedNiches.has(niche);

            return (
              <div key={niche} className="border border-white/10 mb-2">
                {/* Niche header */}
                <button
                  onClick={() => toggleNiche(niche)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-white/80">{niche}</span>
                    <span className="text-xs text-white/30 font-mono">{nicheBrands.length} brands</span>
                  </div>
                  <span className="text-white/30 text-xs font-mono">{isCollapsed ? "+" : "−"}</span>
                </button>

                {/* Brands table */}
                {!isCollapsed && (
                  <table className="w-full text-sm font-mono">
                    <thead>
                      <tr className="border-b border-white/10 text-white/30 text-xs uppercase tracking-widest">
                        <th className="text-left px-4 py-2">Brand</th>
                        <th className="text-left px-4 py-2">Domain</th>
                        <th className="text-right px-4 py-2">Traffic/mo</th>
                        <th className="text-right px-4 py-2">3M Growth</th>
                        <th className="text-right px-4 py-2">Meta Ads</th>
                        <th className="text-left px-4 py-2">FB Page ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nicheBrands.map((brand) => (
                        <tr key={brand.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-4 py-2 font-bold">{brand.name}</td>
                          <td className="px-4 py-2 text-white/50">{brand.domain}</td>
                          <td className="px-4 py-2 text-right">{formatTraffic(brand.monthlyTraffic)}</td>
                          <td className="px-4 py-2 text-right">
                            {brand.threeMonthGrowth != null ? (
                              <span className="text-green-400">+{brand.threeMonthGrowth.toFixed(0)}%</span>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-2 text-right">{brand.metaAdCount ?? "—"}</td>
                          <td className="px-4 py-2">
                            {editingPageId === brand.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  autoFocus
                                  type="text"
                                  placeholder="e.g. 109113745882588"
                                  value={pageIdInput}
                                  onChange={(e) => setPageIdInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") savePageId(brand.id);
                                    if (e.key === "Escape") { setEditingPageId(null); setPageIdInput(""); }
                                  }}
                                  className="bg-black border border-white/30 text-white text-xs font-mono px-2 py-1 w-44 focus:outline-none"
                                />
                                <button onClick={() => savePageId(brand.id)} className="text-xs text-green-400 font-mono">save</button>
                                <button onClick={() => { setEditingPageId(null); setPageIdInput(""); }} className="text-xs text-white/30 font-mono">×</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setEditingPageId(brand.id); setPageIdInput(brand.facebookPageId || ""); }}
                                className="text-xs font-mono text-left hover:text-white transition-colors"
                              >
                                {brand.facebookPageId
                                  ? <span className="text-green-400">{brand.facebookPageId}</span>
                                  : <span className="text-white/20">set page id</span>
                                }
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
