import { getPage } from "../utils/browser.js";
import { AxeBuilder } from "@axe-core/playwright";

export async function checkColorContrast(params: { url: string }): Promise<string> {
  const { page, close } = await getPage(params.url);

  try {
    const results = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();

    const violations = results.violations.filter(
      (v) => v.id === "color-contrast"
    );
    const passes = results.passes.filter((v) => v.id === "color-contrast");

    let output = `🎨 COLOR CONTRAST AUDIT: ${params.url}\n\n`;

    if (violations.length === 0) {
      output += `✅ All text elements meet WCAG 2.1 AA contrast requirements!\n`;
      output += `📊 ${passes[0]?.nodes.length ?? 0} elements checked and passed.\n`;
      output += `📌 Standard: 4.5:1 for normal text, 3:1 for large text\n`;
      return output;
    }

    const totalFailing = violations[0]?.nodes.length ?? 0;
    output += `❌ ${totalFailing} element(s) fail contrast requirements (WCAG 1.4.3)\n`;
    output += `📌 Required: 4.5:1 for normal text | 3:1 for large text (18pt+)\n\n`;

    violations[0]?.nodes.slice(0, 10).forEach((node, i) => {
      output += `${i + 1}. Element: ${node.html.substring(0, 100)}\n`;
      output += `   Target: ${node.target.join(", ")}\n`;
      output += `   🔧 ${node.failureSummary}\n\n`;
    });

    if (totalFailing > 10) {
      output += `... and ${totalFailing - 10} more elements.\n`;
    }

    output += `\n💡 TIP: Use tools like https://webaim.org/resources/contrastchecker/ to find compliant colors.\n`;

    return output;
  } finally {
    await close();
  }
}
