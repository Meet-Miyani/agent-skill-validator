import React from "react"
import type { ValidationReport, ValidationSection } from "../../validator/types"
import type { EditableSkillFile } from "../../domain/files"
import { resolveIssueLocation } from "../../domain/issues"
import { CountPill, ScoreBar, SeverityIcon, StatusPill, Surface, severityBorderClass } from "../ui"

export function Metric({ label, value, tone, compact = false }: {
  label: string; value: string | number
  tone: "red" | "amber" | "blue" | "zinc"; compact?: boolean
}) {
  const cls = {
    red: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200",
    amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
    blue: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
    zinc: "border-[color:var(--theme-border)] bg-[color:var(--theme-surface)] text-[color:var(--theme-text-muted)]",
  }[tone]

  return (
    <div className={`rounded-xl border shadow-sm backdrop-blur ${compact ? "px-3 py-2" : "p-4"} ${cls}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-70">{label}</div>
      <div className={`${compact ? "mt-0.5 text-xl" : "mt-1 text-2xl"} font-semibold tracking-tight`}>{value}</div>
    </div>
  )
}

export function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Surface className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[color:var(--theme-text-primary)]">{title}</h3>
        {action}
      </div>
      {children}
    </Surface>
  )
}

function sectionStatusLabel(status: string) {
  if (status === "fail") return "Fail"
  if (status === "pass_with_warnings") return "Warning"
  if (status === "info") return "Info"
  return "Pass"
}

function nextActionCopy(report: ValidationReport) {
  if (report.counts.errors > 0) return "Start with blocking errors. These are promoted at the top of the issue queue."
  if (report.counts.warnings > 0) return "Warnings remain. Review each trade-off before exporting the repaired package."
  return "No actionable findings remain. Check coverage, then export the package."
}

interface Props {
  report: ValidationReport
  files: EditableSkillFile[]
  onOpenFile: (path: string, line?: number) => void
  onChangeView: (view: string, sectionId?: string | null) => void
}

export function Overview({ report, files, onOpenFile, onChangeView }: Props) {
  const firstIssue = report.summary.topIssues[0]
  const firstIssueLoc = firstIssue ? resolveIssueLocation(firstIssue, files) : undefined
  const attentionSections = report.sections.filter((s) => s.status !== "pass")
  const passedSections = report.sections.length - attentionSections.length
  const dirtyCount = files.filter((f) => f.dirty).length
  const actionableCount = report.counts.errors + report.counts.warnings
  const completionPct = report.sections.length ? Math.round((passedSections / report.sections.length) * 100) : 0
  const resultSeverity = report.result === "FAIL" ? "danger" : report.result === "PASS_WITH_WARNINGS" ? "warn" : "safe"
  const orderedSections = [...report.sections].sort(sectionSort)

  return (
    <div className="animate-soft-enter mx-auto max-w-[1120px] space-y-4">
      <div className="report-page-header">
        <div className="min-w-0">
          <p className="muted-label">Live audit</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[color:var(--theme-text-primary)]">Report overview</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[color:var(--theme-text-muted)]">A smaller workspace: result, next fix, issue queue, and section coverage stay visible without stacked diagnostic noise.</p>
        </div>
        <StatusPill severity={resultSeverity}>{report.result.replace(/_/g, " ")}</StatusPill>
      </div>

      <section className="report-hero-card overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--theme-text-soft)]">Current score</div>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-5xl font-semibold tracking-[-0.02em] text-[color:var(--theme-text-primary)]">{report.score}</span>
                  <span className="text-sm font-semibold text-[color:var(--theme-text-soft)]">/100 · Grade {report.grade}</span>
                </div>
              </div>
              <div className="grid min-w-[260px] grid-cols-3 gap-2">
                <Metric label="Errors" value={report.counts.errors} tone="red" compact />
                <Metric label="Warnings" value={report.counts.warnings} tone="amber" compact />
                <Metric label="Files" value={files.length} tone="zinc" compact />
              </div>
            </div>
            <div className="mt-5">
              <ScoreBar score={report.score} max={100} />
              <p className="mt-3 text-sm leading-6 text-[color:var(--theme-text-muted)]">{nextActionCopy(report)}</p>
            </div>
          </div>

          <aside className="border-t border-[color:var(--theme-border)] bg-[color:var(--theme-surface-ghost)] p-5 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--theme-text-soft)]">Next action</div>
              <CountPill severity={resultSeverity}>{actionableCount} actionable</CountPill>
            </div>
            {firstIssue ? (
              <button
                onClick={() => firstIssueLoc ? onOpenFile(firstIssueLoc.path, firstIssueLoc.line) : onChangeView("findings", null)}
                className="button-motion control-focus mt-3 w-full rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface)] p-3 text-left shadow-sm hover:border-[color:var(--theme-border-strong)] hover:bg-[color:var(--theme-surface-strong)]"
              >
                <div className="flex items-start gap-2.5">
                  <SeverityIcon severity={firstIssue.type} className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <div className="line-clamp-2 text-sm font-semibold text-[color:var(--theme-text-primary)]">{firstIssue.message}</div>
                    <div className="mt-1 truncate text-xs text-[color:var(--theme-text-muted)]">
                      {firstIssueLoc ? `${firstIssueLoc.path}${firstIssueLoc.line ? `:${firstIssueLoc.line}` : ""}` : firstIssue.sectionTitle}
                    </div>
                  </div>
                </div>
              </button>
            ) : (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">No warning or error findings.</div>
            )}
            <div className="mt-3 grid gap-1.5">
              <button onClick={() => onChangeView("findings", null)} className="theme-secondary-button button-motion control-focus flex h-9 w-full items-center justify-between rounded-lg border px-3 text-left text-xs font-semibold"><span>Review issues</span><span className="text-[color:var(--theme-text-soft)]">{actionableCount}</span></button>
              <button onClick={() => onChangeView("score", null)} className="theme-secondary-button button-motion control-focus flex h-9 w-full items-center justify-between rounded-lg border px-3 text-left text-xs font-semibold"><span>Score details</span><span className="text-[color:var(--theme-text-soft)]">{report.scoreDimensions.length}</span></button>
              <button onClick={() => onChangeView("section", orderedSections[0]?.id ?? null)} className="theme-secondary-button button-motion control-focus flex h-9 w-full items-center justify-between rounded-lg border px-3 text-left text-xs font-semibold"><span>Open coverage</span><span className="text-[color:var(--theme-text-soft)]">{completionPct}%</span></button>
            </div>
          </aside>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryTile label="Sections" value={`${passedSections}/${report.sections.length}`} detail={`${attentionSections.length} need review`} />
        <SummaryTile label="Checks" value={report.counts.checks} detail={`${report.counts.passes} passed`} />
        <SummaryTile label="Changed files" value={dirtyCount} detail={dirtyCount > 0 ? "export ZIP after edits" : "no edits yet"} />
        <SummaryTile label="Tokens" value={`~${report.tokenBudget.skillMdTokens}`} detail="SKILL.md activation" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="Priority issues" action={<button onClick={() => onChangeView("findings", null)} className="theme-ghost-button control-focus rounded-md px-2 py-1 text-xs font-semibold">View all</button>}>
          <div className="space-y-2">
            {report.summary.topIssues.length === 0
              ? <p className="text-sm text-[color:var(--theme-text-muted)]">No warning/error issues found.</p>
              : report.summary.topIssues.slice(0, 6).map((issue) => {
                const loc = resolveIssueLocation(issue, files)
                return (
                  <button key={issue.id} onClick={() => loc ? onOpenFile(loc.path, loc.line) : onChangeView("findings", null)} className="button-motion control-focus flex w-full items-start gap-2.5 rounded-lg border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] p-2.5 text-left hover:border-[color:var(--theme-border-strong)] hover:bg-[color:var(--theme-surface)]">
                    <SeverityIcon severity={issue.type} className="mt-0.5 h-4 w-4" />
                    <span className="min-w-0 flex-1">
                      <span className="block line-clamp-1 text-sm font-semibold text-[color:var(--theme-text-primary)]">{issue.message}</span>
                      <span className="block truncate text-xs text-[color:var(--theme-text-muted)]">{loc ? `${loc.path}${loc.line ? `:${loc.line}` : ""}` : issue.sectionTitle}</span>
                    </span>
                  </button>
                )
              })}
          </div>
        </Panel>

        <Panel title="Score dimensions">
          <div className="space-y-3">
            {report.scoreDimensions.map((dim) => (
              <button key={dim.id} onClick={() => onChangeView("score", null)} className="control-focus w-full rounded-lg p-1 text-left transition hover:bg-[color:var(--theme-surface-soft)]">
                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-semibold text-[color:var(--theme-text-muted)]">{dim.title}</span>
                  <span className="font-semibold text-[color:var(--theme-text-primary)]">{dim.score}/{dim.max}</span>
                </div>
                <ScoreBar score={dim.score} max={dim.max} slim />
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <Surface className="p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[color:var(--theme-text-primary)]">Sections checked</h3>
            <p className="mt-1 text-sm text-[color:var(--theme-text-muted)]">Attention sections are first. Passing sections stay visible at lower emphasis.</p>
          </div>
          <div className="theme-badge rounded-full border px-2.5 py-1 text-xs font-semibold">
            {report.summary.sectionsScanned} sections · {report.summary.checksRun} checks
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {orderedSections.map((section) => (
            <SectionCard key={section.id} section={section} onClick={() => onChangeView("section", section.id)} />
          ))}
        </div>
      </Surface>
    </div>
  )
}

function SummaryTile({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface)] px-3 py-2.5 shadow-sm backdrop-blur">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--theme-text-soft)]">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tracking-tight text-[color:var(--theme-text-primary)]">{value}</div>
      <div className="text-xs text-[color:var(--theme-text-muted)]">{detail}</div>
    </div>
  )
}

function SectionCard({ section, onClick }: { section: ValidationSection; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`panel-hover control-focus rounded-xl border border-[color:var(--theme-border)] border-l-4 bg-[color:var(--theme-surface)] p-3 text-left shadow-sm ${severityBorderClass(section.severity)} ${section.status === "pass" ? "opacity-80 dark:opacity-95" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-[color:var(--theme-text-primary)]">{section.title}</div>
          <div className="mt-0.5 text-xs text-[color:var(--theme-text-muted)]">{section.checks.length} checks · {section.issues.length} issues</div>
        </div>
        <StatusPill severity={section.severity}>{sectionStatusLabel(section.status)}</StatusPill>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[color:var(--theme-text-muted)]">{section.summary}</p>
    </button>
  )
}

function sectionSort(a: ValidationSection, b: ValidationSection) {
  const rank = { fail: 0, pass_with_warnings: 1, info: 2, pass: 3 } as Record<string, number>
  return (rank[a.status] ?? 4) - (rank[b.status] ?? 4)
}
