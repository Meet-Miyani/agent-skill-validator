<div align="center">
  <h1>🔍 Agent Skill Check</h1>
  <p><strong>Validate AI agent skill packages before you ship them — entirely in the browser.</strong></p>

  [![License: MIT](https://img.shields.io/badge/license-MIT-violet.svg)](LICENSE)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
  [![Built with React](https://img.shields.io/badge/built%20with-React%2018-61dafb.svg)](https://react.dev)
  [![Powered by Vite](https://img.shields.io/badge/powered%20by-Vite-646cff.svg)](https://vite.dev)

  <br />

  > Drop a `SKILL.md` package → get a scored report → fix in-browser → export a clean ZIP.
  > **Zero server uploads. Everything runs locally.**

</div>

---

## ✨ What it does

Agent Skill Check is a **static single-page app** that reviews AI agent skill packages against 14 validation sections — structure, description quality, token budget, security patterns, and export readiness.

| Feature | Details |
|---|---|
| 📦 **Any package format** | Drop a `.zip`, `.skill`, folder, or standalone `SKILL.md` |
| ⚡ **Instant report** | Static checks run client-side, results in milliseconds |
| 🔒 **Fully private** | Your files never leave the browser tab |
| ✏️ **In-browser editing** | IDE-style tabs, live revalidation on `Ctrl+S` / `Cmd+S` |
| 🤖 **AI fix prompt** | One-click copy of a pre-built prompt to send to your coding assistant |
| 📤 **Export** | Download the repaired package as a ZIP or the report as JSON |

---

## 🚀 Getting started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Then open `http://localhost:5173` and drop any skill package onto the page.

### Build for production

```bash
npm run build
```

For a **GitHub Pages build** that matches the CI pipeline (correct subpath + canonical URL):

```bash
VITE_BASE_PATH=/your-repo-name/ VITE_SITE_URL=https://your-username.github.io/your-repo-name/ npm run build
```

---

## 🌐 Deploy on GitHub Pages

The repo ships with a ready-to-go GitHub Actions workflow.

1. Create a GitHub repository (the workflow auto-derives `VITE_BASE_PATH` and `VITE_SITE_URL` from your repo name).
2. Push `main`.
3. Go to **Settings → Pages → Source: GitHub Actions**.
4. Watch the **Deploy to GitHub Pages** action complete — your live URL appears under **Settings → Pages**.

You can re-trigger a deploy any time from **Actions → Run workflow**.

> **Custom domain?** Set `VITE_SITE_URL` in the workflow to your domain and point DNS. The build emits `robots.txt` and `sitemap.xml` automatically.

---

## 🗂️ Project structure

```
src/
├── App.tsx                          # Root orchestration — state, routing, event wiring
├── hooks/
│   ├── useDarkMode.ts               # Persistent dark mode with system preference fallback
│   ├── usePanelResize.ts            # Pointer-drag panel resize for left/right panels
│   └── useGitHubStars.ts            # Cached GitHub star count fetcher
├── components/
│   ├── landing/
│   │   ├── LandingPage.tsx          # Full landing page orchestrator (exported as UploadDropzone)
│   │   ├── HeroSection.tsx          # Dark gradient hero + headline copy
│   │   ├── UploadPanel.tsx          # Drag-and-drop upload zone
│   │   ├── FeaturesSection.tsx      # TrustBar, WhatGetsScanned, ChecksAndWorkflow
│   │   └── SourcesSection.tsx       # Official reference documentation links
│   ├── report/
│   │   ├── Overview.tsx             # Dashboard: score card, top issues, sections
│   │   ├── FindingsExplorer.tsx     # IssueCard list with fix/open actions
│   │   ├── ScoreAndMore.tsx         # ScoreBreakdown, TokenBudgetView, FixesView
│   │   └── SectionView.tsx          # Single-section drill-down with checks and issues
│   ├── FileEditor.tsx               # Monaco-style textarea with issue line annotations
│   ├── FileTree.tsx                 # Right-panel IDE-style file tree
│   ├── Header.tsx                   # Top action bar (download, AI prompt, dark mode)
│   ├── ReportSidebar.tsx            # Left-panel report navigation
│   ├── ReportTab.tsx                # Thin view router → report/* components
│   ├── UploadDropzone.tsx           # Re-export shim (backward-compat import alias)
│   ├── WorkspaceTabs.tsx            # Report + file editor tabs
│   └── ui.tsx                       # Shared visual primitives (StatusPill, ScoreBar, etc.)
├── domain/
│   ├── clipboard.ts                 # Clipboard write helper
│   ├── files.ts                     # Editable package model and file utilities
│   ├── issues.ts                    # Issue location resolution, fix logic, AI prompt gen
│   └── packageIO.ts                 # ZIP/folder read and ZIP export
└── validator/
    ├── types.ts                     # Report, section, issue, and score model types
    └── validateSkill.ts             # Static validation engine (14 sections, 100-point score)
```

---

## 🧩 How validation works

The validator walks the skill package exactly as an agent runtime would:

1. **Root file** — checks for `SKILL.md`, YAML frontmatter (`---` delimiters), required `name`/`description` fields, body length, and heading structure.
2. **References** — resolves every `[label](path)` link, flags orphaned docs, missing targets, and overly long reference files.
3. **Scripts & metadata** — discovers executable scripts, checks documentation mentions, and validates optional OpenAI agent metadata.
4. **Security** — scans for API keys, private key PEM blocks, JWT-like strings, absolute paths, and dangerous shell commands.
5. **Score** — aggregates weighted sub-checks across all sections into a 0–100 score with letter grade.

---

## 🤝 Contributing

Contributions are welcome! The quickest way to get oriented:

- **Add a validation check** → `src/validator/validateSkill.ts`
- **Add a new report view** → `src/components/report/`
- **Improve landing design** → `src/components/landing/`
- **Add a hook** → `src/hooks/`

Please open an issue before large changes so we can align on approach. PRs should include a brief description of what changed and why.

---

## 📦 Other deployment targets

The `dist/` output is a plain static bundle. It works on Netlify, Vercel (static), Cloudflare Pages, or any CDN. Set `VITE_BASE_PATH` and `VITE_SITE_URL` to match your host's public URL.

---

## 📄 License

MIT — see [LICENSE](LICENSE).
