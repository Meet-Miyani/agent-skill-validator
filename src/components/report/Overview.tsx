import React from "react"
import type { ValidationReport } from "../../validator/types"
import type { EditableSkillFile } from "../../domain/files"
import { resolveIssueLocation } from "../../domain/issues"
import { ScoreBar, SeverityIcon, StatusPill, severityBorderClass } from "../ui"

export function Metric({ label, value, tone, compact = false }: {
  label: string; value: string | number
  tone: "red" | "amber" | "blue" | "slate"; compact?: boolean
}) {
  const cls = {
    red: "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200",
    amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200",
    slate: "border-slate-200 bg-white/85 text-slate-700 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-200",
  }[tone]

  return (
    <div className={`rounded-2xl border shadow-sm backdrop-blur ${compact ? "p-3" : "p-4"} ${cls}`}>
      <div className="text-xs font-black uppercase tracking-wider opacity-70">{label}</div>
      <div className={`${compact ? "mt-1 text-2xl" : "mt-1.5 text-3xl"} font-black tracking-tight`}>{value}</div>
    </div>
  )
}

function SummaryTile({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/70">
      <div className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-black tracking-tight text-slate-950 dark:text-slate-100">{value}</div>
      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{detail}</div>
    </div>
  )
}

export function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="panel-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-black text-slate-950 dark:text-slate-100">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function sectionStatusLabel(status: string) {
  if (status === "fail") return "Fail"
  if (status === "pass_with_warnings") return "Warning"
  if (status === "info") return "Info"
  return "Pass"
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

  const primaryMessage =
    report.counts.errors > 0
      ? "Resolve blocking errors before exporting a repaired package."
      : report.counts.warnings > 0
        ? "Warnings remain. Review the trade-offs, then export once accepted."
        : "No blocking findings. Confirm coverage and export when edits are complete."

  const resultSeverity = report.result === "FAIL" ? "danger" : report.result === "PASS_WITH_WARNINGS" ? "warn" : "safe"

  return (
    <div className="animate-soft-enter mx-auto max-w-[1180px] space-y-5">
      <div className="report-page-header">
        <div>
          <p className="muted-label">Live package dashboard</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">Review overview</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            A focused post-scan workspace with score, risk, coverage, and repair actions prioritized above secondary diagnostics.
          </p>
        </div>
        <StatusPill severity={resultSeverity}>{report.result.replace(/_/g, " ")}</StatusPill>
      </div>

      <section className="report-hero-card overflow-hidden">
        <div className="relative grid xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="p-5 sm:p-6 lg:p-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0 flex-1">
                <div className="inline-flex rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-black uppercase tracking-widest text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white/55">
                  Current result
                </div>
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <h3 className="text-4xl font-black tracking-tight text-slate-950 dark:text-white">{report.grade}</h3>
                  <span className="pb-1 text-lg font-black text-slate-500 dark:text-white/55">grade</span>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">{primaryMessage}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/85 px-6 py-5 text-right shadow-lg shadow-blue-950/5 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:shadow-slate-950/20">
                <div className="text-5xl font-black tracking-tight text-slate-950 dark:text-white">{report.score}<span className="text-lg text-slate-400 dark:text-white/40">/100</span></div>
                <div className="mt-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-white/40">quality score</div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Errors" value={report.counts.errors} tone="red" compact />
              <Metric label="Warnings" value={report.counts.warnings} tone="amber" compact />
              <Metric label="Checks" value={report.counts.checks} tone="blue" compact />
              <Metric label="Files" value={files.length} tone="slate" compact />
            </div>
          </div>

          <aside className="relative border-t border-slate-200 bg-white/55 p-5 backdrop-blur lg:p-5 xl:border-l xl:border-t-0 dark:border-white/10 dark:bg-slate-950/20">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-white/40">Next action</div>
              <span className="rounded-full border border-slate-200 bg-white/75 px-2 py-0.5 text-[11px] font-black text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white/50">live</span>
            </div>
            {firstIssue ? (
              <button
                onClick={() => firstIssueLoc && onOpenFile(firstIssueLoc.path, firstIssueLoc.line)}
                className="button-motion control-focus mt-4 w-full rounded-2xl border border-slate-200 bg-white/85 p-4 text-left shadow-sm hover:border-blue-200 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/[0.16]"
              >
                <div className="flex items-start gap-3">
                  <SeverityIcon severity={firstIssue.type} className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white">{firstIssue.message}</div>
                    <div className="mt-1 truncate text-xs text-slate-500 dark:text-white/40">
                      {firstIssueLoc
                        ? `${firstIssueLoc.path}${firstIssueLoc.line ? `:${firstIssueLoc.line}` : ""}`
                        : firstIssue.sectionTitle}
                    </div>
                  </div>
                </div>
              </button>
            ) : (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-300/20 dark:bg-emerald-400/10">
                <div className="font-bold text-emerald-700 dark:text-emerald-200">No error or warning findings.</div>
                <p className="mt-1 text-sm leading-6 text-emerald-700/70 dark:text-emerald-100/70">Open coverage details to confirm what was scanned.</p>
              </div>
            )}
            <div className="mt-4 grid gap-2">
              <button onClick={() => onChangeView("findings", null)} className="button-motion control-focus flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white/75 px-3 py-2.5 text-left text-sm font-bold text-slate-800 shadow-sm hover:border-blue-200 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/[0.16]"><span>Review findings</span><span className="text-xs text-slate-500 dark:text-white/40">{actionableCount} actionable</span></button>
              <button onClick={() => onChangeView("score", null)} className="button-motion control-focus flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white/75 px-3 py-2.5 text-left text-sm font-bold text-slate-800 shadow-sm hover:border-blue-200 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/[0.16]"><span>Inspect score</span><span className="text-xs text-slate-500 dark:text-white/40">{report.scoreDimensions.length} dimensions</span></button>
              <button onClick={() => onChangeView("section", report.sections[0]?.id ?? null)} className="button-motion control-focus flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white/75 px-3 py-2.5 text-left text-sm font-bold text-slate-800 shadow-sm hover:border-blue-200 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/[0.16]"><span>Check coverage</span><span className="text-xs text-slate-500 dark:text-white/40">{completionPct}% passed</span></button>
            </div>
          </aside>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryTile label="Sections passed" value={`${passedSections}/${report.sections.length}`} detail={`${attentionSections.length} need attention`} />
        <SummaryTile label="Files modified" value={dirtyCount} detail={dirtyCount > 0 ? "export ZIP to keep edits" : "no local changes"} />
        <SummaryTile label="Top risks" value={report.summary.topIssues.length} detail={report.summary.topIssues.length > 0 ? "open findings" : "none detected"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Top issues" action={<button onClick={() => onChangeView("findings", null)} className="control-focus rounded-lg px-2 py-1 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-slate-800">View all</button>}>
          <div className="space-y-3">
            {report.summary.topIssues.length === 0
              ? <p className="text-sm text-slate-500 dark:text-slate-400">No warning/error issues found.</p>
              : report.summary.topIssues.map((issue) => {
                const loc = resolveIssueLocation(issue, files)
                return (
                  <button key={issue.id} onClick={() => loc && onOpenFile(loc.path, loc.line)} className="button-motion control-focus flex w-full items-start gap-3 rounded-xl border border-slate-100 bg-white/60 p-3 text-left hover:border-blue-100 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-slate-600 dark:hover:bg-slate-800">
                    <SeverityIcon severity={issue.type} className="mt-0.5 h-5 w-5" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-slate-900 dark:text-slate-100">{issue.message}</span>
                      <span className="block truncate text-sm text-slate-500 dark:text-slate-400">{loc ? `${loc.path}${loc.line ? `:${loc.line}` : ""}` : issue.sectionTitle}</span>
                    </span>
                  </button>
                )
              })}
          </div>
        </Panel>

        <Panel title="Score dimensions">
          <div className="space-y-4">
            {report.scoreDimensions.map((dim) => (
              <button key={dim.id} onClick={() => onChangeView("score", null)} className="control-focus w-full rounded-xl p-2 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/80">
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{dim.title}</span>
                  <span className="font-black text-slate-900 dark:text-slate-100">{dim.score}/{dim.max}</span>
                </div>
                <ScoreBar score={dim.score} max={dim.max} />
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <section className="panel-surface p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-black text-slate-950 dark:text-slate-100">Sections checked</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Validation coverage. Attention sections are promoted; passing sections remain visible but lower emphasis.</p>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-bold text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {report.summary.sectionsScanned} sections · {report.summary.checksRun} checks
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[...report.sections]
            .sort((a, b) => {
              const rank = { fail: 0, pass_with_warnings: 1, info: 2, pass: 3 } as Record<string, number>
              return (rank[a.status] ?? 4) - (rank[b.status] ?? 4)
            })
            .map((section) => (
              <button
                key={section.id}
                onClick={() => onChangeView("section", section.id)}
                className={`panel-hover control-focus rounded-2xl border border-l-4 bg-white/90 p-4 text-left shadow-sm dark:bg-slate-800/70 ${severityBorderClass(section.severity)} ${section.status === "pass" ? "opacity-80" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-bold text-slate-900 dark:text-slate-100">{section.title}</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{section.checks.length} checks · {section.issues.length} issues</div>
                  </div>
                  <StatusPill severity={section.severity}>{sectionStatusLabel(section.status)}</StatusPill>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{section.summary}</p>
              </button>
            ))}
        </div>
      </section>
    </div>
  )
}
