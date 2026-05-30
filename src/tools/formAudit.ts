import { getPage } from "../utils/browser.js";

export async function auditFormAccessibility(params: { url: string }): Promise<string> {
  const { page, close } = await getPage(params.url);

  try {
    const formAudit = await page.evaluate(() => {
      const inputs = Array.from(
        document.querySelectorAll("input, select, textarea")
      ).filter(
        (el) =>
          !["hidden", "submit", "button", "reset", "image"].includes(
            (el as HTMLInputElement).type
          )
      );

      const results = {
        total: inputs.length,
        missingLabel: [] as string[],
        missingRequired: [] as string[],
        missingErrorAssociation: [] as string[],
        passed: [] as string[],
      };

      inputs.forEach((input) => {
        const el = input as HTMLInputElement;
        const id = el.id;
        const name = el.name || el.type;
        const label =
          id ? document.querySelector(`label[for="${id}"]`) : null;
        const ariaLabel = el.getAttribute("aria-label");
        const ariaLabelledBy = el.getAttribute("aria-labelledby");
        const title = el.title;

        const hasLabel = !!(label || ariaLabel || ariaLabelledBy || title);
        const descriptor = `<${el.tagName.toLowerCase()} type="${el.type}" name="${name}" id="${id}">`;

        if (!hasLabel) {
          results.missingLabel.push(descriptor);
        } else {
          results.passed.push(descriptor);
        }

        if (el.required && !el.getAttribute("aria-required")) {
          results.missingRequired.push(descriptor);
        }
      });

      const errorMessages = Array.from(
        document.querySelectorAll("[role='alert'], .error, .error-message, [aria-live]")
      );

      return {
        ...results,
        errorMessageContainers: errorMessages.length,
        formCount: document.querySelectorAll("form").length,
      };
    });

    let output = `📝 FORM ACCESSIBILITY AUDIT: ${params.url}\n\n`;
    output += `📊 Forms found: ${formAudit.formCount}\n`;
    output += `📊 Input fields: ${formAudit.total}\n`;
    output += `✅ Properly labeled: ${formAudit.passed.length}\n`;
    output += `❌ Missing labels: ${formAudit.missingLabel.length}\n`;
    output += `🔔 Error message containers: ${formAudit.errorMessageContainers}\n\n`;

    if (formAudit.missingLabel.length > 0) {
      output += `🚨 MISSING LABELS (WCAG 1.3.1, 3.3.2 — Level A):\n`;
      formAudit.missingLabel.forEach((el, i) => {
        output += `   ${i + 1}. ${el}\n`;
        output += `      🔧 Fix: Add <label for="id">, aria-label, or aria-labelledby\n`;
      });
      output += "\n";
    }

    if (formAudit.missingRequired.length > 0) {
      output += `⚠️  REQUIRED FIELDS WITHOUT aria-required (WCAG 3.3.1):\n`;
      formAudit.missingRequired.forEach((el) => {
        output += `   • ${el} — add aria-required="true"\n`;
      });
      output += "\n";
    }

    if (formAudit.errorMessageContainers === 0) {
      output += `⚠️  No error message containers found.\n`;
      output += `   🔧 Add role="alert" or aria-live="polite" for inline form errors.\n`;
    }

    return output;
  } finally {
    await close();
  }
}
