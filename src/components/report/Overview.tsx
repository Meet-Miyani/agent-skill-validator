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
    zinc: "border-zinc-200 bg-white/85 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200",
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
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{title}</h3>
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
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Report overview</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">A smaller workspace: result, next fix, issue queue, and section coverage stay visible without stacked diagnostic noise.</p>
        </div>
        <StatusPill severity={resultSeverity}>{report.result.replace(/_/g, " ")}</StatusPill>
      </div>

      <section className="report-hero-card overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">Current score</div>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-5xl font-semibold tracking-[-0.02em] text-zinc-950 dark:text-white">{report.score}</span>
                  <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">/100 · Grade {report.grade}</span>
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
              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{nextActionCopy(report)}</p>
            </div>
          </div>

          <aside className="border-t border-zinc-200 bg-white/55 p-5 dark:border-zinc-800 dark:bg-zinc-950/20 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">Next action</div>
              <CountPill severity={resultSeverity}>{actionableCount} actionable</CountPill>
            </div>
            {firstIssue ? (
              <button
                onClick={() => firstIssueLoc ? onOpenFile(firstIssueLoc.path, firstIssueLoc.line) : onChangeView("findings", null)}
                className="button-motion control-focus mt-3 w-full rounded-xl border border-zinc-200 bg-white/85 p-3 text-left shadow-sm hover:border-zinc-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:bg-zinc-900"
              >
                <div className="flex items-start gap-2.5">
                  <SeverityIcon severity={firstIssue.type} className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <div className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{firstIssue.message}</div>
                    <div className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {firstIssueLoc ? `${firstIssueLoc.path}${firstIssueLoc.line ? `:${firstIssueLoc.line}` : ""}` : firstIssue.sectionTitle}
                    </div>
                  </div>
                </div>
              </button>
            ) : (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">No warning or error findings.</div>
            )}
            <div className="mt-3 grid gap-1.5">
              <button onClick={() => onChangeView("findings", null)} className="button-motion control-focus flex h-9 w-full items-center justify-between rounded-lg border border-zinc-200 bg-white/70 px-3 text-left text-xs font-semibold text-zinc-800 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-900"><span>Review issues</span><span className="text-zinc-400">{actionableCount}</span></button>
              <button onClick={() => onChangeView("score", null)} className="button-motion control-focus flex h-9 w-full items-center justify-between rounded-lg border border-zinc-200 bg-white/70 px-3 text-left text-xs font-semibold text-zinc-800 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-900"><span>Score details</span><span className="text-zinc-400">{report.scoreDimensions.length}</span></button>
              <button onClick={() => onChangeView("section", orderedSections[0]?.id ?? null)} className="button-motion control-focus flex h-9 w-full items-center justify-between rounded-lg border border-zinc-200 bg-white/70 px-3 text-left text-xs font-semibold text-zinc-800 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-900"><span>Open coverage</span><span className="text-zinc-400">{completionPct}%</span></button>
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
        <Panel title="Priority issues" action={<button onClick={() => onChangeView("findings", null)} className="control-focus rounded-md px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">View all</button>}>
          <div className="space-y-2">
            {report.summary.topIssues.length === 0
              ? <p className="text-sm text-zinc-500 dark:text-zinc-400">No warning/error issues found.</p>
              : report.summary.topIssues.slice(0, 6).map((issue) => {
                const loc = resolveIssueLocation(issue, files)
                return (
                  <button key={issue.id} onClick={() => loc ? onOpenFile(loc.path, loc.line) : onChangeView("findings", null)} className="button-motion control-focus flex w-full items-start gap-2.5 rounded-lg border border-zinc-200 bg-white/60 p-2.5 text-left hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-900">
                    <SeverityIcon severity={issue.type} className="mt-0.5 h-4 w-4" />
                    <span className="min-w-0 flex-1">
                      <span className="block line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{issue.message}</span>
                      <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">{loc ? `${loc.path}${loc.line ? `:${loc.line}` : ""}` : issue.sectionTitle}</span>
                    </span>
                  </button>
                )
              })}
          </div>
        </Panel>

        <Panel title="Score dimensions">
          <div className="space-y-3">
            {report.scoreDimensions.map((dim) => (
              <button key={dim.id} onClick={() => onChangeView("score", null)} className="control-focus w-full rounded-lg p-1 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-900">
                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-semibold text-zinc-700 dark:text-zinc-300">{dim.title}</span>
                  <span className="font-semibold text-zinc-950 dark:text-zinc-50">{dim.score}/{dim.max}</span>
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
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Sections checked</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Attention sections are first. Passing sections stay visible at lower emphasis.</p>
          </div>
          <div className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
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
    <div className="rounded-xl border border-zinc-200 bg-white/80 px-3 py-2.5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/65">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{value}</div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{detail}</div>
    </div>
  )
}

function SectionCard({ section, onClick }: { section: ValidationSection; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`panel-hover control-focus rounded-xl border border-l-4 bg-white/85 p-3 text-left shadow-sm dark:bg-zinc-900/60 ${severityBorderClass(section.severity)} ${section.status === "pass" ? "opacity-75" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{section.title}</div>
          <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{section.checks.length} checks · {section.issues.length} issues</div>
        </div>
        <StatusPill severity={section.severity}>{sectionStatusLabel(section.status)}</StatusPill>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{section.summary}</p>
    </button>
  )
}

function sectionSort(a: ValidationSection, b: ValidationSection) {
  const rank = { fail: 0, pass_with_warnings: 1, info: 2, pass: 3 } as Record<string, number>
  return (rank[a.status] ?? 4) - (rank[b.status] ?? 4)
}
