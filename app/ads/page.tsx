"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Brand = { id: number; name: string; domain: string; facebookPageId: string | null };
type Ad = {
  id: number;
  brandName: string | null;
  hook: string | null;
  bodyText: string | null;
  ctaText: string | null;
  creativeType: string;
  thumbnailUrl: string | null;
};
type SwipeFile = { id: number; content: string; createdAt: string };

export default function AdsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [swipeFiles, setSwipeFiles] = useState<SwipeFile[]>([]);
  const [activeSwipeFile, setActiveSwipeFile] = useState<SwipeFile | null>(null);
  const [scraping, setScraping] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/brands").then((r) => r.json()).then(setBrands);
    fetch("/api/ads").then((r) => r.json()).then(setAds);
    fetch("/api/swipe-file").then((r) => r.json()).then((files: SwipeFile[]) => {
      setSwipeFiles(files);
      if (files.length > 0) setActiveSwipeFile(files[0]);
    });
  }, []);

  const toggleBrand = (id: number) => {
    setSelectedBrands((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const scrapeAds = async () => {
    if (selectedBrands.length === 0) return;
    setScraping(true);
    setScrapeMsg("");
    const res = await fetch("/api/ads/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandIds: selectedBrands }),
    });
    const data = await res.json();
    setScrapeMsg(`Scraped ${data.scraped || 0} ads. Skipped: ${data.skipped || 0}.`);
    setScraping(false);
    fetch("/api/ads").then((r) => r.json()).then(setAds);
  };

  const analyzeAds = async () => {
    if (selectedBrands.length === 0) return;
    setAnalyzing(true);
    const res = await fetch("/api/analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandIds: selectedBrands }),
    });
    const data = await res.json();
    if (data.swipeFileId) {
      fetch("/api/swipe-file").then((r) => r.json()).then((files: SwipeFile[]) => {
        setSwipeFiles(files);
        setActiveSwipeFile(files[0]);
      });
    }
    setAnalyzing(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">Ads</h1>
        <p className="text-white/40 text-sm mt-1">Scrape Meta Ad Library and analyze with Claude</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Brand selector */}
        <div className="space-y-3">
          <div className="text-xs text-white/40 uppercase tracking-widest">Select Brands</div>
          <div className="border border-white/10 max-h-64 overflow-y-auto">
            {brands.map((brand) => (
              <label
                key={brand.id}
                className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0"
              >
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand.id)}
                  onChange={() => toggleBrand(brand.id)}
                  className="accent-white"
                />
                <div>
                  <div className="text-sm font-mono">{brand.name}</div>
                  {!brand.facebookPageId && (
                    <div className="text-xs text-zinc-500">Search by name</div>
                  )}
                </div>
              </label>
            ))}
            {brands.length === 0 && (
              <div className="px-4 py-3 text-white/30 text-sm">No brands — run Research first</div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={scrapeAds} loading={scraping} disabled={selectedBrands.length === 0 || scraping} size="sm">
              Scrape Meta Ads
            </Button>
            <Button variant="secondary" onClick={analyzeAds} loading={analyzing} disabled={selectedBrands.length === 0 || ads.length === 0 || analyzing} size="sm">
              Analyze with Claude
            </Button>
          </div>
          {scrapeMsg && <div className="text-xs text-white/50 font-mono">{scrapeMsg}</div>}
        </div>

        {/* Ads list */}
        <div className="col-span-2 space-y-3">
          <div className="text-xs text-white/40 uppercase tracking-widest">{ads.length} Ads</div>
          <input
            type="text"
            placeholder="Search ads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border border-white/10 px-3 py-2 text-sm font-mono text-white placeholder-white/20 focus:outline-none focus:border-white/30"
          />
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {ads.filter((ad) => {
              if (!search) return true;
              const q = search.toLowerCase();
              return (
                ad.hook?.toLowerCase().includes(q) ||
                ad.bodyText?.toLowerCase().includes(q) ||
                ad.brandName?.toLowerCase().includes(q)
              );
            }).slice(0, 20).map((ad) => (
              <Card key={ad.id} className="text-sm">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="muted">{ad.brandName}</Badge>
                  <Badge>{ad.creativeType}</Badge>
                </div>
                {ad.hook && <div className="font-bold text-sm mb-1">{ad.hook}</div>}
                {ad.bodyText && (
                  <div className="text-white/50 text-xs line-clamp-2">{ad.bodyText}</div>
                )}
                {ad.ctaText && (
                  <div className="mt-2 text-xs text-white/40">CTA: {ad.ctaText}</div>
                )}
              </Card>
            ))}
            {ads.length === 0 && (
              <div className="text-white/30 text-sm py-4">No ads scraped yet</div>
            )}
            {ads.length > 0 && search && ads.filter((ad) => {
              const q = search.toLowerCase();
              return (
                ad.hook?.toLowerCase().includes(q) ||
                ad.bodyText?.toLowerCase().includes(q) ||
                ad.brandName?.toLowerCase().includes(q)
              );
            }).length === 0 && (
              <div className="text-white/30 text-sm py-4">No ads match &quot;{search}&quot;</div>
            )}
          </div>
        </div>
      </div>

      {/* Swipe file viewer */}
      {activeSwipeFile && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/40 uppercase tracking-widest">Swipe File</div>
            <div className="flex gap-2">
              {swipeFiles.map((sf, i) => (
                <Button
                  key={sf.id}
                  variant={activeSwipeFile.id === sf.id ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveSwipeFile(sf)}
                >
                  #{i + 1}
                </Button>
              ))}
            </div>
          </div>
          <Card className="max-h-96 overflow-y-auto">
            <pre className="text-xs text-white/70 whitespace-pre-wrap font-mono leading-relaxed">
              {activeSwipeFile.content}
            </pre>
          </Card>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const blob = new Blob([activeSwipeFile.content], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `swipe-file-${activeSwipeFile.id}.txt`;
              a.click();
            }}
          >
            Download .txt
          </Button>
        </div>
      )}
    </div>
  );
}
