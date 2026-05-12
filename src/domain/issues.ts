import type { Severity, ValidationIssue, ValidationReport } from "../validator/types"
import type { EditableSkillFile, FileIssueMeta, IssueLocation } from "./files"
import { fileByPath } from "./files"

const severityRank: Record<Severity, number> = { safe: 0, warn: 1, danger: 2 }

function maxSeverity(...values: Severity[]): Severity {
  return values.reduce((current, next) => severityRank[next] > severityRank[current] ? next : current)
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function findLine(content: string, predicate: (line: string) => boolean) {
  const lines = content.split("\n")
  for (let index = 0; index < lines.length; index += 1) {
    if (predicate(lines[index])) return index + 1
  }
  return undefined
}

export function friendlyReferenceLabel(path: string) {
  const name = path.split("/").pop()?.replace(/\.md$/i, "") ?? path
  const title = name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
  return `${title || "Reference"} reference`
}

export function resolveIssueLocation(issue: ValidationIssue, files: EditableSkillFile[]): IssueLocation | undefined {
  if (issue.ruleId === "references.orphaned" && issue.filePath?.startsWith("references/")) {
    const skill = fileByPath(files, "SKILL.md")
    if (!skill) return { path: issue.filePath }
    const target = issue.filePath
    const line = findLine(skill.currentContent, (contentLine) => contentLine.includes(target))
    return { path: "SKILL.md", line }
  }

  if (issue.ruleId === "body.references" || issue.ruleId === "content.references") {
    const skill = fileByPath(files, "SKILL.md")
    if (!skill) return undefined
    const line = findLine(skill.currentContent, (contentLine) => /references\//i.test(contentLine))
    return { path: "SKILL.md", line }
  }

  if (issue.ruleId?.startsWith("frontmatter.")) {
    const skill = fileByPath(files, "SKILL.md")
    if (!skill) return undefined
    const line = issue.ruleId.includes("description")
      ? findLine(skill.currentContent, (contentLine) => /^description\s*:/i.test(contentLine.trim()))
      : findLine(skill.currentContent, (contentLine) => /^---\s*$/.test(contentLine.trim()))
    return { path: "SKILL.md", line }
  }

  if (issue.filePath && fileByPath(files, issue.filePath)) {
    return { path: issue.filePath, line: issue.line }
  }

  return undefined
}

export function anchorForIssue(issue: ValidationIssue) {
  return `issue-${issue.id.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}`
}

export function buildFileIssueMeta(report: ValidationReport | null, files: EditableSkillFile[]): Record<string, FileIssueMeta> {
  const result: Record<string, FileIssueMeta> = {}
  if (!report) return result

  for (const issue of report.issues) {
    const location = resolveIssueLocation(issue, files)
    const key = location?.path || issue.filePath || issue.groupKey
    if (!key || key === "__project__") continue
    const existing = result[key] ?? { errors: 0, warnings: 0, info: 0, severity: "safe" as Severity }
    if (issue.type === "error") existing.errors += 1
    else if (issue.type === "warning") existing.warnings += 1
    else existing.info += 1
    existing.severity = maxSeverity(existing.severity, issue.severity)
    result[key] = existing
  }

  return result
}

export function issueFixPreview(issue: ValidationIssue, files: EditableSkillFile[]) {
  if (issue.ruleId !== "references.orphaned" || !issue.filePath?.startsWith("references/")) return undefined
  const location = resolveIssueLocation(issue, files)
  const skill = fileByPath(files, location?.path)
  if (!skill || !location?.line) return undefined
  const lines = skill.currentContent.split("\n")
  const before = lines[location.line - 1]
  const label = friendlyReferenceLabel(issue.filePath)
  let after = before
    .replace(new RegExp(`\\*\\*\\\`${escapeRegExp(issue.filePath)}\\\`\\*\\*`, "g"), `[${label}](${issue.filePath})`)
    .replace(new RegExp(`\\\`${escapeRegExp(issue.filePath)}\\\``, "g"), `[${label}](${issue.filePath})`)

  if (after === before) after = `Read [${label}](${issue.filePath}) for details.`
  return { targetFile: location.path, line: location.line, before, after }
}

export function applyIssueFix(issue: ValidationIssue, files: EditableSkillFile[]) {
  const preview = issueFixPreview(issue, files)
  if (!preview) return files
  return files.map((file) => {
    if (file.path !== preview.targetFile || file.binary) return file
    const lines = file.currentContent.split("\n")
    lines[preview.line - 1] = preview.after
    const nextContent = lines.join("\n")
    return { ...file, currentContent: nextContent, dirty: nextContent !== file.originalContent }
  })
}

export function autoLinkReferenceMentions(files: EditableSkillFile[]) {
  const refFiles = files.filter((file) => file.path.startsWith("references/") && file.path.endsWith(".md"))
  const skill = fileByPath(files, "SKILL.md")
  if (!skill || skill.binary || refFiles.length === 0) return { files, changed: false }

  let content = skill.currentContent
  for (const ref of refFiles) {
    const label = friendlyReferenceLabel(ref.path)
    const alreadyLinked = new RegExp(`\\]\\(${escapeRegExp(ref.path)}(?:[#?][^)]*)?\\)`, "i").test(content)
    if (alreadyLinked) continue
    content = content
      .replace(new RegExp(`\\*\\*\\\`${escapeRegExp(ref.path)}\\\`\\*\\*`, "g"), `[${label}](${ref.path})`)
      .replace(new RegExp(`\\\`${escapeRegExp(ref.path)}\\\``, "g"), `[${label}](${ref.path})`)
  }

  if (content === skill.currentContent) return { files, changed: false }
  return {
    changed: true,
    files: files.map((file) => file.path === skill.path ? { ...file, currentContent: content, dirty: content !== file.originalContent } : file),
  }
}

export function generateAiFixPrompt(report: ValidationReport, files: EditableSkillFile[]) {
  const notableIssues = report.issues
    .filter((issue) => issue.type === "error" || issue.type === "warning")
    .slice(0, 20)
    .map((issue) => {
      const loc = resolveIssueLocation(issue, files)
      const where = loc ? `${loc.path}${loc.line ? `:${loc.line}` : ""}` : issue.filePath || issue.groupKey
      return `- [${issue.type.toUpperCase()}] ${where} — ${issue.message}${issue.detail ? ` (${issue.detail})` : ""}`
    })
    .join("\n")

  const fixes = report.fixes
    .slice(0, 12)
    .map((fix) => `- ${fix.label} (+${fix.points} pts, ${fix.dimension}, section: ${fix.sectionId})`)
    .join("\n")

  const referenceFiles = files
    .filter((file) => file.path.startsWith("references/") && file.path.endsWith(".md"))
    .map((file) => `- ${file.path}`)
    .join("\n")

  return `You are editing an AI agent skill package. Fix the validation issues below while preserving the existing skill purpose and package structure.\n\nCurrent score: ${report.score}/100 (${report.grade})\nResult: ${report.result}\n\nFiles in package:\n${files.map((file) => `- ${file.path}${file.dirty ? " (modified)" : ""}`).join("\n")}\n\nDetected issues:\n${notableIssues || "- No blocking warning/error issues detected."}\n\nReference files:\n${referenceFiles || "- None"}\n\nRequired fixes:\n${fixes || "- No scored fixes listed."}\n\nSpecific guidance:\n- If SKILL.md mentions reference files as inline code, convert them to markdown links, e.g. [Android reference](references/android.md).\n- Keep SKILL.md concise and under the activation token budget.\n- Do not inline long reference content into SKILL.md.\n- Preserve YAML frontmatter validity.\n- Re-run validation after editing and confirm warnings/errors are resolved.\n\nReturn only the modified files or a concise patch.`
}
