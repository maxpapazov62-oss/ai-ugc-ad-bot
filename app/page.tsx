"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

type Stats = {
  brands: number;
  ads: number;
  prompts: number;
  videos: number;
};

const pipeline = [
  { step: "01", label: "Research", desc: "Discover winning brands with BrandSearch", href: "/research" },
  { step: "02", label: "Ads", desc: "Scrape Meta Ad Library + analyze with Claude", href: "/ads" },
  { step: "03", label: "Prompts", desc: "Generate Sora 2 video prompts", href: "/prompts" },
  { step: "04", label: "Videos", desc: "Track Sora videos + remove watermarks", href: "/videos" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setStats(d.counts))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI UGC Ad Bot</h1>
        <p className="text-white/40 text-sm mt-1">Automated UGC ad research and creation pipeline</p>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Brands", value: stats.brands },
            { label: "Ads", value: stats.ads },
            { label: "Prompts", value: stats.prompts },
            { label: "Videos", value: stats.videos },
          ].map((stat) => (
            <Card key={stat.label} className="text-center">
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="text-white/40 text-xs mt-1 uppercase tracking-widest">{stat.label}</div>
            </Card>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-xs uppercase tracking-widest text-white/40 mb-4">Pipeline</h2>
        <div className="grid grid-cols-4 gap-4">
          {pipeline.map((step) => (
            <Link key={step.step} href={step.href}>
              <Card className="hover:border-white/30 transition-colors cursor-pointer h-full">
                <div className="text-xs text-white/30 font-mono mb-2">{step.step}</div>
                <div className="font-bold text-sm">{step.label}</div>
                <div className="text-white/40 text-xs mt-1">{step.desc}</div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
