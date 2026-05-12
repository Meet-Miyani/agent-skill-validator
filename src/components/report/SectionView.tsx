import React from "react"
import type { ValidationIssue, ValidationSection } from "../../validator/types"
import type { EditableSkillFile } from "../../domain/files"
import { InfoDisclosure, SeverityIcon, StatusPill } from "../ui"
import { IssueCard } from "./FindingsExplorer"

function sectionStatusLabel(status: string) {
  if (status === "fail") return "Fail"
  if (status === "pass_with_warnings") return "Warning"
  if (status === "info") return "Info"
  return "Pass"
}

interface Props {
  section: ValidationSection
  files: EditableSkillFile[]
  onOpenFile: (path: string, line?: number) => void
  onApplyIssueFix: (issue: ValidationIssue) => void
}

/** Detailed drill-down for a single validation section. */
export function SectionView({ section, files, onOpenFile, onApplyIssueFix }: Props) {
  return (
    <div className="animate-soft-enter mx-auto max-w-[1180px] space-y-5">
      {/* Header */}
      <div className="report-page-header">
        <div>
          <p className="muted-label">Section drill-down</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{section.title}</h2>
          {section.summary && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{section.summary}</p>}
        </div>
        <StatusPill severity={section.severity}>{sectionStatusLabel(section.status)}</StatusPill>
      </div>

      {/* Metrics row */}
      {section.metrics.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {section.metrics.map((m) => (
            <div key={m.label} className="panel-surface p-5">
              <div className="muted-label">{m.label}</div>
              <div className="mt-2 text-3xl font-black text-slate-950">{m.value}</div>
              {m.target && <div className="mt-1 text-xs text-slate-500">{m.target}</div>}
            </div>
          ))}
        </div>
      )}

      {/* What was scanned */}
      <InfoDisclosure title="What this section scanned">
        <div className="space-y-2 text-sm text-slate-700">
          <p><b>Targets:</b> {section.scannedTargets.join(", ") || "n/a"}</p>
          <p><b>Tests:</b> {section.testsRun.join(", ") || "n/a"}</p>
        </div>
      </InfoDisclosure>

      {/* Checks run */}
      <section className="panel-surface overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-black text-slate-950">Checks run</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {section.checks.map((check, i) => (
            <div key={`${check.ruleId}-${i}`} className="flex items-start gap-3 p-5">
              <SeverityIcon severity={check.result} className="mt-0.5 h-5 w-5" />
              <div>
                <div className="font-semibold text-slate-900">{check.label}</div>
                {check.detail && <div className="mt-1 text-sm leading-6 text-slate-500">{check.detail}</div>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Issue details */}
      {section.issues.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-black text-slate-950">Issue details</h3>
          {section.issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} files={files} onOpenFile={onOpenFile} onApplyFix={onApplyIssueFix} />
          ))}
        </section>
      )}
    </div>
  )
}
