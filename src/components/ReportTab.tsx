import React from "react"
import type { ValidationIssue, ValidationReport } from "../validator/types"
import type { EditableSkillFile } from "../domain/files"
import { Overview } from "./report/Overview"
import { FindingsExplorer } from "./report/FindingsExplorer"
import { ScoreBreakdown, TokenBudgetView, FixesView } from "./report/ScoreAndMore"
import { SectionView } from "./report/SectionView"
import { StatusPill, severityBorderClass } from "./ui"

function FilesRiskView({ report, onOpenFile }: { report: ValidationReport; onOpenFile: (path: string, line?: number) => void }) {
  return (
    <div className="animate-soft-enter mx-auto max-w-[1180px] space-y-5">
      <div className="report-page-header">
        <div>
          <p className="muted-label">Package files</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">File risk map</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Files with merged validator risks, ordered by severity and impact.</p>
        </div>
      </div>
      {report.files.mergedRisks.length === 0
        ? <p className="panel-surface p-6 text-slate-500">No file risks detected.</p>
        : (
          <div className="grid gap-3 xl:grid-cols-2">
            {report.files.mergedRisks.map((risk) => (
              <button
                key={risk.path}
                onClick={() => onOpenFile(risk.path)}
                className={`panel-hover control-focus flex w-full items-center justify-between gap-4 rounded-2xl border border-l-4 bg-white/90 p-4 text-left shadow-sm dark:bg-slate-800/70 ${severityBorderClass(risk.highestSeverity)}`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-bold text-slate-900 dark:text-slate-100">{risk.path}</span>
                  <span className="block truncate text-sm text-slate-500 dark:text-slate-400">{risk.issues.map((i) => i.reason).join(" · ")}</span>
                </span>
                <StatusPill severity={risk.highestSeverity}>{risk.highestSeverity}</StatusPill>
              </button>
            ))}
          </div>
        )}
    </div>
  )
}

interface Props {
  report: ValidationReport
  files: EditableSkillFile[]
  activeReportView: string
  activeSectionId: string | null
  onChangeView: (view: string, sectionId?: string | null) => void
  onOpenFile: (path: string, line?: number) => void
  onApplyIssueFix: (issue: ValidationIssue) => void
}

export function ReportTab({ report, files, activeReportView, activeSectionId, onChangeView, onOpenFile, onApplyIssueFix }: Props) {
  const activeSection = activeSectionId ? report.sections.find((s) => s.id === activeSectionId) : undefined

  return (
    <main className="h-full min-w-0 overflow-auto bg-transparent p-4 lg:p-5">
      {activeSection
        ? <SectionView section={activeSection} files={files} onOpenFile={onOpenFile} onApplyIssueFix={onApplyIssueFix} />
        : activeReportView === "score"
          ? <ScoreBreakdown report={report} files={files} onOpenFile={onOpenFile} onChangeView={onChangeView} />
          : activeReportView === "findings"
            ? <FindingsExplorer report={report} files={files} onOpenFile={onOpenFile} onApplyIssueFix={onApplyIssueFix} />
            : activeReportView === "files"
              ? <FilesRiskView report={report} onOpenFile={onOpenFile} />
              : activeReportView === "token"
                ? <TokenBudgetView report={report} />
                : activeReportView === "fixes"
                  ? <FixesView report={report} />
                  : <Overview report={report} files={files} onOpenFile={onOpenFile} onChangeView={onChangeView} />
      }
    </main>
  )
}
