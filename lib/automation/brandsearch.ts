import { chromium } from "playwright";

export type BrandResult = {
  name: string;
  domain: string;
  monthlyTraffic: number | null;
  threeMonthGrowth: number | null;
  metaAdCount: number | null;
  niche: string | null;
  facebookPageId: string | null;
};

const UGC_NICHES = [
  "beauty",
  "skincare",
  "health",
  "fitness",
  "supplements",
  "wellness",
  "fashion",
  "apparel",
  "food",
  "beverage",
  "home",
  "kitchen",
  "pet",
  "baby",
  "sports",
];

function parseTrafficNumber(text: string): number | null {
  if (!text) return null;
  const clean = text.replace(/,/g, "").trim();
  const match = clean.match(/^([\d.]+)([kmb]?)$/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const suffix = match[2].toLowerCase();
  if (suffix === "k") return Math.round(num * 1000);
  if (suffix === "m") return Math.round(num * 1000000);
  if (suffix === "b") return Math.round(num * 1000000000);
  return Math.round(num);
}

function parseGrowthPercent(text: string): number | null {
  if (!text) return null;
  const match = text.match(/([\d.]+)%/);
  return match ? parseFloat(match[1]) : null;
}

export async function scrapeBrands(
  brandsearchUrl: string,
  email: string,
  password: string,
  onLog: (msg: string) => void
): Promise<BrandResult[]> {
  onLog("Launching browser...");
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    onLog(`Navigating to ${brandsearchUrl}...`);
    await page.goto(brandsearchUrl, { waitUntil: "networkidle" });

    // Login
    onLog("Logging in...");
    await page.locator('input[type="email"], input[name="email"]').fill(email);
    await page.locator('input[type="password"], input[name="password"]').fill(password);
    await page.locator('button[type="submit"]:has-text("Log"), button:has-text("Sign in"), button:has-text("Login")').first().click();
    await page.waitForNavigation({ waitUntil: "networkidle" });
    onLog("Logged in successfully.");

    // Apply filters
    onLog("Applying filters...");

    // Navigate to brand discovery/search page
    await page.locator('a:has-text("Brands"), a:has-text("Discovery"), a:has-text("Search"), nav a').first().click();
    await page.waitForLoadState("networkidle");

    // Try to set monthly traffic filter (100k+)
    try {
      const trafficFilter = page.locator('[data-filter="traffic"], [placeholder*="traffic" i], label:has-text("Traffic") + input').first();
      if (await trafficFilter.isVisible()) {
        await trafficFilter.fill("100000");
        onLog("Set traffic filter: 100k+");
      }
    } catch {
      onLog("Warning: Could not set traffic filter - may need manual adjustment");
    }

    // Try to set Meta ad count filter (100+)
    try {
      const adFilter = page.locator('[data-filter="meta-ads"], [placeholder*="ads" i], label:has-text("Meta Ads") + input, label:has-text("Facebook Ads") + input').first();
      if (await adFilter.isVisible()) {
        await adFilter.fill("100");
        onLog("Set Meta ads filter: 100+");
      }
    } catch {
      onLog("Warning: Could not set Meta ads filter");
    }

    // Submit filters
    try {
      await page.locator('button:has-text("Apply"), button:has-text("Filter"), button:has-text("Search")').first().click();
      await page.waitForLoadState("networkidle");
    } catch {
      onLog("Warning: Could not click apply filter button");
    }

    // Scrape results with pagination
    const results: BrandResult[] = [];
    let pageNum = 1;

    while (true) {
      onLog(`Scraping page ${pageNum}...`);

      // Wait for brand rows to load
      await page.waitForSelector('table tr, [data-testid="brand-row"], .brand-card, .brand-item', { timeout: 10000 }).catch(() => {
        onLog("Warning: Could not find brand rows");
      });

      const rows = await page.locator('table tbody tr, [data-testid="brand-row"], .brand-card, .brand-item').all();
      onLog(`Found ${rows.length} brands on page ${pageNum}`);

      for (const row of rows) {
        try {
          const nameEl = await row.locator('td:first-child, .brand-name, [data-field="name"]').first().textContent();
          const domainEl = await row.locator('td:nth-child(2), .brand-domain, [data-field="domain"]').first().textContent();
          const trafficEl = await row.locator('[data-field="traffic"], td:nth-child(3)').first().textContent().catch(() => null);
          const growthEl = await row.locator('[data-field="growth"], td:nth-child(4)').first().textContent().catch(() => null);
          const adsEl = await row.locator('[data-field="meta-ads"], [data-field="ads"], td:nth-child(5)').first().textContent().catch(() => null);
          const nicheEl = await row.locator('[data-field="niche"], [data-field="category"], td:nth-child(6)').first().textContent().catch(() => null);

          if (!nameEl || !domainEl) continue;

          const growth = parseGrowthPercent(growthEl || "");
          const traffic = parseTrafficNumber(trafficEl || "");
          const adCount = adsEl ? parseInt(adsEl.replace(/[^0-9]/g, "")) || null : null;

          // Filter by growth (100%+) and traffic (100k+) and ads (100+)
          if (traffic && traffic < 100000) continue;
          if (growth !== null && growth < 100) continue;
          if (adCount !== null && adCount < 100) continue;

          const niche = nicheEl?.trim().toLowerCase() || null;
          const isUGCNiche = !niche || UGC_NICHES.some((n) => niche.includes(n));
          if (!isUGCNiche) continue;

          results.push({
            name: nameEl.trim(),
            domain: domainEl.trim().toLowerCase(),
            monthlyTraffic: traffic,
            threeMonthGrowth: growth,
            metaAdCount: adCount,
            niche: nicheEl?.trim() || null,
            facebookPageId: null,
          });
        } catch {
          // Skip malformed rows
        }
      }

      // Try to go to next page
      const nextBtn = page.locator('button:has-text("Next"), a:has-text("Next"), [aria-label="Next page"], .pagination-next').first();
      const isDisabled = await nextBtn.isDisabled().catch(() => true);
      if (isDisabled) break;

      await nextBtn.click();
      await page.waitForLoadState("networkidle");
      pageNum++;

      if (pageNum > 20) {
        onLog("Reached max page limit (20)");
        break;
      }
    }

    onLog(`Scraping complete. Found ${results.length} qualifying brands.`);
    return results;
  } finally {
    await browser.close();
  }
}
