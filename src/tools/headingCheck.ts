import { getPage } from "../utils/browser.js";

interface HeadingNode {
  level: number;
  text: string;
  id: string;
}

export async function checkHeadingStructure(params: { url: string }): Promise<string> {
  const { page, close } = await getPage(params.url);

  try {
    const headings: HeadingNode[] = await page.evaluate(() => {
      const nodes = Array.from(
        document.querySelectorAll("h1, h2, h3, h4, h5, h6")
      );
      return nodes.map((el) => ({
        level: parseInt(el.tagName.substring(1)),
        text: el.textContent?.trim().substring(0, 80) ?? "",
        id: el.id ?? "",
      }));
    });

    let output = `📰 HEADING STRUCTURE AUDIT: ${params.url}\n\n`;

    if (headings.length === 0) {
      output += `❌ No headings found on this page!\n`;
      output += `   WCAG 1.3.1 — Page should have logical heading structure\n`;
      return output;
    }

    // Check for H1
    const h1s = headings.filter((h) => h.level === 1);
    output += `H1 check: ${h1s.length === 1 ? "✅ Exactly 1 H1 found" : h1s.length === 0 ? "❌ No H1 found (WCAG 2.4.6)" : `⚠️  ${h1s.length} H1s found (should be 1)`}\n\n`;

    // Check heading hierarchy
    const issues: string[] = [];
    for (let i = 1; i < headings.length; i++) {
      const prev = headings[i - 1];
      const curr = headings[i];
      if (curr.level > prev.level + 1) {
        issues.push(
          `H${prev.level} → H${curr.level} skip at "${curr.text}" (missing H${prev.level + 1})`
        );
      }
    }

    if (issues.length > 0) {
      output += `⚠️  HEADING HIERARCHY ISSUES (WCAG 1.3.1):\n`;
      issues.forEach((issue) => {
        output += `   ❌ ${issue}\n`;
      });
      output += `\n`;
    } else {
      output += `✅ Heading hierarchy is correct — no skipped levels\n\n`;
    }

    // Print heading tree
    output += `📋 HEADING TREE:\n`;
    headings.forEach((h) => {
      const indent = "  ".repeat(h.level - 1);
      const icon = h.level === 1 ? "🔷" : h.level === 2 ? "🔹" : "▸";
      output += `${indent}${icon} H${h.level}: ${h.text}${h.id ? ` [#${h.id}]` : ""}\n`;
    });

    output += `\n📊 Summary: ${headings.length} headings total`;
    for (let i = 1; i <= 6; i++) {
      const count = headings.filter((h) => h.level === i).length;
      if (count > 0) output += ` | H${i}: ${count}`;
    }

    return output;
  } finally {
    await close();
  }
}
