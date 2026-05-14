export type Severity = "safe" | "warn" | "danger"
export type FindingType = "pass" | "info" | "warning" | "error"
export type SectionStatus = "pass" | "pass_with_warnings" | "info" | "fail"

export type SkillFile = { path: string; content: string; binary?: boolean; size?: number }
export type TokenCostEstimate = { model: string; label: string; costPer1kActivations: number }
export type ReadabilityScores = { fleschReadingEase: number; averageSentenceLength: number; averageWordsPerLine: number }
export type TokenEstimate = { tokens: number; chars: number; words: number; lines: number }
export type RuleReference = { label: string; source: string; url?: string; kind: "official" | "spec" | "internal" | "heuristic" }
export type ScoreCheck = { label: string; passed: boolean; points: number; maxPoints: number }
export type ActionableFix = { sectionId: string; dimension: string; label: string; points: number; source: string; url?: string }
export type FileRisk = { path: string; status: string; severity: Severity; reason: string; sectionId: string }
export type ValidationFinding = { type: FindingType; section: string; message: string; detail?: string; filePath?: string; line?: number; ruleId?: string; severity: Severity }
export type ValidationIssue = ValidationFinding & { id: string; groupKey: string; sectionId: string; sectionTitle: string; sources: RuleReference[] }
export type SectionCheck = { label: string; result: FindingType; detail?: string; points?: number; maxPoints?: number; ruleId?: string }

export type ValidationSection = {
  id: string; title: string; summary: string; status: SectionStatus; severity: Severity;
  scannedTargets: string[]; checks: SectionCheck[]; issues: ValidationIssue[];
  testsRun: string[]; algorithmsUsed: string[]; referencesUsed: RuleReference[];
  metrics: {label: string; value: string|number; tone?: Severity | "neutral"; target?: string}[];
  findings: ValidationFinding[]; affectedFiles: FileRisk[]; recommendations: ActionableFix[]
}

export type ReferenceFileInfo = { path: string; tokens: number; lines: number; status: "EMPTY" | "LINKED" | "ORPHANED" | "MISSING" }
export type IssueGroup = { filePath: string; severity: Severity; counts: { errors: number; warnings: number; info: number }; issues: ValidationIssue[] }
export type ScoreDimension = { id: string; title: string; score: number; max: number; summary: string; subChecks: ScoreCheck[] }

export type ValidationReport = {
  score: number; grade: string; result: "FAIL" | "PASS_WITH_WARNINGS" | "PASS";
  counts: { errors: number; warnings: number; info: number; passes: number; checks: number };
  summary: { sectionsScanned: number; sectionsWithIssues: number; dangerSections: number; warnSections: number; filesScanned: number; dangerFiles: number; warnFiles: number; checksRun: number; topIssues: ValidationIssue[]; topIssueGroups: IssueGroup[] };
  scoreDimensions: ScoreDimension[];
  sections: ValidationSection[];
  issues: ValidationIssue[];
  issueGroups: IssueGroup[];
  findings: ValidationFinding[];
  fixes: ActionableFix[];
  trustedSources: RuleReference[];
  structure: { hasSkillMd: boolean; hasReadme: boolean; hasRefsDir: boolean; hasScriptsDir: boolean; hasLicense: boolean; dirs: { name: string; fileCount: number }[] };
  contentQuality: { headings: number; codeBlocks: number; internalLinks: number; externalLinks: number; bodyLines: number; bodyTokens: number; descriptionLength: number; skillName: string };
  files: { total: number; skillFile?: TokenEstimate; references: ReferenceFileInfo[]; risks: FileRisk[]; mergedRisks: {path: string, highestSeverity: Severity, issues: { severity: Severity; reason: string; sectionId: string }[]}[] };
  tokenBudget: { skillMdTokens: number; skillMdZone: Severity; refSubtotalTokens: number; totalPackageTokens: number; totalPackageZone: Severity; largestRef?: { name: string; tokens: number }; costEstimates: TokenCostEstimate[] };
  readabilityScores: ReadabilityScores | null;
  contextWindows: { ctx200kPct: number; ctx128kPct: number; initialActivationPct: number; usesProgressiveDisclosure: boolean };
}
