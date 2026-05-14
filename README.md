# SkillLint - AI Skill Checker & Agent Skill Validator

Validate folders, ZIPs, .skill bundles, and `SKILL.md` files in the browser.

[![License: MIT](https://img.shields.io/badge/license-MIT-violet.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Built with React](https://img.shields.io/badge/built%20with-React%2018-61dafb.svg)](https://react.dev)
[![Powered by Vite](https://img.shields.io/badge/powered%20by-Vite-646cff.svg)](https://vite.dev)

SkillLint is a browser-based AI skill checker and agent skill validator. It reviews structure, scripts, references, links, assets, token budget, and package hygiene without sending uploads to a server.

## What it does

- Accepts folders, ZIP archives, `.skill` bundles, and standalone `SKILL.md` files.
- Runs a client-side validation report with section summaries, issue drill-downs, and score breakdowns.
- Lets you inspect and edit files in-browser, apply supported fixes, and copy an AI repair prompt.
- Exports the repaired bundle as ZIP or the current report as JSON.
- Includes a built-in sample report flow so visitors can explore the product without uploading anything.

## Getting started

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`.

### Production build

```bash
npm run build
```

For a GitHub Pages build that matches CI:

```bash
VITE_BASE_PATH=/agent-skill-validator/ VITE_SITE_URL=https://your-username.github.io/agent-skill-validator/ npm run build
```

## Deploy on GitHub Pages

The repo includes a GitHub Actions workflow that builds and deploys the static app.

1. Use the repository name `agent-skill-validator`.
2. Push `main`.
3. In GitHub, set **Settings -> Pages -> Source** to **GitHub Actions**.
4. Let the `Deploy to GitHub Pages` workflow publish the `dist/` artifact.

The workflow derives both `VITE_BASE_PATH` and `VITE_SITE_URL` from the repo name, so the live site resolves under:

```txt
https://<username>.github.io/agent-skill-validator/
```

## Project structure

```txt
src/
├── App.tsx
├── components/
│   ├── landing/
│   ├── report/
│   ├── Header.tsx
│   ├── FileEditor.tsx
│   ├── FileTree.tsx
│   ├── ReportSidebar.tsx
│   ├── ReportTab.tsx
│   ├── UploadDropzone.tsx
│   └── WorkspaceTabs.tsx
├── domain/
│   ├── files.ts
│   ├── issues.ts
│   ├── packageIO.ts
│   └── sampleSkill.ts
├── hooks/
└── validator/
```

## How validation works

SkillLint walks the skill the way an agent runtime would:

1. Checks `SKILL.md` frontmatter, naming rules, description quality, and body structure.
2. Resolves internal markdown links and reference files to catch missing or orphaned docs.
3. Reviews scripts, metadata, and package layout, including optional directories such as `references/`, `scripts/`, and `assets/`.
4. Estimates activation and package token budgets before export.
5. Scans for risky patterns such as secrets, private keys, hardcoded absolute paths, and dangerous commands.

## Contributing

Good starting points:

- Add or adjust validation rules in `src/validator/validateSkill.ts`
- Improve report views in `src/components/report/`
- Refine landing copy and UX in `src/components/landing/`
- Extend sample data and local workflows in `src/domain/`

Please open an issue before large changes so the direction stays aligned.

## Other deployment targets

`dist/` is a plain static bundle. It can also be hosted on Netlify, Vercel static hosting, Cloudflare Pages, or another CDN, as long as `VITE_BASE_PATH` and `VITE_SITE_URL` match the public URL.

## License

MIT - see [LICENSE](LICENSE).
