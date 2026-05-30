import { AxeBuilder } from "@axe-core/playwright";
import { Page } from "playwright";

const DEFAULT_WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21aa"] as const;

export interface AxeViolation {
  id: string;
  impact: string | null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
}

export interface AxeResult {
  violations: AxeViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
  url: string;
  timestamp: string;
}

export async function runAxe(
  page: Page,
  options?: {
    wcagLevel?: "wcag2a" | "wcag2aa" | "wcag2aaa" | "wcag21aa" | "wcag22aa";
    include?: string[];
    exclude?: string[];
  }
): Promise<AxeResult> {
  const tags = options?.wcagLevel ? [options.wcagLevel] : [...DEFAULT_WCAG_TAGS];

  let builder = new AxeBuilder({ page })
    .withTags(tags);

  if (options?.include) {
    builder = builder.include(options.include);
  }
  if (options?.exclude) {
    builder = builder.exclude(options.exclude);
  }

  const results = await builder.analyze();
  const { passes, incomplete, inapplicable, violations } = results;

  return {
    violations: violations.map(({ id, impact, description, help, helpUrl, nodes }) => ({
      id,
      impact: impact ?? null,
      description,
      help,
      helpUrl,
      nodes: nodes.map(({ html, target, failureSummary }) => ({
        html,
        target: target.map(String),
        failureSummary: failureSummary ?? "",
      })),
    })),
    passes: passes.length,
    incomplete: incomplete.length,
    inapplicable: inapplicable.length,
    url: page.url(),
    timestamp: new Date().toISOString(),
  };
}

export function formatViolationsSummary(result: AxeResult): string {
  const { violations, passes, incomplete, url, timestamp } = result;

  if (violations.length === 0) {
    return `✅ No WCAG violations found on ${url}\n📊 ${passes} checks passed | ${incomplete} incomplete\n🕐 ${timestamp}`;
  }

  // Single-pass severity grouping
  const bySeverity = new Map<string, typeof violations>();
  ["critical", "serious", "moderate", "minor"].forEach(level => {
    bySeverity.set(level, violations.filter(v => v.impact === level));
  });

  const lines = [
    `🚨 WCAG Audit: ${violations.length} violation(s) found on ${url}`,
    `📊 Passed: ${passes} | Incomplete: ${incomplete}`,
    `🕐 ${timestamp}`,
    `\n📊 SEVERITY BREAKDOWN:`,
    `  🔴 Critical: ${bySeverity.get("critical")!.length}`,
    `  🟠 Serious:  ${bySeverity.get("serious")!.length}`,
    `  🟡 Moderate: ${bySeverity.get("moderate")!.length}`,
    `  🔵 Minor:    ${bySeverity.get("minor")!.length}`,
    `\n📋 VIOLATIONS DETAIL:`,
  ];

  violations.forEach((v, i) => {
    lines.push(`\n${i + 1}. [${(v.impact ?? "unknown").toUpperCase()}] ${v.id}`);
    lines.push(`   📌 ${v.help}`);
    lines.push(`   🔗 ${v.helpUrl}`);
    lines.push(`   🎯 Affected elements: ${v.nodes.length}`);
    if (v.nodes[0]) {
      lines.push(`   💻 Example: ${v.nodes[0].html.substring(0, 120)}...`);
      lines.push(`   🔧 Fix: ${v.nodes[0].failureSummary}`);
    }
  });

  return lines.join("\n");
}
