import { load as parseYaml } from "js-yaml"
import { getEncoding } from "js-tiktoken"

import type {
  ActionableFix,
  FileRisk,
  FindingType,
  IssueGroup,
  ReferenceFileInfo,
  RuleReference,
  ScoreCheck,
  ScoreDimension,
  SectionCheck,
  SectionStatus,
  Severity,
  SkillFile,
  TokenEstimate,
  ValidationFinding,
  ValidationIssue,
  ValidationReport,
  ValidationSection,
} from "./types"

const SOURCE_URLS: Record<string, string> = {
  "developers.openai.com/codex/skills": "https://developers.openai.com/codex/skills",
  "agentskills.io/specification": "https://agentskills.io/specification",
  "agentskills.io/specification#description-field": "https://agentskills.io/specification#description-field",
  "agentskills.io/specification#progressive-disclosure": "https://agentskills.io/specification#progressive-disclosure",
  "agentskills.io/specification#references": "https://agentskills.io/specification#references",
  "agentskills.io/specification#file-references": "https://agentskills.io/specification#file-references",
  "agentskills.io/skill-creation/best-practices": "https://agentskills.io/skill-creation/best-practices",
  "agentskills.io/skill-creation/optimizing-descriptions": "https://agentskills.io/skill-creation/optimizing-descriptions",
  "platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices": "https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices",
}

function resolveUrl(source: string): string | undefined { return SOURCE_URLS[source] }

const NAME_MAX_LEN = 64
const DESC_MIN_USEFUL = 30
const DESC_MAX_LEN = 1024
const BODY_MAX_LINES = 500
const TOKEN_BUDGET = 5000
const TOKEN_SAFE_ZONE = 3500
const TOKEN_WARN_ZONE = 5000
const TOTAL_TOKEN_SAFE = 50000
const TOTAL_TOKEN_WARN = 100000

const severityRank: Record<Severity, number> = { safe: 0, warn: 1, danger: 2 }
const findingRank: Record<FindingType, number> = { pass: 0, info: 1, warning: 2, error: 3 }

type SectionBuilder = {
  id: string; title: string; scannedTargets: string[]; checks: SectionCheck[]; testsRun: string[]; algorithmsUsed: string[]; referencesUsed: RuleReference[]; metrics: ValidationSection["metrics"]; issues: ValidationIssue[]; findings: ValidationFinding[]; affectedFiles: FileRisk[]; recommendations: ActionableFix[]
}

type ParsedSkill = { frontmatter: string; body: string; isDelimited: boolean }

let _enc: ReturnType<typeof getEncoding> | null = null
function getEncoder() {
  if (!_enc) _enc = getEncoding("cl100k_base")
  return _enc
}

export function estimateTokens(content: string): TokenEstimate {
  const chars = content.length
  const words = content.split(/\s+/).filter(Boolean).length
  const lines = content.length === 0 ? 0 : content.split("\n").length
  let tokens: number
  try { tokens = getEncoder().encode(content).length } catch { tokens = Math.floor(chars / 4) }
  return { tokens, chars, words, lines }
}

