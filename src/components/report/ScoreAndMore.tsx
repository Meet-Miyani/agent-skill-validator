import React from "react"
import type { ValidationReport } from "../../validator/types"
import { anchorForIssue, resolveIssueLocation } from "../../domain/issues"
import type { EditableSkillFile } from "../../domain/files"
import { ScoreBar, SeverityIcon } from "../ui"
import { Metric } from "./Overview"

// ─── Score Breakdown ──────────────────────────────────────────────────────────

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

/** Per-dimension score cards with sub-check drill-down. */
export function ScoreBreakdown({ report, files, onOpenFile, onChangeView }: ScoreBreakdownProps) {
  const handleOpenRelated = (label: string) =>
    openRelatedIssue(label, report, files, onOpenFile, onChangeView)

  return (
    <div className="animate-soft-enter mx-auto max-w-[1180px] space-y-5">
      <div className="report-page-header">
        <div>
          <p className="muted-label">Scoring model</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Score</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Dimension-level score impact. Failed checks can jump to related findings when a match exists.
          </p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {report.scoreDimensions.map((dim) => (
          <section key={dim.id} className="panel-surface overflow-hidden">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-black text-slate-900">{dim.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{dim.summary}</p>
                </div>
                <div className="shrink-0 text-2xl font-black text-slate-900">
                  {dim.score}<span className="text-sm font-medium text-slate-400"> / {dim.max}</span>
                </div>
              </div>
              <div className="mt-4"><ScoreBar score={dim.score} max={dim.max} /></div>
            </div>
            <div className="divide-y divide-slate-100">
              {dim.subChecks.map((check, i) => (
                <button
                  key={`${check.label}-${i}`}
                  onClick={() => !check.passed && handleOpenRelated(check.label)}
                  className="button-motion control-focus flex min-h-11 w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50"
                >
                  <SeverityIcon severity={check.passed ? "pass" : "warning"} className="h-5 w-5 shrink-0" />
                  <span className={`flex-1 text-sm ${check.passed ? "text-slate-700" : "font-semibold text-amber-700"}`}>
                    {check.label}
                  </span>
                  <span className={`text-sm font-black ${check.passed ? "text-emerald-600" : "text-amber-600"}`}>
                    {check.points > 0 ? "+" : ""}{check.points}/{check.maxPoints}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

// ─── Token Budget ─────────────────────────────────────────────────────────────

/** Token budget overview — SKILL.md, references, and total package estimates. */
export function TokenBudgetView({ report }: { report: ValidationReport }) {
  return (
    <div className="animate-soft-enter mx-auto max-w-[1180px] space-y-5">
      <div className="report-page-header">
        <div>
          <p className="muted-label">Activation cost</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Token budget</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Approximate token usage when an agent activates this skill.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="SKILL.md" value={`~${report.tokenBudget.skillMdTokens}`} tone="blue" />
        <Metric label="References" value={`~${report.tokenBudget.refSubtotalTokens}`} tone="slate" />
        <Metric label="Package total" value={`~${report.tokenBudget.totalPackageTokens}`} tone="slate" />
      </div>
      {report.tokenBudget.largestRef && (
        <div className="panel-surface p-5">
          <div className="font-bold text-slate-900">Largest reference file</div>
          <div className="mt-1 text-sm text-slate-500">
            {report.tokenBudget.largestRef.name} — ~{report.tokenBudget.largestRef.tokens} tokens
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Fixes ────────────────────────────────────────────────────────────────────

/** Remaining scored fixes ordered by point value. */
export function FixesView({ report }: { report: ValidationReport }) {
  return (
    <div className="animate-soft-enter mx-auto max-w-[1180px] space-y-5">
      <div className="report-page-header">
        <div>
          <p className="muted-label">Repair backlog</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Fixes</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Remaining scored improvements, ordered by highest impact.</p>
        </div>
      </div>
      <div className="space-y-4">
        {report.fixes.length === 0
          ? <p className="panel-surface p-6 text-slate-500">No scored fixes remaining.</p>
          : report.fixes.map((fix, i) => (
            <div key={`${fix.label}-${i}`} className="panel-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-black text-slate-900">{fix.label}</div>
                  <div className="mt-0.5 text-sm text-slate-500">{fix.dimension} · {fix.sectionId}</div>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-black text-blue-700">+{fix.points}</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
