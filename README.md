# SkillLint

**AI skill checker and agent skill validator for folders, ZIP archives, `.skill` bundles, and `SKILL.md` files.**

![License: MIT](https://img.shields.io/badge/license-MIT-violet.svg)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)
[![Built with React](https://img.shields.io/badge/built%20with-React%2018-61dafb.svg)](https://react.dev)
[![Powered by Vite](https://img.shields.io/badge/powered%20by-Vite-646cff.svg)](https://vite.dev)
[![Node >=20](https://img.shields.io/badge/node-%3E%3D20-339933.svg)](package.json)

SkillLint is a local-first browser validator for AI agent skills. Drop in a skill package and it produces a structured audit for `SKILL.md`, references, scripts, metadata, markdown links, token budget, security patterns, and package hygiene.

Uploads stay in the browser session. The app does not need a server to inspect your files, build the report, apply supported repairs, or export a revised bundle.

## Why SkillLint

Agent skills are easy to write and easy to ship with invisible problems: vague descriptions, broken references, oversized activation context, unlinked docs, risky scripts, or credentials accidentally bundled with helper files.

SkillLint turns those issues into an actionable report:

- Sectioned checks with pass, warning, info, and error states.
- File-level risks, issue groups, metrics, and source references.
- Score dimensions for description quality, structure, progressive disclosure, safety, and overall readiness.
- In-browser file inspection and editing.
- Targeted orphan-reference link fixes, reference auto-linking, AI repair prompt generation, ZIP export, and JSON report export.

## What SkillLint Scans

| Area | What gets checked |
| --- | --- |
| `SKILL.md` structure | Root file presence, frontmatter delimiters, YAML parsing, required `name` and `description`, body presence, body length, headings, examples, and activation size. |
| Description quality | Trigger clarity, action specificity, generic verbs, first-person phrasing, negative boundaries, and length. |
| Reference graph | `references/*.md`, linked markdown files, orphaned references, missing targets, empty references, long reference files, contents guidance, and nested reference chains. |
| Internal links | Local markdown links from `SKILL.md`, relative path resolution, broken links, internal link count, and external link count. |
| Markdown health | Unbalanced fenced code blocks, heading hierarchy issues, and repeated headings across markdown files. |
| Scripts | Files under `scripts/`, whether scripts are mentioned from `SKILL.md`, and browser-visible script documentation checks. Executable permission bits are not available from browser uploads. |
| Agent metadata | Optional `agents/openai.yaml`, metadata field shape, icon references, and dependency declarations. |
| Package hygiene | Optional directories such as `references/`, `scripts/`, `assets/`, and `agents/`, plus noisy workspace/build artifacts. |
| Token budget | `SKILL.md` activation tokens, reference subtotal, full package token estimate, largest reference, context-window percentages, and rough model cost estimates. |
| Security scan | API-key-like values, private keys, JWT-like tokens, hardcoded absolute paths, dangerous command patterns, and shell-risk hints. |

## How the Validator Is Used

The validator entry point is `validateSkill(inputFiles)` in [`src/validator/validateSkill.ts`](src/validator/validateSkill.ts). The UI converts dropped folders, archives, `.skill` bundles, or single markdown files into normalized `{ path, content }` records, then passes those records into the validator.

The validator returns a `ValidationReport` with:

- `sections`: grouped checks such as skill structure, frontmatter quality, links, references, scripts, token budget, content quality, metadata, security, headings, and final quality score.
- `issues`, `findings`, and `issueGroups`: drill-down data used by the report UI.
- `files.risks`: file-level risk annotations and merged risk summaries.
- `scoreDimensions`: weighted scoring for the main quality areas.
- `fixes`: actionable recommendations that can power repair workflows.
- `trustedSources`: official, spec, internal, and heuristic references used by checks.
- `tokenBudget`, `contentQuality`, `readabilityScores`, and `contextWindows`: metrics for activation cost and skill maintainability.

Rules are intentionally transparent. Some checks map to public skill guidance and specifications; others are labeled as internal parity checks or heuristics so authors can separate hard failures from practical quality recommendations.

## Workflow

1. **Upload a skill**: drop a folder, ZIP archive, `.skill` bundle, or standalone `SKILL.md`.
2. **Review the report**: inspect sections, score breakdowns, source-backed checks, issue groups, file risks, and metrics.
3. **Open files in context**: browse the package tree and inspect or edit file contents in the browser.
4. **Repair faster**: apply targeted reference-link fixes, auto-link reference mentions, manually edit files, or copy an AI repair prompt.
5. **Export**: download the repaired package as a ZIP or export the current validation report as JSON.

## Getting Started

Requires Node.js `>=20`.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Useful commands:

```bash
npm run build      # typecheck and build the static app
npm run preview    # preview the production build
npm run validate   # typecheck, lint, and build
```

## Project Structure

```txt
src/
├── validator/          # Validation rules, report types, token estimates, scoring
├── components/report/  # Report views, issue explorer, score panels
├── components/landing/ # Public product page and upload entry point
├── domain/             # File handling, package import/export, sample data
├── hooks/              # UI behavior hooks
└── App.tsx             # Main app state and workflow orchestration
```

## Deployment

`dist/` is a static bundle and can be hosted on GitHub Pages, Netlify, Vercel static hosting, Cloudflare Pages, or any CDN.

For a GitHub Pages build with a custom base path:

```bash
VITE_BASE_PATH=/agent-skill-validator/ VITE_SITE_URL=https://your-username.github.io/agent-skill-validator/ npm run build
```

The included GitHub Actions workflow can publish the `dist/` artifact through GitHub Pages. In repository settings, set **Pages -> Source** to **GitHub Actions**.

## Contributing

Contributions are welcome. Useful places to help:

- Add or refine validation rules in [`src/validator/validateSkill.ts`](src/validator/validateSkill.ts).
- Improve report clarity, filtering, and repair flows in [`src/components/report/`](src/components/report/).
- Expand sample skills and import/export workflows in [`src/domain/`](src/domain/).
- Improve accessibility, keyboard behavior, empty states, and mobile report views.
- Add scanner edge cases for real-world skill packages.
- Tighten documentation and examples for contributors and skill authors.

Please open an issue before large changes so the implementation direction stays aligned.

## License

MIT.
