import React from "react"
import type { ValidationIssue, ValidationReport } from "../../validator/types"
import type { EditableSkillFile } from "../../domain/files"
import { anchorForIssue, issueFixPreview, resolveIssueLocation } from "../../domain/issues"
import { SeverityIcon, StatusPill, severityBorderClass } from "../ui"

interface IssueCardProps {
  issue: ValidationIssue
  files: EditableSkillFile[]
  onOpenFile: (path: string, line?: number) => void
  onApplyFix: (issue: ValidationIssue) => void
}

/** Expandable card for a single validation issue. */
export function IssueCard({ issue, files, onOpenFile, onApplyFix }: IssueCardProps) {
  const location = resolveIssueLocation(issue, files)
  const fixPreview = issueFixPreview(issue, files)

  return (
    <article
      id={anchorForIssue(issue)}
      className={`panel-surface scroll-mt-24 overflow-hidden border-l-4 ${severityBorderClass(issue.severity)}`}
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <SeverityIcon severity={issue.type} className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1">
            {/* Title row */}
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-slate-900">{issue.message}</h4>
              <StatusPill severity={issue.severity}>{issue.type}</StatusPill>
            </div>

            {/* Detail text */}
            {issue.detail && <p className="mt-1.5 text-sm leading-6 text-slate-500">{issue.detail}</p>}

            {/* Metadata badges */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">{issue.sectionTitle}</span>
              {location && (
                <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-slate-600">
                  {location.path}{location.line ? `:${location.line}` : ""}
                </span>
              )}
              {issue.ruleId && <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-500">{issue.ruleId}</span>}
            </div>

            {/* Fix preview */}
            {fixPreview && (
              <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-slate-700">
                {fixPreview.after}
              </pre>
            )}

            {/* Source links */}
            {issue.sources.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {issue.sources.map((src, i) =>
                  src.url
                    ? <a key={`${src.source}-${i}`} href={src.url} target="_blank" rel="noreferrer" className="control-focus rounded-lg px-2 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 hover:text-blue-700">{src.label}</a>
                    : null
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action row */}
        <div className="mt-4 flex flex-wrap gap-2">
          {location && (
            <button
              onClick={() => onOpenFile(location.path, location.line)}
              className="button-motion control-focus rounded-xl bg-slate-950 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800"
            >
              Open file{location.line ? ` at line ${location.line}` : ""}
            </button>
          )}
          {fixPreview && (
            <button
              onClick={() => onApplyFix(issue)}
              className="button-motion control-focus rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              Apply suggested fix
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

/** Flat list of all actionable issues with open-file and fix actions. */
export function FindingsExplorer({ report, files, onOpenFile, onApplyIssueFix }: Props) {
  const actionable = report.issues.filter((i) => i.type === "error" || i.type === "warning")
  const visible = actionable.length > 0 ? actionable : report.issues

  return (
    <div className="animate-soft-enter mx-auto max-w-[1180px] space-y-5">
      <div className="report-page-header">
        <div>
          <p className="muted-label">Prioritized diagnostics</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Findings</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Errors and warnings first. Open a finding to jump to the relevant file and line.
            Informational findings are shown only when no actionable findings exist.
          </p>
        </div>
        <StatusPill severity={report.counts.errors > 0 ? "danger" : report.counts.warnings > 0 ? "warn" : "safe"}>
          {visible.length} shown
        </StatusPill>
      </div>

      {visible.length === 0
        ? <p className="panel-surface p-6 text-slate-500">No findings.</p>
        : <div className="space-y-4">{visible.map((issue) => <IssueCard key={issue.id} issue={issue} files={files} onOpenFile={onOpenFile} onApplyFix={onApplyIssueFix} />)}</div>
      }
    </div>
  )
}
