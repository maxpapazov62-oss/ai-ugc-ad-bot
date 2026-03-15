import { chromium } from "playwright";
import path from "path";
import os from "os";

export async function removeWatermark(
  soraSharedLink: string,
  watermarkRemovalUrl: string
): Promise<string> {
  const downloadDir = path.join(os.homedir(), "Downloads");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    acceptDownloads: true,
  });
  const page = await context.newPage();

  try {
    await page.goto(watermarkRemovalUrl, { waitUntil: "networkidle" });

    // Look for URL input field
    const urlInput = page.locator('input[type="url"], input[type="text"], input[placeholder*="url" i], input[placeholder*="link" i], input[placeholder*="paste" i]').first();
    await urlInput.waitFor({ timeout: 10000 });
    await urlInput.fill(soraSharedLink);

    // Look for submit button
    const submitBtn = page.locator('button[type="submit"], button:has-text("Remove"), button:has-text("Download"), button:has-text("Process"), button:has-text("Start")').first();
    await submitBtn.click();

    // Wait for download
    const download = await page.waitForEvent("download", { timeout: 120000 });
    const suggestedName = download.suggestedFilename() || `video-${Date.now()}.mp4`;
    const localPath = path.join(downloadDir, suggestedName);
    await download.saveAs(localPath);

    return localPath;
  } finally {
    await browser.close();
  }
}
