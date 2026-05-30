import { getPage } from "../utils/browser.js";
import { AxeBuilder } from "@axe-core/playwright";

export async function validateAriaLabels(params: { url: string }): Promise<string> {
  const { page, close } = await getPage(params.url);

  try {
    const results = await new AxeBuilder({ page })
      .withRules([
        "aria-allowed-attr",
        "aria-required-attr",
        "aria-required-children",
        "aria-required-parent",
        "aria-roles",
        "aria-valid-attr",
        "aria-valid-attr-value",
        "aria-label",
        "aria-labelledby",
        "landmark-one-main",
        "region",
        "button-name",
        "link-name",
        "image-alt",
      ])
      .analyze();

    let output = `♿ ARIA & LANDMARK AUDIT: ${params.url}\n\n`;

    if (results.violations.length === 0) {
      output += `✅ No ARIA violations found!\n`;
      output += `📊 ${results.passes.length} ARIA rules passed.\n`;
      return output;
    }

    output += `❌ ${results.violations.length} ARIA violation(s) found:\n\n`;

    results.violations.forEach((v, i) => {
      output += `${i + 1}. [${(v.impact ?? "unknown").toUpperCase()}] ${v.id}\n`;
      output += `   📌 ${v.help}\n`;
      output += `   🎯 ${v.nodes.length} affected element(s)\n`;
      if (v.nodes[0]) {
        output += `   💻 ${v.nodes[0].html.substring(0, 120)}\n`;
        output += `   🔧 ${v.nodes[0].failureSummary}\n`;
      }
      output += `   🔗 ${v.helpUrl}\n\n`;
    });

    // Landmark summary
    const landmarks = await page.evaluate(() => {
      const roles = ["main", "nav", "header", "footer", "aside", "form", "search"];
      return roles.map((role) => ({
        role,
        count: document.querySelectorAll(
          `[role="${role}"], ${role === "header" ? "header" : ""}, ${role === "footer" ? "footer" : ""}, ${role === "nav" ? "nav" : ""}, ${role === "main" ? "main" : ""}, ${role === "aside" ? "aside" : ""}`
        ).length,
      }));
    });

    output += `\n🗺️  LANDMARK ELEMENTS FOUND:\n`;
    landmarks.forEach((l) => {
      const icon = l.count > 0 ? "✅" : "⚠️ ";
      output += `  ${icon} <${l.role}>: ${l.count}\n`;
    });

    return output;
  } finally {
    await close();
  }
}
