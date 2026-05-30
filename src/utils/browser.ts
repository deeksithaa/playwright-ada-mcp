import { chromium, Browser, Page } from "playwright";

let browser: Browser | null = null;

//Only chrome is supported for now, but we can easily add firefox and webkit support in the future if needed

export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browser;
}

export async function getPage(url: string): Promise<{ page: Page; close: () => Promise<void> }> {
  const b = await getBrowser();
  const context = await b.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent:
      "Mozilla/5.0 (compatible; playwright-ada-mcp/1.0; accessibility-audit)",
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  } catch {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  }

  return {
    page,
    close: async () => {
      await context.close();
    },
  };
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
