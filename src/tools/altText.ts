import { getPage } from "../utils/browser.js";

interface ImageAuditResult {
  url: string;
  totalImages: number;
  missingAlt: Array<{ src: string; element: string }>;
  emptyAlt: Array<{ src: string; element: string }>;
  decorativeAlt: Array<{ src: string }>;
  passed: Array<{ src: string; alt: string }>;
}

export async function findMissingAltText(params: { url: string }): Promise<string> {
  const { page, close } = await getPage(params.url);

  try {
    const result: ImageAuditResult = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll("img"));
      const audit: ImageAuditResult = {
        url: window.location.href,
        totalImages: images.length,
        missingAlt: [],
        emptyAlt: [],
        decorativeAlt: [],
        passed: [],
      };

      images.forEach((img) => {
        const src = img.src || img.getAttribute("src") || "(no src)";
        const element = img.outerHTML.substring(0, 150);

        if (!img.hasAttribute("alt")) {
          audit.missingAlt.push({ src, element });
        } else if (img.alt === "") {
          audit.decorativeAlt.push({ src });
        } else if (img.alt.trim() === "") {
          audit.emptyAlt.push({ src, element });
        } else {
          audit.passed.push({ src, alt: img.alt });
        }
      });

      return audit;
    });

    let output = `🖼️  ALT TEXT AUDIT: ${result.url}\n`;
    output += `📊 Total Images: ${result.totalImages}\n`;
    output += `✅ With proper alt: ${result.passed.length}\n`;
    output += `♿ Decorative (alt=""): ${result.decorativeAlt.length}\n`;
    output += `❌ Missing alt attribute: ${result.missingAlt.length}\n`;
    output += `⚠️  Whitespace-only alt: ${result.emptyAlt.length}\n\n`;

    if (result.missingAlt.length > 0) {
      output += `🚨 MISSING ALT ATTRIBUTE (WCAG 1.1.1 - Level A):\n`;
      result.missingAlt.forEach((img, i) => {
        output += `\n  ${i + 1}. src: ${img.src.substring(0, 80)}\n`;
        output += `     element: ${img.element}\n`;
        output += `     🔧 Fix: Add descriptive alt="..." attribute\n`;
      });
    }

    if (result.emptyAlt.length > 0) {
      output += `\n⚠️  WHITESPACE ALT (should be empty string or descriptive):\n`;
      result.emptyAlt.forEach((img, i) => {
        output += `  ${i + 1}. ${img.src.substring(0, 80)}\n`;
      });
    }

    if (result.missingAlt.length === 0 && result.emptyAlt.length === 0) {
      output += `✅ All images have alt attributes — WCAG 1.1.1 passed!\n`;
    }

    return output;
  } finally {
    await close();
  }
}
