import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { auditPageWcag } from "./tools/auditPage.js";
import { findMissingAltText } from "./tools/altText.js";
import { checkColorContrast } from "./tools/colorContrast.js";
import { validateAriaLabels } from "./tools/ariaValidator.js";
import { checkKeyboardNav } from "./tools/keyboardNav.js";
import { checkHeadingStructure } from "./tools/headingCheck.js";
import { auditFormAccessibility } from "./tools/formAudit.js";
import { generateAdaReport } from "./tools/reportGenerator.js";
import { closeBrowser } from "./utils/browser.js";

const server = new Server(
  {
    name: "playwright-ada-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ─── List Tools ───────────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "audit_page_wcag",
        description:
          "Run a full WCAG 2.1 AA accessibility audit on any URL using axe-core. Returns all violations with severity, affected elements, and fix suggestions.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The URL to audit (e.g. https://example.com)",
            },
            wcagLevel: {
              type: "string",
              enum: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
              description: "WCAG conformance level to test against (default: wcag2aa)",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "find_missing_alt_text",
        description:
          "Scan a page for images missing alt attributes. Identifies WCAG 1.1.1 violations and distinguishes between missing, empty, and decorative alt text.",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "The URL to scan" },
          },
          required: ["url"],
        },
      },
      {
        name: "check_color_contrast",
        description:
          "Check all text elements for WCAG 1.4.3 color contrast compliance (4.5:1 for normal text, 3:1 for large text).",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "The URL to check" },
          },
          required: ["url"],
        },
      },
      {
        name: "validate_aria_labels",
        description:
          "Validate ARIA roles, labels, and landmark elements. Checks for missing aria-labels, invalid roles, and proper landmark structure.",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "The URL to validate" },
          },
          required: ["url"],
        },
      },
      {
        name: "check_keyboard_nav",
        description:
          "Test keyboard navigation accessibility — skip links, tab order, positive tabindex usage, and focus indicators (WCAG 2.4.1, 2.4.3, 2.4.7).",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "The URL to test" },
          },
          required: ["url"],
        },
      },
      {
        name: "check_heading_structure",
        description:
          "Audit heading hierarchy (H1-H6) for logical structure, missing H1, and skipped heading levels (WCAG 1.3.1, 2.4.6).",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "The URL to check" },
          },
          required: ["url"],
        },
      },
      {
        name: "audit_form_accessibility",
        description:
          "Check form inputs for missing labels, aria-required attributes, and error message associations (WCAG 1.3.1, 3.3.1, 3.3.2).",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "The URL containing forms" },
          },
          required: ["url"],
        },
      },
      {
        name: "generate_ada_report",
        description:
          "Generate a complete ADA/WCAG accessibility report with a score, grade, full violation list, and fix recommendations. Supports markdown or JSON output.",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "The URL to report on" },
            format: {
              type: "string",
              enum: ["markdown", "json"],
              description: "Output format (default: markdown)",
            },
          },
          required: ["url"],
        },
      },
    ],
  };
});

// ─── Call Tools ───────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result = "";

    switch (name) {
      case "audit_page_wcag":
        result = await auditPageWcag(args as { url: string; wcagLevel?: "wcag2a" | "wcag2aa" | "wcag21aa" | "wcag22aa" });
        break;
      case "find_missing_alt_text":
        result = await findMissingAltText(args as { url: string });
        break;
      case "check_color_contrast":
        result = await checkColorContrast(args as { url: string });
        break;
      case "validate_aria_labels":
        result = await validateAriaLabels(args as { url: string });
        break;
      case "check_keyboard_nav":
        result = await checkKeyboardNav(args as { url: string });
        break;
      case "check_heading_structure":
        result = await checkHeadingStructure(args as { url: string });
        break;
      case "audit_form_accessibility":
        result = await auditFormAccessibility(args as { url: string });
        break;
      case "generate_ada_report":
        result = await generateAdaReport(args as { url: string; format?: "markdown" | "json" });
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: "text", text: result }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `❌ Error: ${message}` }],
      isError: true,
    };
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("♿ playwright-ada-mcp server running on stdio");
}

process.on("SIGINT", async () => {
  await closeBrowser();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeBrowser();
  process.exit(0);
});

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
