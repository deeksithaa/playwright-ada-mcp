import { getPage } from "../utils/browser.js";
import { runAxe, formatViolationsSummary } from "../utils/axeRunner.js";

export async function auditPageWcag(params: {
  url: string;
  wcagLevel?: "wcag2a" | "wcag2aa" | "wcag21aa" | "wcag22aa";
}): Promise<string> {
  const { url, wcagLevel = "wcag2aa" } = params;
  const { page, close } = await getPage(url);

  try {
    const result = await runAxe(page, { wcagLevel });
    return formatViolationsSummary(result);
  } finally {
    await close();
  }
}
