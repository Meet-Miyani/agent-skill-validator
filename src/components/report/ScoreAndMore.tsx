import React from "react"
import type { ValidationReport } from "../../validator/types"
import { anchorForIssue, resolveIssueLocation } from "../../domain/issues"
import type { EditableSkillFile } from "../../domain/files"
import { ScoreBar, SeverityIcon, Surface } from "../ui"
import { Metric } from "./Overview"

function openRelatedIssue(
  label: string,
  report: ValidationReport,
  files: EditableSkillFile[],
  onOpenFile: (path: string, line?: number) => void,
  onChangeView: (view: string, sectionId?: string | null) => void,
) {
  const lower = label.toLowerCase()
  const match = report.issues.find((issue) => {
    const text = `${issue.message} ${issue.detail ?? ""} ${issue.ruleId ?? ""}`.toLowerCase()
    if (lower.includes("reference")) return text.includes("reference") || text.includes("orphan")
    if (lower.includes("code example")) return text.includes("code")
    if (lower.includes("negative")) return text.includes("negative") || text.includes("boundar")
    return text.includes(lower.slice(0, 16))
  })
  if (!match) return
  const loc = resolveIssueLocation(match, files)
  if (loc) onOpenFile(loc.path, loc.line)
  onChangeView("findings", null)
  window.setTimeout(
    () => document.getElementById(anchorForIssue(match))?.scrollIntoView({ behavior: "smooth", block: "center" }),
    50,
  )
}

interface ScoreBreakdownProps {
  report: ValidationReport
  files: EditableSkillFile[]
  onOpenFile: (path: string, line?: number) => void
  onChangeView: (view: string, sectionId?: string | null) => void
}

export function ScoreBreakdown({ report, files, onOpenFile, onChangeView }: ScoreBreakdownProps) {
  const handleOpenRelated = (label: string) =>
    openRelatedIssue(label, report, files, onOpenFile, onChangeView)

  return (
    <div className="animate-soft-enter mx-auto max-w-[1120px] space-y-4">
      <div className="report-page-header">
        <div>
          <p className="muted-label">Scoring model</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Score</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">Dimension impact with failed sub-check navigation into the issue queue when a related finding exists.</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {report.scoreDimensions.map((dim) => (
          <Surface key={dim.id} className="overflow-hidden">
            <div className="border-b border-zinc-100 p-4 dark:border-zinc-800">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-zinc-950 dark:text-zinc-50">{dim.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{dim.summary}</p>
                </div>
                <div className="shrink-0 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                  {dim.score}<span className="text-xs font-medium text-zinc-400">/{dim.max}</span>
                </div>
              </div>
              <div className="mt-3"><ScoreBar score={dim.score} max={dim.max} /></div>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {dim.subChecks.map((check, i) => (
                <button
                  key={`${check.label}-${i}`}
                  onClick={() => !check.passed && handleOpenRelated(check.label)}
                  className="button-motion control-focus flex min-h-10 w-full items-center gap-2.5 px-4 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/80"
                >
                  <SeverityIcon severity={check.passed ? "pass" : "warning"} className="h-4 w-4 shrink-0" />
                  <span className={`flex-1 text-sm ${check.passed ? "text-zinc-700 dark:text-zinc-300" : "font-semibold text-amber-800 dark:text-amber-200"}`}>
                    {check.label}
                  </span>
                  <span className={`text-xs font-semibold ${check.passed ? "text-emerald-600 dark:text-emerald-300" : "text-amber-700 dark:text-amber-200"}`}>
                    {check.points > 0 ? "+" : ""}{check.points}/{check.maxPoints}
                  </span>
                </button>
              ))}
            </div>
          </Surface>
        ))}
      </div>
    </div>
  )
}

export function TokenBudgetView({ report }: { report: ValidationReport }) {
  return (
    <div className="animate-soft-enter mx-auto max-w-[1120px] space-y-4">
      <div className="report-page-header">
        <div>
          <p className="muted-label">Activation cost</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Token budget</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">Approximate token usage when an agent activates this skill.</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="SKILL.md" value={`~${report.tokenBudget.skillMdTokens}`} tone="blue" />
        <Metric label="References" value={`~${report.tokenBudget.refSubtotalTokens}`} tone="zinc" />
        <Metric label="Package total" value={`~${report.tokenBudget.totalPackageTokens}`} tone="zinc" />
      </div>
      {report.tokenBudget.largestRef && (
        <Surface className="p-4">
          <div className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Largest reference file</div>
          <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {report.tokenBudget.largestRef.name} — ~{report.tokenBudget.largestRef.tokens} tokens
          </div>
        </Surface>
      )}
    </div>
  )
}

export function FixesView({ report }: { report: ValidationReport }) {
  return (
    <div className="animate-soft-enter mx-auto max-w-[1120px] space-y-4">
      <div className="report-page-header">
        <div>
          <p className="muted-label">Repair backlog</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Fixes</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">Remaining scored improvements, ordered by highest impact.</p>
        </div>
      </div>
      <div className="space-y-3">
        {report.fixes.length === 0
          ? <Surface className="p-4 text-sm text-zinc-500 dark:text-zinc-400">No scored fixes remaining.</Surface>
          : report.fixes.map((fix, i) => (
            <Surface key={`${fix.label}-${i}`} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{fix.label}</div>
                  <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{fix.dimension} · {fix.sectionId}</div>
                </div>
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-200">+{fix.points}</span>
              </div>
            </Surface>
          ))}
      </div>
    </div>
  )
}
