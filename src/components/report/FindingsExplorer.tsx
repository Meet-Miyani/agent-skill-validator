import React, { useMemo, useState } from "react"
import type { ValidationIssue, ValidationReport } from "../../validator/types"
import type { EditableSkillFile } from "../../domain/files"
import { anchorForIssue, issueFixPreview, resolveIssueLocation } from "../../domain/issues"
import { CountPill, EmptyState, SeverityIcon, StatusPill, Surface, severityBorderClass } from "../ui"

type IssueFilter = "actionable" | "errors" | "warnings" | "fixable" | "all"

interface IssueCardProps {
  issue: ValidationIssue
  files: EditableSkillFile[]
  onOpenFile: (path: string, line?: number) => void
  onApplyFix: (issue: ValidationIssue) => void
}

export function IssueCard({ issue, files, onOpenFile, onApplyFix }: IssueCardProps) {
  const location = resolveIssueLocation(issue, files)
  const fixPreview = issueFixPreview(issue, files)

  return (
    <article
      id={anchorForIssue(issue)}
      className={`panel-surface scroll-mt-20 overflow-hidden border-l-4 ${severityBorderClass(issue.severity)}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <SeverityIcon severity={issue.type} className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="min-w-0 flex-1 text-sm font-semibold text-[color:var(--theme-text-primary)]">{issue.message}</h4>
              <StatusPill severity={issue.severity}>{issue.type}</StatusPill>
            </div>

            {issue.detail && <p className="mt-1.5 text-sm leading-6 text-[color:var(--theme-text-muted)]">{issue.detail}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="theme-chip rounded-md px-2 py-1 font-semibold">{issue.sectionTitle}</span>
              {location && (
                <span className="theme-chip rounded-md px-2 py-1 font-mono">
                  {location.path}{location.line ? `:${location.line}` : ""}
                </span>
              )}
              {issue.ruleId && <span className="theme-chip rounded-md px-2 py-1 text-[color:var(--theme-text-soft)]">{issue.ruleId}</span>}
              {fixPreview && <span className="rounded-md bg-sky-50 px-2 py-1 font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-200">auto-fix available</span>}
            </div>

            {fixPreview && (
              <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-sky-100 bg-sky-50 p-3 text-xs leading-5 text-zinc-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-zinc-200">
                {fixPreview.after}
              </pre>
            )}

            {issue.sources.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {issue.sources.map((src, i) =>
                  src.url
                    ? <a key={`${src.source}-${i}`} href={src.url} target="_blank" rel="noreferrer" className="control-focus rounded-md px-2 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-500/10">{src.label}</a>
                    : null
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {location && (
            <button
              onClick={() => onOpenFile(location.path, location.line)}
              className="theme-primary-button button-motion control-focus rounded-lg px-3 py-2 text-xs font-semibold"
            >
              Open file{location.line ? `:${location.line}` : ""}
            </button>
          )}
          {fixPreview && (
            <button
              onClick={() => onApplyFix(issue)}
              className="button-motion control-focus rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700"
            >
              Apply fix
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

interface Props {
  report: ValidationReport
  files: EditableSkillFile[]
  onOpenFile: (path: string, line?: number) => void
  onApplyIssueFix: (issue: ValidationIssue) => void
}

export function FindingsExplorer({ report, files, onOpenFile, onApplyIssueFix }: Props) {
  const [filter, setFilter] = useState<IssueFilter>("actionable")

  const counts = useMemo(() => {
    const fixable = report.issues.filter((issue) => issueFixPreview(issue, files)).length
    return {
      actionable: report.issues.filter((issue) => issue.type === "error" || issue.type === "warning").length,
      errors: report.counts.errors,
      warnings: report.counts.warnings,
      fixable,
      all: report.issues.length,
    }
  }, [files, report])

  const visible = useMemo(() => {
    const sorted = [...report.issues].sort((a, b) => {
      const order = { error: 0, warning: 1, info: 2, pass: 3 } as Record<string, number>
      return (order[a.type] ?? 4) - (order[b.type] ?? 4)
    })
    if (filter === "errors") return sorted.filter((issue) => issue.type === "error")
    if (filter === "warnings") return sorted.filter((issue) => issue.type === "warning")
    if (filter === "fixable") return sorted.filter((issue) => issueFixPreview(issue, files))
    if (filter === "all") return sorted
    const actionable = sorted.filter((issue) => issue.type === "error" || issue.type === "warning")
    return actionable.length > 0 ? actionable : sorted
  }, [files, filter, report.issues])

  const severity = report.counts.errors > 0 ? "danger" : report.counts.warnings > 0 ? "warn" : "safe"

  return (
    <div className="animate-soft-enter mx-auto max-w-[1120px] space-y-4">
      <div className="report-page-header">
        <div>
          <p className="muted-label">Issue queue</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[color:var(--theme-text-primary)]">Findings</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[color:var(--theme-text-muted)]">Errors and warnings are prioritized. Fixable findings expose a one-click patch when the validator can infer a safe edit.</p>
        </div>
        <CountPill severity={severity}>{visible.length} shown</CountPill>
      </div>

      <Surface className="p-2">
        <div className="flex flex-wrap gap-1.5">
          <FilterButton active={filter === "actionable"} onClick={() => setFilter("actionable")} label="Actionable" count={counts.actionable} />
          <FilterButton active={filter === "errors"} onClick={() => setFilter("errors")} label="Errors" count={counts.errors} />
          <FilterButton active={filter === "warnings"} onClick={() => setFilter("warnings")} label="Warnings" count={counts.warnings} />
          <FilterButton active={filter === "fixable"} onClick={() => setFilter("fixable")} label="Fixable" count={counts.fixable} />
          <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All" count={counts.all} />
        </div>
      </Surface>

      {visible.length === 0 ? (
        <EmptyState title="No findings in this filter" detail="Switch filters to inspect informational output or section-level coverage." />
      ) : (
        <div className="space-y-3">
          {visible.map((issue) => <IssueCard key={issue.id} issue={issue} files={files} onOpenFile={onOpenFile} onApplyFix={onApplyIssueFix} />)}
        </div>
      )}
    </div>
  )
}

function FilterButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`button-motion control-focus inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold ${active ? "theme-active-item" : "theme-nav-item"}`}
    >
      {label}
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${active ? "bg-white/15 text-current" : "theme-chip"}`}>{count}</span>
    </button>
  )
}
