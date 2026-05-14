import React from "react"
import type { ValidationIssue, ValidationSection } from "../../validator/types"
import type { EditableSkillFile } from "../../domain/files"
import { InfoDisclosure, SeverityIcon, StatusPill, Surface } from "../ui"
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

export function SectionView({ section, files, onOpenFile, onApplyIssueFix }: Props) {
  return (
    <div className="animate-soft-enter mx-auto max-w-[1120px] space-y-4">
      <div className="report-page-header">
        <div>
          <p className="muted-label">Section drill-down</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{section.title}</h2>
          {section.summary && <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">{section.summary}</p>}
        </div>
        <StatusPill severity={section.severity}>{sectionStatusLabel(section.status)}</StatusPill>
      </div>

      {section.metrics.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {section.metrics.map((m) => (
            <Surface key={m.label} className="p-4">
              <div className="muted-label">{m.label}</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{m.value}</div>
              {m.target && <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{m.target}</div>}
            </Surface>
          ))}
        </div>
      )}

      <InfoDisclosure title="What this section scanned">
        <div className="space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
          <p><b>Targets:</b> {section.scannedTargets.join(", ") || "n/a"}</p>
          <p><b>Tests:</b> {section.testsRun.join(", ") || "n/a"}</p>
          {section.algorithmsUsed.length > 0 && <p><b>Methods:</b> {section.algorithmsUsed.join(", ")}</p>}
        </div>
      </InfoDisclosure>

      <Surface className="overflow-hidden">
        <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Checks run</h3>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {section.checks.map((check, i) => (
            <div key={`${check.ruleId}-${i}`} className="flex items-start gap-2.5 px-4 py-3">
              <SeverityIcon severity={check.result} className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{check.label}</div>
                {check.detail && <div className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{check.detail}</div>}
              </div>
              {typeof check.points === "number" && typeof check.maxPoints === "number" && (
                <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{check.points}/{check.maxPoints}</div>
              )}
            </div>
          ))}
        </div>
      </Surface>

      {section.issues.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Issue details</h3>
          {section.issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} files={files} onOpenFile={onOpenFile} onApplyFix={onApplyIssueFix} />
          ))}
        </section>
      )}
    </div>
  )
}
