import { getPage } from "../utils/browser.js";

export async function checkKeyboardNav(params: { url: string }): Promise<string> {
  const { page, close } = await getPage(params.url);

  try {
    // Gather focusable elements and check for focus styles
    const keyboardAudit = await page.evaluate(() => {
      const focusableSelectors = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        '[tabindex]:not([tabindex="-1"])',
        "details > summary",
      ].join(", ");

      const elements = Array.from(document.querySelectorAll(focusableSelectors));

      const skipLinks = Array.from(document.querySelectorAll("a")).filter(
        (a) =>
          a.href.includes("#main") ||
          a.href.includes("#content") ||
          a.textContent?.toLowerCase().includes("skip")
      );

      const tabTraps = elements.filter((el) => {
        const ti = el.getAttribute("tabindex");
        return ti !== null && parseInt(ti) > 0;
      });

      const missingFocusIndicator: string[] = [];
      elements.slice(0, 20).forEach((el) => {
        const styles = window.getComputedStyle(el);
        if (styles.outline === "none" || styles.outline === "0px none rgb(0, 0, 0)") {
          missingFocusIndicator.push(el.tagName + (el.id ? `#${el.id}` : ""));
        }
      });

      return {
        totalFocusable: elements.length,
        skipLinks: skipLinks.length,
        positiveTabindex: tabTraps.map((el) => ({
          tag: el.tagName,
          tabindex: el.getAttribute("tabindex"),
          text: el.textContent?.trim().substring(0, 50) ?? "",
        })),
        missingFocusIndicator,
      };
    });

    let output = `⌨️  KEYBOARD NAVIGATION AUDIT: ${params.url}\n\n`;
    output += `📊 Total focusable elements: ${keyboardAudit.totalFocusable}\n`;
    output += `⏭️  Skip navigation links: ${keyboardAudit.skipLinks > 0 ? `✅ ${keyboardAudit.skipLinks} found` : "❌ None found (WCAG 2.4.1)"}\n\n`;

    if (keyboardAudit.positiveTabindex.length > 0) {
      output += `⚠️  POSITIVE TABINDEX FOUND (breaks natural tab order):\n`;
      output += `   WCAG 2.4.3 - Focus Order\n`;
      keyboardAudit.positiveTabindex.forEach((el) => {
        output += `   • <${el.tag}> tabindex="${el.tabindex}" — "${el.text}"\n`;
      });
      output += `   🔧 Fix: Remove positive tabindex values, use tabindex="0" or natural order\n\n`;
    } else {
      output += `✅ No positive tabindex values — tab order is natural\n\n`;
    }

    if (keyboardAudit.missingFocusIndicator.length > 0) {
      output += `🔴 MISSING FOCUS INDICATORS (WCAG 2.4.7):\n`;
      keyboardAudit.missingFocusIndicator.forEach((el) => {
        output += `   • ${el}\n`;
      });
      output += `   🔧 Fix: Never use outline:none without a custom focus style\n\n`;
    } else {
      output += `✅ Focus indicators appear to be present\n\n`;
    }

    if (keyboardAudit.skipLinks === 0) {
      output += `💡 RECOMMENDATION: Add a "Skip to main content" link as the first focusable element.\n`;
      output += `   Example: <a href="#main" class="skip-link">Skip to main content</a>\n`;
    }

    return output;
  } finally {
    await close();
  }
}