const MODEL_PRICING = [
  { model: "gpt-4o", label: "GPT-4o", perMillionTokens: 5.00 },
  { model: "gpt-4o-mini", label: "GPT-4o mini", perMillionTokens: 0.15 },
  { model: "gpt-4-turbo", label: "GPT-4 Turbo", perMillionTokens: 10.00 },
  { model: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", perMillionTokens: 0.50 },
]

function computeCostEstimates(inputTokens: number) {
  return MODEL_PRICING.map(({ model, label, perMillionTokens }) => {
    const costPerActivation = (inputTokens / 1_000_000) * perMillionTokens
    return { model, label, costPer1kActivations: Math.round(costPerActivation * 1000 * 10000) / 10000 }
  })
}

export function tokenZone(tokens: number, safe: number, warn: number): Severity {
  if (tokens <= safe) return "safe"
  if (tokens <= warn) return "warn"
  return "danger"
}

function maxSeverity(...values: Severity[]): Severity {
  return values.reduce((current, next) => severityRank[next] > severityRank[current] ? next : current)
}

function findingSeverity(type: FindingType): Severity {
  if (type === "error") return "danger"
  if (type === "warning") return "warn"
  return "safe"
}

function normalizeWhitespace(value: string) { return value.replace(/\s+/g, " ").trim() }
function safeDecodeUriComponent(value: string) { try { return decodeURIComponent(value) } catch { return value } }

export function normalizeSkillPath(path: string) {
  return path.replace(/\\/g, "/").replace(/^\/+/, "").replace(/^\.\//, "").replace(/\/\.\//g, "/")
}

export function normalizeSkillFiles<T extends SkillFile>(inputFiles: T[]) {
  const normalized = inputFiles
    .map((file) => ({ ...file, path: normalizeSkillPath(file.path) }))
    .filter((file) => file.path.length > 0)

  const hasRootSkill = normalized.some((file) => file.path.toLowerCase() === "skill.md")
  let strippedRootPrefix: string | undefined

  if (!hasRootSkill) {
    const skillCandidates = normalized.filter((file) => /(^|\/)SKILL\.md$/i.test(file.path))
    if (skillCandidates.length === 1) {
      const candidatePath = skillCandidates[0].path
      strippedRootPrefix = candidatePath.slice(0, candidatePath.length - "SKILL.md".length)
    }
  }

  const files = strippedRootPrefix
    ? normalized.map((file) => file.path.startsWith(strippedRootPrefix!) ? { ...file, path: file.path.slice(strippedRootPrefix!.length) } : file)
    : normalized

  return { files: uniqueByKey(files, (file) => file.path.toLowerCase()), strippedRootPrefix }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>
  return undefined
}

function firstMatchingLine(content: string, pattern: RegExp): number | undefined {
  const flags = pattern.flags.replace("g", "")
  const re = new RegExp(pattern.source, flags)
  const lines = content.split("\n")
  for (let index = 0; index < lines.length; index += 1) {
    if (re.test(lines[index])) return index + 1
  }
  return undefined
}

function extractLocalMarkdownLinks(markdown: string) {
  return Array.from(new Set(Array.from(markdown.matchAll(/\]\(([^)]+\.[mM][dD])(?:[#?][^)]+)?\)/g))
    .map((match) => normalizeSkillPath(safeDecodeUriComponent(match[1].trim())))
    .filter((target) => !/^https?:\/\//i.test(target))
    .filter((target) => !target.startsWith("#"))
    .filter((target) => !/^SKILL\.[mM][dD]$/i.test(target))))
}

function splitSkillFile(content: string): ParsedSkill {
  const lines = content.split("\n")
  if (lines[0]?.trim() !== "---") return { frontmatter: "", body: content, isDelimited: false }
  const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---")
  if (closingIndex === -1) return { frontmatter: "", body: "", isDelimited: false }
  return { frontmatter: lines.slice(1, closingIndex).join("\n"), body: lines.slice(closingIndex + 1).join("\n"), isDelimited: true }
}

function startSection(id: string, title: string, options?: { scannedTargets?: string[], testsRun?: string[], algorithmsUsed?: string[], referencesUsed?: RuleReference[] }): SectionBuilder {
  return {
    id, title, scannedTargets: options?.scannedTargets ?? [], checks: [], testsRun: options?.testsRun ?? [],
    algorithmsUsed: options?.algorithmsUsed ?? [], referencesUsed: options?.referencesUsed ?? [], metrics: [], issues: [], findings: [], affectedFiles: [], recommendations: [],
  }
}

function pushRisk(section: SectionBuilder, risk: FileRisk) {
  const exists = section.affectedFiles.some(item => item.path === risk.path && item.reason === risk.reason && item.status === risk.status && item.sectionId === risk.sectionId)
  if (!exists) section.affectedFiles.push(risk)
}

function pushCheck(section: SectionBuilder, result: FindingType, label: string, options?: { detail?: string, filePath?: string, line?: number, severity?: Severity, riskStatus?: string, riskReason?: string, points?: number, maxPoints?: number, ruleId?: string, sources?: RuleReference[] }) {
  section.checks.push({ label, result, detail: options?.detail, points: options?.points, maxPoints: options?.maxPoints, ruleId: options?.ruleId })
  if (result === "error" || result === "warning") pushIssue(section, result, label, options)
  if (options?.filePath && options?.riskStatus && options?.riskReason) {
    pushRisk(section, { path: options.filePath, status: options.riskStatus, severity: options.severity ?? findingSeverity(result), reason: options.riskReason, sectionId: section.id })
  }
}

function pushIssue(section: SectionBuilder, type: Exclude<FindingType, "pass">, message: string, options?: { detail?: string, filePath?: string, line?: number, severity?: Severity, ruleId?: string, sources?: RuleReference[] }) {
  const severity = options?.severity ?? findingSeverity(type)
  const sourceRefs = options?.sources && options.sources.length > 0 ? options.sources : section.referencesUsed.filter((item) => item.kind !== "internal")
  const id = [section.id, options?.ruleId ?? "no-rule", options?.filePath ?? "__project__", options?.line ?? 0, message].join(":")
  
  const issue: ValidationIssue = {
    id, groupKey: options?.filePath ?? "__project__", type, severity, section: section.title, sectionId: section.id, sectionTitle: section.title,
    message, detail: options?.detail, filePath: options?.filePath, line: options?.line, ruleId: options?.ruleId, sources: sourceRefs,
  }
  section.issues.push(issue)
  section.findings.push({ type, section: section.title, message, detail: options?.detail, filePath: options?.filePath, line: options?.line, ruleId: options?.ruleId, severity })
}

function finalizeSection(section: SectionBuilder): ValidationSection {
  const errors = section.issues.filter((item) => item.type === "error").length
  const warnings = section.issues.filter((item) => item.type === "warning").length
  const infos = section.issues.filter((item) => item.type === "info").length
  
  let status: SectionStatus = "pass"
  if (errors > 0) status = "fail"
  else if (warnings > 0) status = "pass_with_warnings"
  else if (infos > 0 && section.checks.every((item) => item.result !== "pass")) status = "info"
  
  const severity = section.affectedFiles.reduce((current, risk) => maxSeverity(current, risk.severity), errors > 0 ? "danger" : warnings > 0 ? "warn" : "safe" as Severity)
  
  const summary = errors > 0 ? `${errors} error${errors === 1 ? "" : "s"} and ${warnings} warning${warnings === 1 ? "" : "s"} across ${section.checks.length} checks.`
    : warnings > 0 ? `${warnings} warning${warnings === 1 ? "" : "s"} across ${section.checks.length} checks.`
    : status === "info" ? `${infos} informational note${infos === 1 ? "" : "s"} recorded for this section.`
    : `All ${section.checks.length} checks passed.`

  return { ...section, summary, status, severity }
}

function scoreSummary(score: number, max: number) {
  const pct = Math.round((score / max) * 100)
  if (pct >= 90) return "Strong"
  if (pct >= 75) return "Healthy"
  if (pct >= 60) return "Needs attention"
  return "High leverage fixes available"
}

function makeReferences(...items: RuleReference[]) { return items.map((item) => ({ ...item, url: item.url ?? resolveUrl(item.source) })) }
function uniqueByKey<T>(items: T[], key: (item: T) => string) { const seen = new Set<string>(); return items.filter((item) => { const id = key(item); if (seen.has(id)) return false; seen.add(id); return true }) }

function parseObjectYaml(content: string) {
  try { const parsed = parseYaml(content); if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown> } catch { return null }
  return null
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string")
  if (typeof value === "string" && value.trim()) return [value.trim()]
  return []
}

function headingLabel(line: string) { return line.replace(/^#+\s*/, "").trim().toLowerCase() }

export function validateSkill(inputFiles: SkillFile[]): ValidationReport {
  const normalizedPackage = normalizeSkillFiles(inputFiles)
  const files = normalizedPackage.files
  const allContentEstimate = estimateTokens(files.map((file) => file.content).join("\n"))

  const getFile = (path: string) => {
    const normalizedPath = normalizeSkillPath(path)
    return files.find((file) => file.path.toLowerCase() === normalizedPath.toLowerCase())
  }
  const hasDir = (dir: string) => {
    const normalizedDir = normalizeSkillPath(dir).replace(/\/$/, "")
    return files.some((file) => file.path.startsWith(`${normalizedDir}/`))
  }
  const dirFileCount = (dir: string) => {
    const normalizedDir = normalizeSkillPath(dir).replace(/\/$/, "")
    return files.filter((file) => file.path.startsWith(`${normalizedDir}/`)).length
  }

  const skillFile = getFile("SKILL.md")
  const readmeFile = getFile("README.md")
  const hasReadme = Boolean(readmeFile)
  const hasRefsDir = hasDir("references")
  const hasScriptsDir = hasDir("scripts")
  const hasLicense = Boolean(getFile("LICENSE")) || Boolean(getFile("LICENSE.md")) || Boolean(getFile("LICENSE.txt"))

  const dirs = ["references", "scripts", "assets", "agents"].filter(hasDir).map((dir) => ({ name: dir, fileCount: dirFileCount(dir) }))

  const parsedSkill = splitSkillFile(skillFile?.content ?? "")
  const frontmatterObject = parsedSkill.isDelimited ? parseObjectYaml(parsedSkill.frontmatter) : null

  let skillName = "", hasName = false, nameOk = false, hasDesc = false, descLen = 0, descWhat = false, descWhen = false, descNotFirstPerson = true, descNotGeneric = true, descNegatives = false
  let codeBlocks = 0, headings = 0, refLinks = 0, bodyLines = 0, bodyTokens = 0, internalLinks = 0, externalLinks = 0, fencesOk = true, refsTotal = 0, refsLinked = 0, secretsCount = 0, hardcodedCount = 0, dangerousCount = 0

  const sections: ValidationSection[] = []
  const refStatuses: ReferenceFileInfo[] = []

  // 1. Structure Section
  const structureSection = startSection("skill-structure", "Skill Structure", {
    scannedTargets: ["SKILL.md", "references/", "scripts/", "assets/", "LICENSE"],
    testsRun: ["Required file presence", "Optional directory discovery", "License discovery"],
    algorithmsUsed: ["Case-insensitive path lookup for root files", "Prefix matching for directory detection"],
    referencesUsed: makeReferences({ label: "agentskills.io spec", source: "agentskills.io/specification", kind: "spec" }, { label: "Validator parity", source: "validate.sh check_structure", kind: "internal" }),
  })

  if (!skillFile) {
    pushCheck(structureSection, "error", "SKILL.md not found", { detail: "SKILL.md is required by the skill specification.", filePath: "SKILL.md", riskStatus: "MISSING", riskReason: "Required root file missing", severity: "danger", ruleId: "structure.skill-file" })
  } else {
    const estimate = estimateTokens(skillFile.content)
    pushCheck(structureSection, "pass", "SKILL.md found", { detail: `${estimate.lines} lines, ${estimate.chars} bytes.`, filePath: "SKILL.md", ruleId: "structure.skill-file" })
  }
  if (!readmeFile) pushCheck(structureSection, "info", "No README.md found", { detail: "Not required by the skill spec. Useful if you publish to GitHub for human-readable documentation.", filePath: "README.md", ruleId: "structure.readme" })
  else pushCheck(structureSection, "pass", "README.md found", { detail: `${estimateTokens(readmeFile.content).lines} lines.`, filePath: "README.md", ruleId: "structure.readme" })

  dirs.forEach((dir) => pushCheck(structureSection, "pass", `${dir.name}/ directory discovered`, { detail: `${dir.fileCount} file${dir.fileCount === 1 ? "" : "s"}.`, ruleId: `structure.${dir.name}` }))
  if (!hasRefsDir) pushCheck(structureSection, "info", "No references/ directory found", { detail: "Progressive disclosure is still allowed, but richer skills typically link reference files.", ruleId: "structure.references" })
  if (hasLicense) pushCheck(structureSection, "pass", "License file found", { ruleId: "structure.license" })
  else pushCheck(structureSection, "info", "No license file found", { detail: "This is optional, but useful for shared or public skills.", ruleId: "structure.license" })

  structureSection.metrics.push({ label: "Root files checked", value: 2 }, { label: "Directories discovered", value: dirs.length }, { label: "Files scanned", value: files.length, tone: files.length > 100 ? "warn" : "neutral", target: files.length > 100 ? "Ideal: <= 100 files" : undefined }, { label: "Upload root", value: normalizedPackage.strippedRootPrefix ? `normalized from ${normalizedPackage.strippedRootPrefix}` : "root" })
  sections.push(finalizeSection(structureSection))

  // 2. Frontmatter Section
  const frontmatterSection = startSection("frontmatter-description", "Frontmatter & Description Quality", {
    scannedTargets: ["SKILL.md frontmatter"],
    testsRun: ["YAML delimiter detection", "Frontmatter parsing", "name field validation", "description field quality heuristics", "Optional metadata discovery"],
    algorithmsUsed: ["YAML parsing for frontmatter fields", "Regex heuristics for trigger verbs, voice, and negative boundaries", "Length threshold checks"],
    referencesUsed: makeReferences({ label: "Description field guidance", source: "agentskills.io/skill-creation/optimizing-descriptions", kind: "official" }, { label: "Anthropic skill authoring guidance", source: "platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices", kind: "official" }, { label: "OpenAI Codex skills", source: "developers.openai.com/codex/skills", kind: "official" }, { label: "Skill spec frontmatter", source: "agentskills.io/specification#description-field", kind: "spec" }, { label: "Validator parity", source: "validate.sh check_frontmatter", kind: "internal" }),
  })

  let description = ""
  if (!skillFile) {
    pushCheck(frontmatterSection, "error", "Frontmatter not evaluated", { detail: "SKILL.md is missing, so frontmatter checks could not run.", filePath: "SKILL.md", riskStatus: "MISSING", riskReason: "Frontmatter unavailable because SKILL.md is missing", severity: "danger", ruleId: "frontmatter.missing-skill" })
  } else if (!parsedSkill.isDelimited) {
    pushCheck(frontmatterSection, "error", "Missing valid YAML frontmatter delimiters", { detail: "Expected opening and closing --- delimiters around frontmatter.", filePath: "SKILL.md", riskStatus: "INVALID", riskReason: "Frontmatter delimiters are missing or incomplete", severity: "danger", ruleId: "frontmatter.delimiters" })
  } else if (!frontmatterObject) {
    pushCheck(frontmatterSection, "error", "Frontmatter could not be parsed as YAML", { detail: "The YAML content is invalid or not an object.", filePath: "SKILL.md", riskStatus: "INVALID", riskReason: "Frontmatter YAML is invalid", severity: "danger", ruleId: "frontmatter.yaml" })
  } else {
    const rawName = typeof frontmatterObject.name === "string" ? frontmatterObject.name.trim() : ""
    description = typeof frontmatterObject.description === "string" ? normalizeWhitespace(frontmatterObject.description) : ""
    hasName = rawName.length > 0; skillName = rawName; hasDesc = description.length > 0; descLen = description.length

    if (!hasName) {
      pushCheck(frontmatterSection, "error", "Required field 'name' missing", { filePath: "SKILL.md", riskStatus: "INVALID", riskReason: "Frontmatter is missing the required name field", severity: "danger", ruleId: "frontmatter.name-required" })
    } else {
      const nameIssues: string[] = []
      if (rawName.length > NAME_MAX_LEN) nameIssues.push(`exceeds ${NAME_MAX_LEN} characters`)
      if (/[A-Z]/.test(rawName)) nameIssues.push("contains uppercase letters")
      if (/[^a-z0-9-]/.test(rawName)) nameIssues.push("contains invalid characters")
      if (/^-|-$/.test(rawName)) nameIssues.push("starts or ends with a hyphen")
      if (rawName.includes("--")) nameIssues.push("contains consecutive hyphens")

      if (nameIssues.length > 0) pushCheck(frontmatterSection, "error", `name '${rawName}' is invalid`, { detail: nameIssues.join(", "), filePath: "SKILL.md", riskStatus: "INVALID", riskReason: "Skill name does not satisfy naming rules", severity: "danger", ruleId: "frontmatter.name-format" })
      else { nameOk = true; pushCheck(frontmatterSection, "pass", `name '${rawName}' is valid`, { detail: `${rawName.length} characters.`, filePath: "SKILL.md", ruleId: "frontmatter.name-format" }) }

      if (/(^|[-])(helper|helpers|utils|utility|tools|documents|document|data|files|file)([-]|$)/i.test(rawName)) {
        pushCheck(frontmatterSection, "warning", `name '${rawName}' is vague`, { detail: "Anthropic's skills docs advise descriptive capability-oriented names, and OpenAI Codex docs recommend skills that stay focused on one clear job.", filePath: "SKILL.md", riskStatus: "VAGUE_NAME", riskReason: "Skill name is generic and may be harder to discover", severity: "warn", ruleId: "frontmatter.name-specificity" })
      }
    }

    if (!hasDesc) {
      pushCheck(frontmatterSection, "error", "Required field 'description' missing or empty", { filePath: "SKILL.md", riskStatus: "INVALID", riskReason: "Frontmatter is missing the required description field", severity: "danger", ruleId: "frontmatter.description-required" })
    } else {
      pushCheck(frontmatterSection, descLen > DESC_MAX_LEN ? "warning" : "pass", "Description length evaluated", { detail: descLen > DESC_MAX_LEN ? `${descLen} characters. The browser validator treats this as long-form and potentially noisy for activation. Consider keeping the description under ${DESC_MAX_LEN} characters.` : `${descLen} characters.`, filePath: "SKILL.md", severity: descLen > DESC_MAX_LEN ? "warn" : "safe", riskStatus: descLen > DESC_MAX_LEN ? "LONG" : undefined, riskReason: descLen > DESC_MAX_LEN ? `Description is longer than the preferred activation-friendly length (max ${DESC_MAX_LEN} characters)` : undefined, ruleId: "frontmatter.description-length" })
      if (descLen < DESC_MIN_USEFUL) pushCheck(frontmatterSection, "warning", "Description is too short for strong triggering", { detail: `${descLen} characters. The preferred minimum is ${DESC_MIN_USEFUL}.`, filePath: "SKILL.md", riskStatus: "SHORT", riskReason: "Description is shorter than the useful minimum", severity: "warn", ruleId: "frontmatter.description-short" })

      descWhat = /(build|create|generate|extract|analyze|process|manage|handle|configure|review|refactor|optimize|test|debug|deploy|format|validate|convert|transform|monitor|implement)/i.test(description)
      descWhen = /(use when|when working|when the user|when handling|if the user|for tasks|for working|designed for|use this|use for)/i.test(description)

      if (descWhat && descWhen) pushCheck(frontmatterSection, "pass", "Description explains what the skill does and when to use it", { filePath: "SKILL.md", ruleId: "frontmatter.description-coverage" })
      else if (!descWhat && !descWhen) pushCheck(frontmatterSection, "warning", "Description does not clearly cover what and when", { detail: "Add action verbs and a trigger clause such as 'Use when...'.", filePath: "SKILL.md", riskStatus: "WEAK_TRIGGER", riskReason: "Description lacks both action and trigger clarity", severity: "warn", ruleId: "frontmatter.description-coverage" })
      else if (!descWhen) pushCheck(frontmatterSection, "info", "Description explains what, but not when to trigger", { detail: "A short 'Use when...' clause improves activation precision.", filePath: "SKILL.md", ruleId: "frontmatter.description-coverage" })

      if (/\b(I can|I will|I help|I am|I provide|my skill)\b/i.test(description)) { descNotFirstPerson = false; pushCheck(frontmatterSection, "info", "Description uses first-person voice", { detail: "Community best practice: third-person descriptions are clearer inside an agent system prompt. Not required by the spec.", filePath: "SKILL.md", ruleId: "frontmatter.description-voice" }) }
      else pushCheck(frontmatterSection, "pass", "Description uses third-person or neutral voice", { filePath: "SKILL.md", ruleId: "frontmatter.description-voice" })

      if (/\b(manage|handle|deal with|work with|help with|assist with|take care of)\b/i.test(description)) { descNotGeneric = false; pushCheck(frontmatterSection, "info", "Description contains generic verbs", { detail: "Community best practice: specific verbs such as 'validate', 'extract', or 'generate' may trigger more precisely. Not required by the spec.", filePath: "SKILL.md", ruleId: "frontmatter.description-verbs" }) }
      else pushCheck(frontmatterSection, "pass", "Description uses specific action verbs", { filePath: "SKILL.md", ruleId: "frontmatter.description-verbs" })

      if (/(not for|not designed for|do not use|does not|don't use)/i.test(description)) { descNegatives = true; pushCheck(frontmatterSection, "pass", "Description includes negative boundaries", { filePath: "SKILL.md", ruleId: "frontmatter.description-boundaries" }) }
      else pushCheck(frontmatterSection, "info", "Description has no explicit negative boundaries", { detail: "Boundary markers reduce accidental activation when many skills are installed.", filePath: "SKILL.md", ruleId: "frontmatter.description-boundaries" })
    }

  }

  frontmatterSection.metrics.push({ label: "Description length", value: descLen || "n/a", tone: descLen > DESC_MAX_LEN ? "warn" : "neutral", target: descLen > DESC_MAX_LEN ? `Target: ≤ ${DESC_MAX_LEN} chars` : undefined }, { label: "Useful minimum", value: DESC_MIN_USEFUL }, { label: "Max recommended", value: DESC_MAX_LEN })
  sections.push(finalizeSection(frontmatterSection))

  // 3. Body Section
  const bodySection = startSection("body-progressive-disclosure", "Body Content & Progressive Disclosure", {
    scannedTargets: ["SKILL.md body", "references/*.md links"],
    testsRun: ["Body line count", "Activation token estimate", "Heading structure", "Code example presence", "Reference link discovery"],
    algorithmsUsed: ["Line counting", "cl100k_base BPE tokenizer (tiktoken)", "Regex detection for headings, code fences, and reference links"],
    referencesUsed: makeReferences({ label: "Progressive disclosure spec", source: "agentskills.io/specification#progressive-disclosure", kind: "spec" }, { label: "Validator parity", source: "validate.sh check_body", kind: "internal" }),
  })

  if (!skillFile) {
    pushCheck(bodySection, "error", "Body content not evaluated", { detail: "SKILL.md is missing.", filePath: "SKILL.md", riskStatus: "MISSING", riskReason: "Body content unavailable because SKILL.md is missing", severity: "danger", ruleId: "body.no-skill" })
  } else if (!parsedSkill.isDelimited) {
    pushCheck(bodySection, "error", "Body content could not be isolated from frontmatter", { detail: "A valid closing frontmatter delimiter is required.", filePath: "SKILL.md", riskStatus: "INVALID", riskReason: "Body parsing failed because the closing frontmatter delimiter is missing", severity: "danger", ruleId: "body.delimiter" })
  } else {
    const bodyEstimate = estimateTokens(parsedSkill.body)
    const markdownReferenceTargets = extractLocalMarkdownLinks(parsedSkill.body)
    bodyLines = bodyEstimate.lines; bodyTokens = bodyEstimate.tokens
    headings = (parsedSkill.body.match(/^#/gm) || []).length
    const fences = (parsedSkill.body.match(/```/g) || []).length
    codeBlocks = Math.floor(fences / 2)
    refLinks = markdownReferenceTargets.length
    internalLinks = (parsedSkill.body.match(/\]\((?!https?:\/\/)[^)]+\)/g) || []).length
    externalLinks = (parsedSkill.body.match(/\]\(https?:\/\/[^)]+\)/g) || []).length

    if (bodyLines === 0) pushCheck(bodySection, "error", "SKILL.md body is empty", { detail: "Agents need instructions in the body content.", filePath: "SKILL.md", riskStatus: "EMPTY", riskReason: "Body content is empty", severity: "danger", ruleId: "body.lines" })
    else if (bodyLines > BODY_MAX_LINES) pushCheck(bodySection, "warning", "Body length exceeds the recommended maximum", { detail: `${bodyLines} lines. Spec recommends keeping SKILL.md under ${BODY_MAX_LINES} lines — move detailed content to references/.`, filePath: "SKILL.md", riskStatus: "LONG", riskReason: "Body content is longer than the spec-recommended maximum", severity: "warn", ruleId: "body.lines" })
    else pushCheck(bodySection, "pass", "Body line count is within the recommended range", { detail: `${bodyLines} lines (spec recommends < ${BODY_MAX_LINES}).`, filePath: "SKILL.md", ruleId: "body.lines" })

    if (bodyTokens > TOKEN_BUDGET) pushCheck(bodySection, "warning", "Activation token estimate exceeds the recommended budget", { detail: `~${bodyTokens} tokens by cl100k_base BPE tokenizer. Spec recommends < ${TOKEN_BUDGET} tokens on activation.`, filePath: "SKILL.md", riskStatus: "TOKEN_WARN", riskReason: "Activation cost exceeds the spec-recommended token budget", severity: "warn", ruleId: "body.tokens" })
    else pushCheck(bodySection, "pass", "Activation token estimate is within the recommended budget", { detail: `~${bodyTokens} tokens (spec recommends < ${TOKEN_BUDGET}).`, filePath: "SKILL.md", ruleId: "body.tokens" })

    if (headings === 0) pushCheck(bodySection, "warning", "Body has no headings", { detail: "Heading structure improves readability and scanability.", filePath: "SKILL.md", riskStatus: "UNSTRUCTURED", riskReason: "Body content lacks headings", severity: "warn", ruleId: "body.headings" })
    else pushCheck(bodySection, "pass", "Heading structure present", { detail: `${headings} heading${headings === 1 ? "" : "s"}.`, filePath: "SKILL.md", ruleId: "body.headings" })

    if (codeBlocks > 0) pushCheck(bodySection, "pass", "Body includes fenced code examples", { detail: `${codeBlocks} fenced example${codeBlocks === 1 ? "" : "s"}.`, filePath: "SKILL.md", ruleId: "body.code-blocks" })
    else if ((parsedSkill.body.match(/`[^`]+`/g) || []).length > 0) pushCheck(bodySection, "info", "Body includes inline code references only", { detail: "Inline code helps, but fenced examples are usually clearer.", filePath: "SKILL.md", ruleId: "body.code-blocks" })
    else pushCheck(bodySection, "info", "No code examples found in the body", { filePath: "SKILL.md", ruleId: "body.code-blocks" })

    if (refLinks > 0) pushCheck(bodySection, "pass", "Body links to reference files", { detail: `${refLinks} reference link${refLinks === 1 ? "" : "s"}.`, filePath: "SKILL.md", ruleId: "body.references" })
    else if (hasRefsDir) pushCheck(bodySection, "warning", "references/ exists but SKILL.md does not link to it", { detail: "Agents will not discover unlinked references on demand.", filePath: "SKILL.md", riskStatus: "ORPHAN_REFERENCES", riskReason: "references/ exists but body contains no links to it", severity: "warn", ruleId: "body.references" })
    else pushCheck(bodySection, "info", "No reference links found", { detail: "This is acceptable for smaller skills, but leaves less room for progressive disclosure.", filePath: "SKILL.md", ruleId: "body.references" })
  }

  bodySection.metrics.push({ label: "Body lines", value: bodyLines || "n/a", tone: bodyLines > BODY_MAX_LINES ? "warn" : "neutral", target: bodyLines > BODY_MAX_LINES ? `Target: ≤ ${BODY_MAX_LINES} lines` : undefined }, { label: "Body tokens", value: bodyTokens ? `~${bodyTokens}` : "n/a", tone: bodyTokens > TOKEN_BUDGET ? "warn" : "neutral", target: bodyTokens > TOKEN_BUDGET ? `Target: ≤ ${TOKEN_BUDGET} tokens` : undefined }, { label: "Headings", value: headings }, { label: "Code blocks", value: codeBlocks }, { label: "Reference links", value: refLinks })
  sections.push(finalizeSection(bodySection))

  // 4. Links Section
  const linksSection = startSection("internal-links", "Internal Links", { scannedTargets: ["SKILL.md markdown links"], testsRun: ["Relative link extraction", "Local path existence resolution"], algorithmsUsed: ["Markdown link regex extraction", "Local path resolution after fragment stripping"], referencesUsed: makeReferences({ label: "Validator parity", source: "validate.sh check_links", kind: "internal" }) })
  if (!skillFile || !parsedSkill.isDelimited) {
    pushCheck(linksSection, "info", "Internal link scan skipped", { detail: "Valid SKILL.md body content is required before link extraction can run.", filePath: "SKILL.md", ruleId: "links.skipped" })
  } else {
    const linkRegex = /\]\(([^)]+)\)/g
    let checkedLinks = 0, brokenLinks = 0, match: RegExpExecArray | null
    while ((match = linkRegex.exec(parsedSkill.body)) !== null) {
      const target = match[1].trim()
      if (!target || target.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue
      checkedLinks += 1
      const fileTarget = normalizeSkillPath(safeDecodeUriComponent(target.split("#")[0]))
      if (!getFile(fileTarget)) { brokenLinks += 1; pushCheck(linksSection, "error", `Broken link: ${target}`, { detail: "The referenced file does not exist in the uploaded package.", filePath: "SKILL.md", riskStatus: "BROKEN_LINK", riskReason: `Broken internal link to ${fileTarget}`, severity: "danger", ruleId: "links.missing-target" }) }
      else pushCheck(linksSection, "pass", `Resolved internal link: ${target}`, { ruleId: "links.missing-target" })
    }
    if (checkedLinks === 0) pushCheck(linksSection, "info", "No internal file links found in SKILL.md", { ruleId: "links.none" })
    else pushCheck(linksSection, brokenLinks > 0 ? "warning" : "pass", "Internal link scan complete", { detail: `${checkedLinks} link${checkedLinks === 1 ? "" : "s"} checked, ${brokenLinks} broken.`, filePath: "SKILL.md", severity: brokenLinks > 0 ? "warn" : "safe", riskStatus: brokenLinks > 0 ? "LINK_SCAN_WARN" : undefined, riskReason: brokenLinks > 0 ? "One or more internal links are broken" : undefined, ruleId: "links.scan-summary" })
  }
  linksSection.metrics.push({ label: "Internal links in body", value: internalLinks }, { label: "External links in body", value: externalLinks })
  sections.push(finalizeSection(linksSection))

  // 5. References Section
  const referencesSection = startSection("reference-files", "Reference Files", { scannedTargets: ["references/*.md", "linked *.md files from SKILL.md"], testsRun: ["Reference file discovery", "Reference link matching", "Empty file detection", "Missing linked file detection", "Long reference table-of-contents detection"], algorithmsUsed: ["Prefix-based file collection", "String inclusion matching for linked references", "cl100k_base BPE tokenizer (tiktoken)"], referencesUsed: makeReferences({ label: "Reference file guidance", source: "agentskills.io/specification#references", kind: "spec" }, { label: "Anthropic reference-file guidance", source: "platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices", kind: "official" }, { label: "Validator parity", source: "validate.sh check_references", kind: "internal" }) })
  const refFiles = files.filter((file) => file.path.startsWith("references/") && file.path.endsWith(".md"))
  const linkedRefTargets = parsedSkill.isDelimited ? extractLocalMarkdownLinks(parsedSkill.body) : []
  const linkedReferenceFiles = linkedRefTargets.map((target) => getFile(target)).filter((file): file is SkillFile => file !== undefined && file.path.endsWith(".md"))
  const referenceCandidates = Array.from(new Map([...refFiles, ...linkedReferenceFiles].map((file) => [file.path.toLowerCase(), file])).values())
  refsTotal = referenceCandidates.length

  referenceCandidates.forEach((file) => {
    const estimate = estimateTokens(file.content); const isLinked = linkedRefTargets.includes(file.path)
    if (estimate.lines <= 1 && estimate.chars < 5) { refStatuses.push({ path: file.path, tokens: estimate.tokens, lines: estimate.lines, status: "EMPTY" }); pushCheck(referencesSection, "warning", `${file.path} is empty`, { filePath: file.path, riskStatus: "EMPTY", riskReason: "Reference file has no useful content", severity: "warn", ruleId: "references.empty" }) }
    else if (isLinked) { refsLinked += 1; refStatuses.push({ path: file.path, tokens: estimate.tokens, lines: estimate.lines, status: "LINKED" }); pushCheck(referencesSection, "pass", `${file.path} is linked from SKILL.md`, { detail: `${estimate.lines} lines.`, filePath: file.path, ruleId: "references.linked" }) }
    else { refStatuses.push({ path: file.path, tokens: estimate.tokens, lines: estimate.lines, status: "ORPHANED" }); pushCheck(referencesSection, "warning", `${file.path} is orphaned`, { detail: "The file exists, but SKILL.md does not link to it.", filePath: file.path, riskStatus: "ORPHANED", riskReason: "Reference file is not linked from SKILL.md", severity: "warn", ruleId: "references.orphaned" }) }

    if (estimate.lines > 100) {
      const hasContents = /^(##|#)\s+(contents|table of contents)\b/im.test(file.content)
      pushCheck(referencesSection, hasContents ? "pass" : "warning", hasContents ? `${file.path} includes a contents section` : `${file.path} is long but has no table of contents`, { detail: hasContents ? `${estimate.lines} lines. A contents section helps with partial reads.` : `${estimate.lines} lines. Anthropic's skills docs recommend a contents section for reference files longer than 100 lines.`, filePath: file.path, riskStatus: hasContents ? undefined : "MISSING_TOC", riskReason: hasContents ? undefined : "Long reference file is missing a contents section", severity: hasContents ? "safe" : "warn", ruleId: "references.contents" })
    }
  })

  linkedRefTargets.forEach((target) => {
    if (!getFile(target)) { refStatuses.push({ path: target, tokens: 0, lines: 0, status: "MISSING" }); pushCheck(referencesSection, "error", `${target} is linked but missing`, { filePath: target, riskStatus: "MISSING", riskReason: "SKILL.md links to a missing reference file", severity: "danger", ruleId: "references.missing" }) }
  })
  if (refsTotal === 0) pushCheck(referencesSection, "info", "No reference markdown files found", { ruleId: "references.none" })
  referencesSection.metrics.push({ label: "Reference files", value: refsTotal }, { label: "Linked", value: refStatuses.filter((item) => item.status === "LINKED").length }, { label: "Orphaned", value: refStatuses.filter((item) => item.status === "ORPHANED").length, tone: "warn", target: "Ideal: 0" }, { label: "Empty or missing", value: refStatuses.filter((item) => item.status === "EMPTY" || item.status === "MISSING").length, tone: "warn", target: "Ideal: 0" })
  sections.push(finalizeSection(referencesSection))

  // 6. Markdown Section
  const markdownSection = startSection("markdown-syntax", "Markdown Syntax", { scannedTargets: ["all *.md files"], testsRun: ["Balanced fenced code block detection"], algorithmsUsed: ["Fence counting with odd-count detection"], referencesUsed: makeReferences({ label: "Validator parity", source: "validate.sh check_markdown", kind: "internal" }) })
  const markdownFiles = files.filter((file) => file.path.endsWith(".md"))
  let markdownIssues = 0
  markdownFiles.forEach((file) => {
    const fenceCount = (file.content.match(/```/g) || []).length
    if (fenceCount % 2 !== 0) { fencesOk = false; markdownIssues += 1; pushCheck(markdownSection, "warning", `${file.path} has an unclosed code fence`, { detail: `${fenceCount} total fences detected.`, filePath: file.path, riskStatus: "UNBALANCED_FENCES", riskReason: "Markdown fence count is unbalanced", severity: "warn", ruleId: "markdown.fences" }) }
    else pushCheck(markdownSection, "pass", `${file.path} has balanced fenced code blocks`, { filePath: file.path, ruleId: "markdown.fences" })
  })
  if (markdownFiles.length === 0) pushCheck(markdownSection, "info", "No markdown files found for fence validation", { ruleId: "markdown.none" })
  markdownSection.metrics.push({ label: "Markdown files", value: markdownFiles.length }, { label: "Fence issues", value: markdownIssues, tone: markdownIssues > 0 ? "warn" : "neutral", target: markdownIssues > 0 ? "Ideal: 0" : undefined })
  sections.push(finalizeSection(markdownSection))

  // 7. Nesting Section
  const nestingSection = startSection("reference-nesting", "Reference Nesting", { scannedTargets: ["references/*.md"], testsRun: ["Cross-reference discovery inside reference files"], algorithmsUsed: ["Regex detection for links targeting references/ from other reference files"], referencesUsed: makeReferences({ label: "Reference depth guidance", source: "agentskills.io/specification#progressive-disclosure", kind: "spec" }, { label: "Validator parity", source: "validate.sh check_reference_depth", kind: "internal" }) })
  let nestedRefs = 0
  refFiles.forEach((file) => {
    const nestedLinks = (file.content.match(/\]\(references\//g) || []).length
    if (nestedLinks > 0) { nestedRefs += 1; pushCheck(nestingSection, "warning", `${file.path} cross-links other references`, { detail: `${nestedLinks} nested reference link${nestedLinks === 1 ? "" : "s"} found.`, filePath: file.path, riskStatus: "NESTED_REFERENCE", riskReason: "Reference file links to another reference file", severity: "warn", ruleId: "references.nesting" }) }
  })
  if (refFiles.length === 0) pushCheck(nestingSection, "info", "No reference files found for nesting checks", { ruleId: "references.nesting-none" })
  else if (nestedRefs === 0) pushCheck(nestingSection, "pass", "No nested reference chains found", { ruleId: "references.nesting" })
  nestingSection.metrics.push({ label: "Reference files scanned", value: refFiles.length }, { label: "Nested chains", value: nestedRefs, tone: nestedRefs > 0 ? "warn" : "neutral", target: nestedRefs > 0 ? "Ideal: 0" : undefined })
  sections.push(finalizeSection(nestingSection))

  // 8. Scripts Section
  const scriptsSection = startSection("scripts", "Scripts", { scannedTargets: ["scripts/*", "SKILL.md mentions"], testsRun: ["Script discovery", "Documentation mention scan", "Executable bit availability check"], algorithmsUsed: ["Prefix-based file collection for scripts/", "Basename mention matching in SKILL.md", "Context limitation detection for browser uploads"], referencesUsed: makeReferences({ label: "Validator parity", source: "validate.sh check_scripts", kind: "internal" }) })
  const scriptFiles = files.filter((file) => file.path.startsWith("scripts/") && !file.path.endsWith("/"))
  if (scriptFiles.length === 0) pushCheck(scriptsSection, "info", "No script files found", { ruleId: "scripts.none" })
  else {
    scriptFiles.forEach((file) => {
      const basename = file.path.split("/").pop() ?? file.path
      const mentioned = Boolean(skillFile?.content.includes(basename))
      pushCheck(scriptsSection, mentioned ? "pass" : "warning", `${file.path} documentation scan`, { detail: mentioned ? "The script filename appears in SKILL.md." : "The script filename does not appear in SKILL.md.", filePath: file.path, riskStatus: mentioned ? undefined : "UNDOCUMENTED", riskReason: mentioned ? undefined : "Script file is not mentioned in SKILL.md", severity: mentioned ? "safe" : "warn", ruleId: "scripts.documentation" })
    })
    pushCheck(scriptsSection, "info", "Executable permissions are not available in browser uploads", { detail: "This UI validates script presence and documentation, but cannot inspect filesystem mode bits from dropped archives or folders.", ruleId: "scripts.permissions" })
  }
  scriptsSection.metrics.push({ label: "Scripts scanned", value: scriptFiles.length }, { label: "Browser permission support", value: scriptFiles.length > 0 ? "Unavailable" : "n/a" })
  sections.push(finalizeSection(scriptsSection))

  // 9. Hygiene Section
  const hygieneSection = startSection("repository-hygiene", "Repository Hygiene", { scannedTargets: ["all file paths"], testsRun: ["Sensitive filename detection", "Build artifact directory detection", "Workspace noise detection"], algorithmsUsed: ["Path pattern matching", "Directory prefix heuristics"], referencesUsed: makeReferences({ label: "Validator parity", source: "validate.sh repository hygiene checks", kind: "internal" }, { label: "Repository hygiene heuristics", source: "Local packaging heuristic for distributed skill bundles", kind: "heuristic" }) })
  const sensitivePathPatterns = [{ pattern: /^\.env(\.|$)/i, status: "SENSITIVE_FILE", reason: "Environment file present" }, { pattern: /(^|\/)(id_rsa|id_dsa|\.npmrc|\.pypirc)$/i, status: "SENSITIVE_FILE", reason: "Sensitive credentials file present" }, { pattern: /\.(pem|key)$/i, status: "SENSITIVE_FILE", reason: "Key or certificate file present" }]
  const noisyPathSegments = ["dist", "coverage", ".next", ".turbo", "build", "node_modules", "__pycache__"]
  let hygieneFindings = 0

  files.forEach((file) => {
    sensitivePathPatterns.forEach(({ pattern, status, reason }) => { if (pattern.test(file.path)) { hygieneFindings += 1; pushCheck(hygieneSection, "warning", `${file.path} is a sensitive repository artifact`, { filePath: file.path, riskStatus: status, riskReason: reason, severity: "warn", ruleId: "hygiene.sensitive" }) } })
    if (file.path.split("/").some((segment) => noisyPathSegments.includes(segment))) { hygieneFindings += 1; pushCheck(hygieneSection, "info", `${file.path} looks like a build artifact`, { detail: "Generated output is usually unnecessary in a distributed skill package.", filePath: file.path, ruleId: "hygiene.build-artifact" }) }
    if (file.path.endsWith(".DS_Store")) { hygieneFindings += 1; pushCheck(hygieneSection, "info", `${file.path} is workspace noise`, { filePath: file.path, ruleId: "hygiene.noise" }) }
  })
  if (hygieneFindings === 0) pushCheck(hygieneSection, "pass", "No obvious repository hygiene issues found", { ruleId: "hygiene.summary" })
  hygieneSection.metrics.push({ label: "Files scanned", value: files.length }, { label: "Hygiene findings", value: hygieneFindings, tone: hygieneFindings > 0 ? "warn" : "neutral", target: hygieneFindings > 0 ? "Ideal: 0" : undefined })
  sections.push(finalizeSection(hygieneSection))

  // 10. Token Budget Section
  const tokenSection = startSection("token-budget", "Token Budget", { scannedTargets: ["SKILL.md", "references/*.md", "entire uploaded package"], testsRun: ["SKILL.md activation token estimate", "Reference subtotal estimate", "Package total estimate", "Largest reference detection"], algorithmsUsed: ["cl100k_base BPE tokenizer (tiktoken)", "Zone classification with safe/warn/danger thresholds"], referencesUsed: makeReferences({ label: "Validator parity", source: "validate.sh token budget analysis", kind: "internal" }, { label: "Context budget guidance", source: "agentskills.io/specification#progressive-disclosure", kind: "spec" }) })
  const skillMdTokens = skillFile ? estimateTokens(skillFile.content).tokens : 0
  const refSubtotalTokens = refStatuses.reduce((sum, item) => sum + item.tokens, 0)
  const totalPackageTokens = allContentEstimate.tokens
  const skillMdZone = tokenZone(skillMdTokens, TOKEN_SAFE_ZONE, TOKEN_WARN_ZONE)
  const totalPackageZone = tokenZone(totalPackageTokens, TOTAL_TOKEN_SAFE, TOTAL_TOKEN_WARN)
  let largestRef: { name: string; tokens: number } | undefined
  refStatuses.forEach((item) => { if (!largestRef || item.tokens > largestRef.tokens) largestRef = { name: item.path, tokens: item.tokens } })

  pushCheck(tokenSection, skillMdZone === "danger" ? "warning" : "pass", "SKILL.md activation token estimate computed", { detail: `~${skillMdTokens} tokens (cl100k_base BPE). Safe zone: ≤ ${TOKEN_SAFE_ZONE} tokens · Warn zone: ≤ ${TOKEN_WARN_ZONE} tokens · Danger: > ${TOKEN_WARN_ZONE} tokens.`, filePath: skillFile?.path, severity: skillMdZone, riskStatus: skillMdZone !== "safe" ? "TOKEN_ZONE" : undefined, riskReason: skillMdZone !== "safe" ? `SKILL.md activation cost is above the safe zone — safe ≤ ${TOKEN_SAFE_ZONE} tokens, warn ≤ ${TOKEN_WARN_ZONE}, danger > ${TOKEN_WARN_ZONE}. Current: ~${skillMdTokens} tokens.` : undefined, ruleId: "tokens.skill" })
  pushCheck(tokenSection, totalPackageZone === "danger" ? "warning" : "pass", "Full package token estimate computed", { detail: `~${totalPackageTokens} tokens (cl100k_base BPE). Safe zone: ≤ ${TOTAL_TOKEN_SAFE.toLocaleString()} tokens · Warn zone: ≤ ${TOTAL_TOKEN_WARN.toLocaleString()} tokens · Danger: > ${TOTAL_TOKEN_WARN.toLocaleString()} tokens.`, severity: totalPackageZone, riskStatus: totalPackageZone !== "safe" ? "PACKAGE_TOKEN_ZONE" : undefined, riskReason: totalPackageZone !== "safe" ? `Entire package size is above the safe zone — safe ≤ ${TOTAL_TOKEN_SAFE.toLocaleString()} tokens, warn ≤ ${TOTAL_TOKEN_WARN.toLocaleString()}, danger > ${TOTAL_TOKEN_WARN.toLocaleString()}. Current: ~${totalPackageTokens} tokens.` : undefined, ruleId: "tokens.package" })
  if (largestRef) pushCheck(tokenSection, "info", `Largest reference detected: ${largestRef.name}`, { detail: `~${largestRef.tokens} tokens.`, filePath: largestRef.name, ruleId: "tokens.largest-ref" })
  else pushCheck(tokenSection, "info", "No reference files available for subtotal analysis", { ruleId: "tokens.largest-ref" })
  tokenSection.metrics.push({ label: "SKILL.md", value: `~${skillMdTokens}`, tone: skillMdZone, target: skillMdZone !== "safe" ? `Safe: ≤ ${TOKEN_SAFE_ZONE} · Warn: ≤ ${TOKEN_WARN_ZONE}` : undefined }, { label: "References", value: `~${refSubtotalTokens}`, tone: refSubtotalTokens > TOTAL_TOKEN_SAFE ? "warn" : "neutral", target: refSubtotalTokens > TOTAL_TOKEN_SAFE ? `Target: ≤ ${TOTAL_TOKEN_SAFE.toLocaleString()} tokens` : undefined }, { label: "Total package", value: `~${totalPackageTokens}`, tone: totalPackageZone, target: totalPackageZone !== "safe" ? `Safe: ≤ ${TOTAL_TOKEN_SAFE.toLocaleString()} · Warn: ≤ ${TOTAL_TOKEN_WARN.toLocaleString()}` : undefined }, { label: "Largest reference", value: largestRef ? `${largestRef.name} (~${largestRef.tokens})` : "n/a" })
  sections.push(finalizeSection(tokenSection))

  // 11. Content Quality Section
  const contentSection = startSection("content-quality", "Content Quality", { scannedTargets: ["SKILL.md body", "references/*.md"], testsRun: ["Heading density", "Code example count", "Link richness", "Progressive disclosure presence"], algorithmsUsed: ["Regex counting for headings and code examples", "Internal/external link counts", "Threshold-based heuristic scoring"], referencesUsed: makeReferences({ label: "OpenAI Codex skills", source: "developers.openai.com/codex/skills", kind: "official" }, { label: "Agent Skills best practices", source: "agentskills.io/skill-creation/best-practices", kind: "official" }, { label: "Anthropic skill authoring guidance", source: "platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices", kind: "official" }, { label: "Validator parity", source: "validate.sh content quality checks", kind: "internal" }) })
  if (!skillFile) { pushCheck(contentSection, "error", "Content quality not evaluated", { detail: "SKILL.md is missing.", filePath: "SKILL.md", riskStatus: "MISSING", riskReason: "Content quality cannot be evaluated without SKILL.md", severity: "danger", ruleId: "content.missing-skill" }) }
  else {
    pushCheck(contentSection, headings >= 3 ? "pass" : headings === 0 ? "warning" : "info", "Heading density evaluated", { detail: `${headings} heading${headings === 1 ? "" : "s"} in the body.`, filePath: "SKILL.md", severity: headings === 0 ? "warn" : "safe", riskStatus: headings === 0 ? "LOW_STRUCTURE" : undefined, riskReason: headings === 0 ? "Body content has no heading structure" : undefined, ruleId: "content.headings" })
    pushCheck(contentSection, codeBlocks >= 1 ? "pass" : "info", "Code example count evaluated", { detail: `${codeBlocks} fenced code block${codeBlocks === 1 ? "" : "s"}.`, filePath: "SKILL.md", ruleId: "content.code-blocks" })
    pushCheck(contentSection, refLinks > 0 ? "pass" : "info", "Reference link richness evaluated", { detail: `${refLinks} reference link${refLinks === 1 ? "" : "s"} in the body.`, filePath: "SKILL.md", ruleId: "content.references" })
    const longLines = parsedSkill.body.split("\n").filter((line) => line.length > 140).filter((line) => !/^\s*(#|```|[-*]\s|\d+\.\s)/.test(line))
    if (longLines.length > 0) pushCheck(contentSection, "info", "Long prose lines detected", { detail: `${longLines.length} line${longLines.length === 1 ? "" : "s"} exceed 140 characters. Review for concision and move detail to references where appropriate.`, filePath: "SKILL.md", ruleId: "content.concision" })

    const looksComplex = scriptFiles.length >= 2 || refStatuses.length >= 3 || /(workflow|checklist|validate|migration|review process|step 1|step one|run:)/i.test(parsedSkill.body)
    if (looksComplex) {
      const hasWorkflowPattern = /(^|\n)\s*\d+\.\s|step\s+1|-\s*\[\s*\]/i.test(parsedSkill.body)
      pushCheck(contentSection, hasWorkflowPattern ? "pass" : "info", hasWorkflowPattern ? "Complex skill includes workflow/checklist structure" : "Complex skill has no explicit workflow/checklist structure", { detail: hasWorkflowPattern ? "Ordered steps or checklist markers were found in SKILL.md." : "Agent Skills and Anthropic docs recommend explicit sequential workflows or checklists for multi-stage tasks.", filePath: "SKILL.md", ruleId: "content.workflow" })
    }

    const hasValidationMention = /(validate|validator|validation)/i.test(parsedSkill.body) || files.some((file) => /^scripts\/.*(validate|verify)/i.test(file.path))
    if (hasValidationMention) {
      const hasValidationLoop = /(only proceed when|if validation fails|run validation again|validate.*fix|fix.*validate|repeat|re-run|rerun)/i.test(parsedSkill.body)
      pushCheck(contentSection, hasValidationLoop ? "pass" : "info", hasValidationLoop ? "Validation feedback loop is documented" : "Validation is mentioned without an explicit fix-and-repeat loop", { detail: hasValidationLoop ? "SKILL.md describes a validator loop with retry or gating language." : "Agent Skills and Anthropic docs recommend validator loops: validate, fix issues, re-run, and only proceed when validation passes.", filePath: "SKILL.md", ruleId: "content.validation-loop" })
    }

    const timeSensitivePattern = /\bas of today\b|\bcurrently\b|\bbefore [A-Z][a-z]+ \d{4}\b|\bafter [A-Z][a-z]+ \d{4}\b|\bbefore \d{4}\b|\bafter \d{4}\b|\bnext month\b|\bnext year\b|\bstarting [A-Z][a-z]+ \d{4}\b/i
    pushCheck(contentSection, timeSensitivePattern.test(parsedSkill.body) ? "warning" : "pass", timeSensitivePattern.test(parsedSkill.body) ? "Time-sensitive wording detected" : "No obvious time-sensitive wording detected", { detail: timeSensitivePattern.test(parsedSkill.body) ? "Anthropic's skills docs recommend avoiding time-sensitive guidance in skill instructions and isolating legacy patterns clearly." : "The visible guidance looks stable over time.", filePath: "SKILL.md", severity: timeSensitivePattern.test(parsedSkill.body) ? "warn" : "safe", riskStatus: timeSensitivePattern.test(parsedSkill.body) ? "TIME_SENSITIVE" : undefined, riskReason: timeSensitivePattern.test(parsedSkill.body) ? "SKILL.md contains time-sensitive wording that may age poorly" : undefined, ruleId: "content.time-sensitive" })

    const hasEvalArtifacts = hasDir("evals") || hasDir("tests") || hasDir("fixtures") || /should-trigger|should not trigger|should-not-trigger/i.test(parsedSkill.body)
    if (!hasEvalArtifacts) pushCheck(contentSection, "info", "No obvious evaluation artifacts or trigger examples found", { detail: "OpenAI Codex docs recommend testing prompts against the description, and Agent Skills guidance recommends refining with real execution and explicit trigger/non-trigger cases.", filePath: "SKILL.md", ruleId: "content.evals" })
  }
  contentSection.metrics.push({ label: "Headings", value: headings }, { label: "Code blocks", value: codeBlocks }, { label: "Internal links", value: internalLinks }, { label: "External links", value: externalLinks }, { label: "Reference links", value: refLinks })
  sections.push(finalizeSection(contentSection))

  // 12. Agent Metadata Section
  const agentSection = startSection("agent-metadata", "Agent Metadata", { scannedTargets: ["agents/openai.yaml"], testsRun: ["agents/openai.yaml discovery", "YAML parse", "interface/policy/dependencies field checks"], algorithmsUsed: ["Case-sensitive file lookup", "YAML parsing", "Presence checks for Codex-style interface and policy metadata"], referencesUsed: makeReferences({ label: "Validator parity", source: "validate.sh check_agent_metadata", kind: "internal" }) })
  const agentFile = getFile("agents/openai.yaml")
  if (!agentFile) pushCheck(agentSection, "info", "agents/openai.yaml not found", { detail: "This section is only relevant for skills that ship OpenAI agent metadata.", ruleId: "agent.none" })
  else {
    const agentConfig = parseObjectYaml(agentFile.content)
    if (!agentConfig) pushCheck(agentSection, "warning", "agents/openai.yaml could not be parsed as YAML", { filePath: "agents/openai.yaml", riskStatus: "INVALID_YAML", riskReason: "Agent metadata file is invalid YAML", severity: "warn", ruleId: "agent.yaml" })
    else {
      const interfaceConfig = asRecord(agentConfig.interface)
      const policyConfig = asRecord(agentConfig.policy)
      const interfaceFields = ["display_name", "short_description", "default_prompt", "brand_color"]
      interfaceFields.forEach((field) => { const value = interfaceConfig?.[field] ?? agentConfig[field]; pushCheck(agentSection, value !== undefined ? "pass" : "info", `${field} field ${value !== undefined ? "present" : "not present"}`, { filePath: "agents/openai.yaml", ruleId: `agent.interface.${field}` }) })
      ;["icon_small", "icon_large"].forEach((field) => {
        const value = interfaceConfig?.[field] ?? agentConfig[field]
        if (typeof value === "string" && value.trim()) {
          const iconPath = normalizeSkillPath(value.trim()); const iconExists = Boolean(getFile(iconPath))
          pushCheck(agentSection, iconExists ? "pass" : "warning", `${field}: ${iconPath}`, { detail: iconExists ? "Referenced icon file exists." : "Referenced icon file was not found in the uploaded package.", filePath: "agents/openai.yaml", riskStatus: iconExists ? undefined : "MISSING_ICON", riskReason: iconExists ? undefined : `${field} references a missing icon file`, severity: iconExists ? "safe" : "warn", ruleId: `agent.interface.${field}` })
        } else pushCheck(agentSection, "info", `${field} field not present`, { filePath: "agents/openai.yaml", ruleId: `agent.interface.${field}` })
      })
      if (policyConfig?.allow_implicit_invocation !== undefined) pushCheck(agentSection, "pass", `allow_implicit_invocation: ${String(policyConfig.allow_implicit_invocation)}`, { filePath: "agents/openai.yaml", ruleId: "agent.policy.allow-implicit-invocation" })
      else pushCheck(agentSection, "info", "allow_implicit_invocation not present", { filePath: "agents/openai.yaml", ruleId: "agent.policy.allow-implicit-invocation" })
      const dependencies = toStringArray(agentConfig.dependencies)
      if (agentConfig.dependencies !== undefined) pushCheck(agentSection, "pass", "dependencies declared", { filePath: "agents/openai.yaml", ruleId: "agent.dependencies" })
      agentSection.metrics.push({ label: "Dependencies declared", value: dependencies.length }, { label: "Interface fields inspected", value: interfaceFields.length + 2 }, { label: "Policy fields inspected", value: 1 })
    }
  }
  sections.push(finalizeSection(agentSection))

  // 13. Security Section
  const securitySection = startSection("security-scan", "Security Scan", { scannedTargets: ["all uploaded files"], testsRun: ["Secret regex scan", "Private key header detection", "JWT token pattern detection", "Absolute path detection", "Dangerous command detection"], algorithmsUsed: ["Regex pattern matching for secrets and commands", "Absolute path substring heuristics"], referencesUsed: makeReferences({ label: "Relative path guidance", source: "agentskills.io/specification#file-references", kind: "spec" }, { label: "Safety scan heuristics", source: "Static pattern matching for secrets and dangerous commands", kind: "heuristic" }, { label: "Validator parity", source: "validate.sh check_security", kind: "internal" }) })
  const secretPatterns = [ /sk-[a-zA-Z0-9]{20,}/, /sk_live_[a-zA-Z0-9]+/, /sk_test_[a-zA-Z0-9]+/, /ghp_[a-zA-Z0-9]{36}/, /gho_[a-zA-Z0-9]{36}/, /ghu_[a-zA-Z0-9]{36}/, /ghs_[a-zA-Z0-9]{36}/, /ghr_[a-zA-Z0-9]{36}/, /xoxb-[a-zA-Z0-9-]+/, /xoxp-[a-zA-Z0-9-]+/, /AKIA[0-9A-Z]{16}/ ]
  const dangerousPatterns = [/rm -rf \//, /sudo rm /, /DROP TABLE/i, /DROP DATABASE/i, /chmod 777/, /curl .*\| *sh/, /wget .*\| *sh/]
  const jwtPattern = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+/

  files.forEach((file) => {
    secretPatterns.forEach((pattern) => {
      if (pattern.test(file.content)) {
        secretsCount += 1
        pushCheck(securitySection, "error", `${file.path} matches a secret pattern`, { detail: `Pattern: ${pattern.toString()}.`, filePath: file.path, line: firstMatchingLine(file.content, pattern), riskStatus: "SECRET", riskReason: "Potential credential or API secret detected", severity: "danger", ruleId: "security.secret" })
      }
    })
    const privateKeyPattern = /BEGIN.*PRIVATE KEY/
    if (privateKeyPattern.test(file.content)) { secretsCount += 1; pushCheck(securitySection, "error", `${file.path} contains a private key header`, { filePath: file.path, line: firstMatchingLine(file.content, privateKeyPattern), riskStatus: "PRIVATE_KEY", riskReason: "Private key header detected", severity: "danger", ruleId: "security.private-key" }) }
    if (jwtPattern.test(file.content)) { secretsCount += 1; pushCheck(securitySection, "error", `${file.path} contains a JWT-like token`, { filePath: file.path, line: firstMatchingLine(file.content, jwtPattern), riskStatus: "TOKEN", riskReason: "JWT-like token detected", severity: "danger", ruleId: "security.jwt" }) }
    if (file.path.endsWith(".md") && /(\/Users\/[a-zA-Z]|\/home\/[a-zA-Z]|C:\\Users\\)/.test(file.content)) { hardcodedCount += 1; pushCheck(securitySection, "warning", `${file.path} contains an absolute user path`, { detail: "Spec requires relative paths from the skill root so the skill is portable across machines.", filePath: file.path, riskStatus: "ABSOLUTE_PATH", riskReason: "Hardcoded absolute path detected in skill instructions", severity: "warn", ruleId: "security.path" }) }
    dangerousPatterns.forEach((pattern) => {
      if (pattern.test(file.content)) { dangerousCount += 1; pushCheck(securitySection, "warning", `${file.path} contains a dangerous command pattern`, { detail: `Pattern: ${pattern.toString()}. Community best practice: skill instructions containing destructive commands should be guarded or removed.`, filePath: file.path, line: firstMatchingLine(file.content, pattern), riskStatus: "DANGEROUS_COMMAND", riskReason: "Dangerous command pattern detected", severity: "warn", ruleId: "security.command" }) }
    })
  })
  if (secretsCount === 0) pushCheck(securitySection, "pass", "No API keys or secrets detected", { ruleId: "security.secret-summary" })
  if (hardcodedCount === 0) pushCheck(securitySection, "pass", "No hardcoded absolute paths detected", { ruleId: "security.path-summary" })
  if (dangerousCount === 0) pushCheck(securitySection, "pass", "No dangerous command patterns detected", { ruleId: "security.command-summary" })
  securitySection.metrics.push({ label: "Files scanned", value: files.length }, { label: "Secret matches", value: secretsCount, tone: secretsCount > 0 ? "danger" : "neutral", target: secretsCount > 0 ? "Ideal: 0" : undefined }, { label: "Absolute paths", value: hardcodedCount, tone: hardcodedCount > 0 ? "warn" : "neutral", target: hardcodedCount > 0 ? "Ideal: 0" : undefined }, { label: "Dangerous commands", value: dangerousCount, tone: dangerousCount > 0 ? "danger" : "neutral", target: dangerousCount > 0 ? "Ideal: 0" : undefined })
  sections.push(finalizeSection(securitySection))

  // 14. Heading Hierarchy Section
  const headingSection = startSection("heading-hierarchy", "Heading Hierarchy", { scannedTargets: ["all *.md files"], testsRun: ["Heading level skip detection", "Duplicate heading detection per file"], algorithmsUsed: ["Regex heading extraction", "Sequential level comparison", "Case-insensitive duplicate title detection"], referencesUsed: makeReferences({ label: "Markdown lint concepts", source: "MD001 / MD024 style checks", kind: "heuristic" }, { label: "Validator parity", source: "validate.sh heading hierarchy checks", kind: "internal" }) })
  let headingIssues = 0
  markdownFiles.forEach((file) => {
    const seen = new Set<string>(); let previousLevel = 0
    file.content.split("\n").forEach((line, index) => {
      const match = /^(#{1,6})\s+(.+)$/.exec(line); if (!match) return
      const level = match[1].length; const label = `${level}:${headingLabel(match[2])}`
      if (previousLevel > 0 && level > previousLevel + 1) { headingIssues += 1; pushCheck(headingSection, "warning", `${file.path} skips heading levels`, { detail: `Line ${index + 1}: h${previousLevel} to h${level}.`, filePath: file.path, line: index + 1, riskStatus: "HEADING_SKIP", riskReason: "Heading levels skip one or more levels", severity: "warn", ruleId: "headings.level-skip" }) }
      if (seen.has(label)) { headingIssues += 1; pushCheck(headingSection, "warning", `${file.path} repeats a heading`, { detail: `Line ${index + 1}: '${match[2].trim()}'.`, filePath: file.path, line: index + 1, riskStatus: "DUPLICATE_HEADING", riskReason: "Duplicate heading detected in markdown file", severity: "warn", ruleId: "headings.duplicate" }) }
      else seen.add(label)
      previousLevel = level
    })
  })
  if (markdownFiles.length === 0) pushCheck(headingSection, "info", "No markdown files found for heading hierarchy checks", { ruleId: "headings.none" })
  else if (headingIssues === 0) pushCheck(headingSection, "pass", "No heading hierarchy issues detected", { ruleId: "headings.summary" })
  headingSection.metrics.push({ label: "Markdown files scanned", value: markdownFiles.length }, { label: "Heading issues", value: headingIssues, tone: headingIssues > 0 ? "warn" : "neutral", target: headingIssues > 0 ? "Ideal: 0" : undefined })

  // Scoring
  const descriptionSubChecks: ScoreCheck[] = [
    { label: "Has description field", passed: hasDesc, points: hasDesc ? 5 : 0, maxPoints: 5 },
    { label: `Description is substantive (>= ${DESC_MIN_USEFUL} chars)`, passed: descLen >= DESC_MIN_USEFUL, points: descLen >= DESC_MIN_USEFUL ? 3 : 0, maxPoints: 3 },
    { label: "Explains WHAT the skill does", passed: descWhat, points: descWhat ? 5 : 0, maxPoints: 5 },
    { label: "Explains WHEN to trigger", passed: descWhen, points: descWhen ? 5 : 0, maxPoints: 5 },
    { label: "Uses third-person or neutral voice", passed: descNotFirstPerson, points: descNotFirstPerson ? 4 : 0, maxPoints: 4 },
    { label: "Uses specific action verbs", passed: descNotGeneric, points: descNotGeneric ? 4 : 0, maxPoints: 4 },
    { label: "Includes negative boundaries", passed: descNegatives, points: descNegatives ? 4 : 0, maxPoints: 4 },
  ]
  const descriptionScore = descriptionSubChecks.reduce((sum, check) => sum + check.points, 0)

  const needsCodeExamples = scriptFiles.length > 0 || /(command|script|api|schema|json|yaml|code|function|run)/i.test(parsedSkill.body)
  const hasSubstantialBody = bodyLines >= 80
  const claritySubChecks: ScoreCheck[] = [
    { label: "Has a heading structure", passed: headings >= 1, points: headings >= 1 ? 6 : 0, maxPoints: 6 },
    { label: "Substantial bodies use 3+ headings", passed: !hasSubstantialBody || headings >= 3, points: !hasSubstantialBody || headings >= 3 ? 5 : 0, maxPoints: 5 },
    { label: "Includes fenced examples when commands/code are documented", passed: !needsCodeExamples || codeBlocks >= 1, points: !needsCodeExamples || codeBlocks >= 1 ? 5 : 0, maxPoints: 5 },
    { label: "References are linked when reference files exist", passed: refFiles.length === 0 || refLinks > 0, points: refFiles.length === 0 || refLinks > 0 ? 5 : 0, maxPoints: 5 },
    { label: "Keeps navigation lightweight", passed: refLinks <= 8, points: refLinks <= 8 ? 4 : 0, maxPoints: 4 },
  ]
  const clarityScore = claritySubChecks.reduce((sum, check) => sum + check.points, 0)

  const hasUsableBody = Boolean(skillFile && parsedSkill.isDelimited && bodyLines > 0)
  const specSubChecks: ScoreCheck[] = [
    { label: "Has name field", passed: hasName, points: hasName ? 4 : 0, maxPoints: 4 },
    { label: "Name format is valid", passed: nameOk, points: nameOk ? 4 : 0, maxPoints: 4 },
    { label: "Has description field", passed: hasDesc, points: hasDesc ? 4 : 0, maxPoints: 4 },
    { label: `Activation cost within budget (< ${TOKEN_BUDGET} tokens)`, passed: hasUsableBody && bodyTokens <= TOKEN_BUDGET, points: hasUsableBody && bodyTokens <= TOKEN_BUDGET ? 4 : 0, maxPoints: 4 },
    { label: `Body within line limit (< ${BODY_MAX_LINES} lines)`, passed: hasUsableBody && bodyLines <= BODY_MAX_LINES, points: hasUsableBody && bodyLines <= BODY_MAX_LINES ? 2 : 0, maxPoints: 2 },
    { label: "Balanced code fences", passed: fencesOk, points: fencesOk ? 2 : 0, maxPoints: 2 },
  ]
  const specScore = specSubChecks.reduce((sum, check) => sum + check.points, 0)

  const needsProgressiveDisclosure = hasRefsDir || scriptFiles.length > 0 || bodyLines >= 120 || bodyTokens >= 1800
  const allRefsLinked = refsTotal === 0 || refsLinked === refsTotal
  const progressiveSubChecks: ScoreCheck[] = [
    { label: "Uses references only when the skill needs progressive disclosure", passed: !needsProgressiveDisclosure || hasRefsDir || refLinks > 0, points: !needsProgressiveDisclosure || hasRefsDir || refLinks > 0 ? 5 : 0, maxPoints: 5 },
    { label: "Links reference files from SKILL.md when references exist", passed: refFiles.length === 0 || refsLinked > 0, points: refFiles.length === 0 || refsLinked > 0 ? 5 : 0, maxPoints: 5 },
    { label: "All reference files are linked", passed: allRefsLinked, points: allRefsLinked ? 3 : 0, maxPoints: 3 },
    { label: `Body stays below ${BODY_MAX_LINES} lines`, passed: bodyLines < BODY_MAX_LINES, points: bodyLines < BODY_MAX_LINES ? 2 : 0, maxPoints: 2 },
  ]
  const progressiveScore = progressiveSubChecks.reduce((sum, check) => sum + check.points, 0)

  const securitySubChecks: ScoreCheck[] = [
    { label: "No secrets or API keys detected", passed: secretsCount === 0, points: secretsCount === 0 ? 5 : 0, maxPoints: 5 },
    { label: "No hardcoded absolute paths", passed: hardcodedCount === 0, points: hardcodedCount === 0 ? 3 : 0, maxPoints: 3 },
    { label: "No dangerous command patterns", passed: dangerousCount === 0, points: dangerousCount === 0 ? 2 : 0, maxPoints: 2 },
  ]
  const securityScore = securitySubChecks.reduce((sum, check) => sum + check.points, 0)

  const scoreDimensions: ScoreDimension[] = [
    { id: "description", title: "Description Quality", score: descriptionScore, max: 30, summary: scoreSummary(descriptionScore, 30), subChecks: descriptionSubChecks },
    { id: "clarity", title: "Instruction Clarity", score: clarityScore, max: 25, summary: scoreSummary(clarityScore, 25), subChecks: claritySubChecks },
    { id: "spec", title: "Spec Compliance", score: specScore, max: 20, summary: scoreSummary(specScore, 20), subChecks: specSubChecks },
    { id: "progressive", title: "Progressive Disclosure", score: progressiveScore, max: 15, summary: scoreSummary(progressiveScore, 15), subChecks: progressiveSubChecks },
    { id: "security", title: "Security", score: securityScore, max: 10, summary: scoreSummary(securityScore, 10), subChecks: securitySubChecks },
  ]

  const fixes: ActionableFix[] = []
  const addMissingFixes = (checks: ScoreCheck[], dimension: string, sectionId: string, sourceFor: (label: string) => string) => {
    checks.forEach((check) => {
      if (!check.passed) {
        const source = sourceFor(check.label)
        fixes.push({ sectionId, dimension, label: check.label, points: check.maxPoints, source, url: resolveUrl(source) })
      }
    })
  }

  addMissingFixes(descriptionSubChecks, "Description Quality", "frontmatter-description", (label) => label.includes("WHAT") || label.includes("WHEN") || label.includes("boundaries") || label.includes("specific") ? "agentskills.io/skill-creation/optimizing-descriptions" : "agentskills.io/specification#description-field")
  addMissingFixes(claritySubChecks, "Instruction Clarity", "body-progressive-disclosure", (label) => label.includes("reference") ? "agentskills.io/specification#progressive-disclosure" : "agentskills.io/skill-creation/best-practices")
  addMissingFixes(specSubChecks, "Spec Compliance", "skill-structure", (label) => label.includes("Activation") || label.includes("Body") ? "agentskills.io/specification#progressive-disclosure" : label.includes("fences") ? "agentskills.io/specification" : "agentskills.io/specification#description-field")
  addMissingFixes(progressiveSubChecks, "Progressive Disclosure", "reference-files", (label) => label.includes("reference") || label.includes("references") ? "agentskills.io/specification#references" : "agentskills.io/specification#progressive-disclosure")
  addMissingFixes(securitySubChecks, "Security", "security-scan", (label) => label.includes("paths") ? "agentskills.io/specification#file-references" : "Static safety scan heuristic")

  fixes.sort((left, right) => right.points - left.points)

  const qualityScoreSection = startSection("quality-score", "Quality Score", { scannedTargets: ["all section outputs", "score dimensions"], testsRun: ["Weighted dimension aggregation", "Letter grade mapping", "Improvement prioritization"], algorithmsUsed: ["Fixed weighted scoring", "Letter-grade threshold mapping", "Descending improvement sort by available points"], referencesUsed: makeReferences({ label: "Validator parity", source: "validate.sh scoring", kind: "internal" }) })
  const totalScore = scoreDimensions.reduce((sum, dimension) => sum + dimension.score, 0)
  const getGrade = (score: number) => score >= 95 ? "A+" : score >= 90 ? "A" : score >= 85 ? "A-" : score >= 80 ? "B+" : score >= 75 ? "B" : score >= 70 ? "B-" : score >= 65 ? "C+" : score >= 60 ? "C" : score >= 55 ? "C-" : score >= 50 ? "D" : "F"
  const grade = getGrade(totalScore)

  scoreDimensions.forEach((dimension) => { pushCheck(qualityScoreSection, dimension.score === dimension.max ? "pass" : dimension.score >= Math.round(dimension.max * 0.6) ? "info" : "warning", `${dimension.title}: ${dimension.score}/${dimension.max}`, { detail: dimension.summary, severity: dimension.score >= Math.round(dimension.max * 0.6) ? "safe" : "warn", ruleId: `score.${dimension.id}` }) })
  pushCheck(qualityScoreSection, fixes.filter(f => f.points > 0).length === 0 ? "pass" : "info", `Improvement opportunities identified: ${fixes.filter(f => f.points > 0).length} scored, ${fixes.filter(f => f.points === 0).length} advisory`, { detail: "Scored improvements affect your grade. Advisory suggestions are source-backed recommendations with no score impact.", ruleId: "score.fixes" })
  qualityScoreSection.metrics.push({ label: "Score", value: `${totalScore}/100`, tone: totalScore >= 90 ? "safe" : totalScore >= 70 ? "warn" : "danger", target: totalScore < 90 ? "Target: ≥ 90/100" : undefined }, { label: "Grade", value: grade, tone: totalScore >= 90 ? "safe" : totalScore >= 70 ? "warn" : "danger", target: totalScore < 90 ? "Target: A or higher" : undefined }, { label: "Improvements", value: fixes.length })
  qualityScoreSection.recommendations = fixes

  sections.push(finalizeSection(headingSection))
  sections.push(finalizeSection(qualityScoreSection))

  const issues = uniqueByKey(sections.flatMap((section) => section.issues), (item) => item.id)
  const findings = sections.flatMap((section) => section.findings)
  const risks = uniqueByKey(sections.flatMap((section) => section.affectedFiles), (item) => `${item.sectionId}:${item.path}:${item.status}:${item.reason}`)

  const mergedRisksMap = new Map<string, { path: string; highestSeverity: Severity; issues: Array<{severity: Severity, reason: string, sectionId: string}> }>()
  risks.forEach((risk) => {
    if (!mergedRisksMap.has(risk.path)) mergedRisksMap.set(risk.path, { path: risk.path, highestSeverity: risk.severity, issues: [] })
    const existing = mergedRisksMap.get(risk.path)!
    existing.issues.push({ severity: risk.severity, reason: risk.reason, sectionId: risk.sectionId })
    existing.highestSeverity = maxSeverity(existing.highestSeverity, risk.severity)
  })
  const mergedRisks = Array.from(mergedRisksMap.values()).sort((a, b) => severityRank[b.highestSeverity] - severityRank[a.highestSeverity])

  const issueGroups = Array.from(issues.reduce((map, issue) => {
    const filePath = issue.filePath ?? "__project__"
    const existing = map.get(filePath) ?? { filePath, severity: issue.severity, counts: { errors: 0, warnings: 0, info: 0 }, issues: [] }
    existing.severity = maxSeverity(existing.severity, issue.severity)
    if (issue.type === "error") existing.counts.errors += 1
    else if (issue.type === "warning") existing.counts.warnings += 1
    else existing.counts.info += 1
    existing.issues.push(issue)
    map.set(filePath, existing)
    return map
  }, new Map<string, IssueGroup>())).map((entry) => { const group = entry[1]; return { ...group, issues: uniqueByKey(group.issues, (item) => item.id) } }).sort((left, right) => {
    const severityDelta = severityRank[right.severity] - severityRank[left.severity]
    if (severityDelta !== 0) return severityDelta
    const rightCount = right.counts.errors + right.counts.warnings + right.counts.info
    const leftCount = left.counts.errors + left.counts.warnings + left.counts.info
    if (rightCount !== leftCount) return rightCount - leftCount
    return left.filePath.localeCompare(right.filePath)
  })

  const trustedSources = uniqueByKey<RuleReference>([
    { label: "OpenAI Codex skills", source: "developers.openai.com/codex/skills", url: resolveUrl("developers.openai.com/codex/skills"), kind: "official" },
    { label: "Anthropic skill best practices", source: "platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices", url: resolveUrl("platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices"), kind: "official" },
    { label: "Agent Skills best practices", source: "agentskills.io/skill-creation/best-practices", url: resolveUrl("agentskills.io/skill-creation/best-practices"), kind: "official" },
    { label: "Agent Skills specification", source: "agentskills.io/specification", url: resolveUrl("agentskills.io/specification"), kind: "spec" },
  ], (item) => `${item.kind}:${item.source}`)

  const errCount = issues.filter((finding) => finding.type === "error").length
  const warnCount = issues.filter((finding) => finding.type === "warning").length
  const infoCount = issues.filter((finding) => finding.type === "info").length
  const passCount = sections.reduce((sum, section) => sum + section.checks.filter((check) => check.result === "pass").length, 0)
  const result = errCount > 0 ? "FAIL" : warnCount > 0 ? "PASS_WITH_WARNINGS" : "PASS"

  return {
    score: totalScore, grade, result,
    counts: { errors: errCount, warnings: warnCount, info: infoCount, passes: passCount, checks: sections.reduce((sum, section) => sum + section.checks.length, 0) },
    summary: { sectionsScanned: sections.length, sectionsWithIssues: sections.filter((section) => section.status !== "pass").length, dangerSections: sections.filter((section) => section.severity === "danger").length, warnSections: sections.filter((section) => section.severity === "warn").length, filesScanned: files.length, dangerFiles: uniqueByKey(risks.filter((risk) => risk.severity === "danger"), (risk) => risk.path).length, warnFiles: uniqueByKey(risks.filter((risk) => risk.severity === "warn"), (risk) => risk.path).length, checksRun: sections.reduce((sum, section) => sum + section.checks.length, 0), topIssues: issues.filter((issue) => issue.type === "error" || issue.type === "warning").slice(0, 8), topIssueGroups: issueGroups.slice(0, 8) },
    scoreDimensions, sections, issues, issueGroups, findings, fixes, trustedSources,
    structure: { hasSkillMd: Boolean(skillFile), hasReadme, hasRefsDir, hasScriptsDir, hasLicense, dirs },
    contentQuality: { headings, codeBlocks, internalLinks, externalLinks, bodyLines, bodyTokens, descriptionLength: descLen, skillName },
    files: { total: files.length, skillFile: skillFile ? estimateTokens(skillFile.content) : undefined, references: refStatuses, risks, mergedRisks },
    tokenBudget: { skillMdTokens, skillMdZone, refSubtotalTokens, totalPackageTokens, totalPackageZone, largestRef, costEstimates: computeCostEstimates(skillMdTokens) },
    readabilityScores: null,
    contextWindows: { ctx200kPct: Math.round((totalPackageTokens / 200000) * 100), ctx128kPct: Math.round((totalPackageTokens / 128000) * 100), initialActivationPct: Math.round((bodyTokens / 200000) * 100), usesProgressiveDisclosure: hasRefsDir && refLinks > 0 },
  }
}

