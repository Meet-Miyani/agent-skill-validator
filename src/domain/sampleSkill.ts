import type { UploadSkillFile } from "./files"
import { toEditableFiles } from "./files"

function textFile(path: string, content: string): UploadSkillFile {
  return { path, content, size: content.length }
}

const sampleFiles: UploadSkillFile[] = [
  textFile(
    "SKILL.md",
    `---
name: api-contract-review
description: Review API contract changes and validate request and response docs when routes, examples, or schemas change. Use when endpoint behavior is changing. Do not use for database tuning or UI-only updates.
---

# API contract review

Use this skill to audit API changes before they ship.

## Workflow

1. Read the request and response shape.
2. Compare docs with [deployment checklist](references/deployment-checklist.md).
3. Review the verification script in \`scripts/verify.sh\`.
4. Keep exported assets such as \`assets/report-template.svg\` aligned with examples.

\`\`\`bash
bash scripts/verify.sh
\`\`\`

## Output

- Updated docs
- Validation notes
- Follow-up fixes
`,
  ),
  textFile(
    "references/deployment-checklist.md",
    `# Deployment checklist

- Confirm request and response examples match the latest contract.
- Check error payloads for every changed endpoint.
- Capture any follow-up work before merge.
`,
  ),
  textFile(
    "references/release-notes.md",
    `# Release notes

Track notable API contract changes here after the review is complete.
`,
  ),
  textFile(
    "scripts/verify.sh",
    `#!/usr/bin/env bash
set -euo pipefail

npm run typecheck
echo "Checked API contract docs"
`,
  ),
  textFile(
    "assets/report-template.svg",
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120" role="img" aria-label="Report template">
  <rect width="240" height="120" rx="20" fill="#101826" />
  <rect x="20" y="20" width="84" height="14" rx="7" fill="#d7ff45" />
  <rect x="20" y="48" width="200" height="10" rx="5" fill="#ffffff" fill-opacity="0.14" />
  <rect x="20" y="68" width="160" height="10" rx="5" fill="#ffffff" fill-opacity="0.14" />
  <rect x="20" y="88" width="128" height="10" rx="5" fill="#ffffff" fill-opacity="0.14" />
</svg>
`,
  ),
  textFile(
    "README.md",
    `# API Contract Review

Sample skill bundle used by SkillLint to demonstrate a real validation report.
`,
  ),
  textFile(
    "LICENSE",
    `MIT License

Copyright (c) 2026 SkillLint
`,
  ),
]

export function buildSampleSkillFiles() {
  return toEditableFiles(sampleFiles)
}
