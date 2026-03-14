import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI UGC Ad Bot",
  description: "Automated UGC ad research and creation pipeline",
};

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/research", label: "Research" },
  { href: "/ads", label: "Ads" },
  { href: "/prompts", label: "Prompts" },
  { href: "/videos", label: "Videos" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white">
        <header className="border-b border-white/10 px-6 py-4 flex items-center gap-8">
          <span className="text-sm font-bold tracking-widest uppercase text-white">UGC Bot</span>
          <nav className="flex gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="px-6 py-8 max-w-7xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
