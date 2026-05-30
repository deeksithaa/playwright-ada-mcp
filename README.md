# ♿ playwright-ada-mcp

> **The first MCP server for ADA/WCAG accessibility auditing** — powered by Playwright + axe-core.

Ask Claude to audit any website for accessibility violations and get actionable fix suggestions — directly in your AI workflow.

---

## 🚀 What This Does

Connect this MCP server to Claude and simply say:

> *"Audit https://example.com for WCAG violations"*  
> *"Check if this page has proper alt text"*  
> *"Generate a full ADA accessibility report for our homepage"*

Claude will use Playwright to open the page, run axe-core analysis, and return detailed, actionable results.

---

## 🛠️ Tools Available

| Tool | WCAG Criteria | Description |
|---|---|---|
| `audit_page_wcag` | Full WCAG 2.1 AA | Complete audit with all violations |
| `find_missing_alt_text` | 1.1.1 (Level A) | Images missing alt attributes |
| `check_color_contrast` | 1.4.3 (Level AA) | Text contrast ratio compliance |
| `validate_aria_labels` | 4.1.2 (Level A) | ARIA roles, labels, landmarks |
| `check_keyboard_nav` | 2.4.1, 2.4.3, 2.4.7 | Tab order, skip links, focus styles |
| `check_heading_structure` | 1.3.1, 2.4.6 | H1–H6 hierarchy validation |
| `audit_form_accessibility` | 1.3.1, 3.3.1, 3.3.2 | Form labels, required fields, errors |
| `generate_ada_report` | Full WCAG 2.1 AA | Score + grade + full markdown/JSON report |

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- Claude Desktop or any MCP-compatible client

### Setup

```bash
git clone https://github.com/deeksithaa/playwright-ada-mcp.git
cd playwright-ada-mcp
npm install
npx playwright install chromium
npm run build
```

### Configure Claude Desktop

Add to your `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "playwright-ada-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/playwright-ada-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop. You'll see the ♿ tools available.

---

## 💬 Example Prompts

```
"Audit https://myapp.com for accessibility violations"
"Find all images missing alt text on https://shop.example.com"
"Check color contrast on our login page"
"Generate a full WCAG report for https://company.com in markdown"
"Check the heading structure of https://blog.example.com"
"Are there any form accessibility issues on our checkout page?"
```

---

## 📊 Sample Report Output

```
♿ ADA/WCAG Accessibility Report
URL: https://example.com
Standard: WCAG 2.1 AA

🎯 Accessibility Score: 72/100 (Grade: C)
███████░░░ 72%

SEVERITY BREAKDOWN:
🔴 Critical : 1
🟠 Serious  : 3
🟡 Moderate : 4
🔵 Minor    : 2
✅ Passed   : 38
```

---

## 🏗️ Tech Stack

- **[MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)** — Model Context Protocol
- **[Playwright](https://playwright.dev/)** — Browser automation
- **[axe-core](https://github.com/dequelabs/axe-core)** — WCAG audit engine by Deque
- **[@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)** — Official integration

---

## 🤝 Why This Exists

Playwright's official MCP server has **no accessibility tools**. Every production web app needs ADA compliance — now you can audit from your AI assistant without leaving your workflow.

---

## 📄 License

MIT © [deeksithaa](https://github.com/deeksithaa)

---

*Built with ♿ + 🤖 — accessibility should be first-class in every workflow*
