"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Brand = {
  id: number;
  name: string;
  domain: string;
  monthlyTraffic: number | null;
  threeMonthGrowth: number | null;
  metaAdCount: number | null;
  niche: string | null;
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
  const [jobId, setJobId] = useState<string | null>(null);
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
    setJobId(id);

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
        <div>
          <div className="text-xs text-white/40 uppercase tracking-widest mb-3">
            {brands.length} Brands Found
          </div>
          <div className="border border-white/10">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-widest">
                  <th className="text-left px-4 py-3">Brand</th>
                  <th className="text-left px-4 py-3">Domain</th>
                  <th className="text-right px-4 py-3">Traffic/mo</th>
                  <th className="text-right px-4 py-3">3M Growth</th>
                  <th className="text-right px-4 py-3">Meta Ads</th>
                  <th className="text-left px-4 py-3">Niche</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr key={brand.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-bold">{brand.name}</td>
                    <td className="px-4 py-3 text-white/60">{brand.domain}</td>
                    <td className="px-4 py-3 text-right">{formatTraffic(brand.monthlyTraffic)}</td>
                    <td className="px-4 py-3 text-right">
                      {brand.threeMonthGrowth != null ? (
                        <span className="text-green-400">+{brand.threeMonthGrowth.toFixed(0)}%</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">{brand.metaAdCount ?? "—"}</td>
                    <td className="px-4 py-3">
                      {brand.niche ? <Badge variant="muted">{brand.niche}</Badge> : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
