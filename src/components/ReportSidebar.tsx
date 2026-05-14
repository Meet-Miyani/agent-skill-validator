import React from "react"
import { Activity, CheckCircle2, CheckSquare, ChevronLeft, ChevronRight, Layers, ShieldAlert, Cpu, Wrench } from "lucide-react"
import type { ValidationReport, ValidationSection } from "../validator/types"
import { ScoreBar, severityDotClass } from "./ui"

export const reportViews = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "findings", label: "Issues", icon: ShieldAlert },
  { id: "score", label: "Score", icon: CheckSquare },
  { id: "token", label: "Tokens", icon: Cpu },
  { id: "fixes", label: "Fixes", icon: Wrench },
  { id: "files", label: "Files", icon: Layers },
]

export function ReportSidebar({
  report,
  activeReportView,
  activeSectionId,
  collapsed,
  width,
  onToggleCollapsed,
  onChangeView,
}: {
  report: ValidationReport
  activeReportView: string
  activeSectionId: string | null
  collapsed: boolean
  width: number
  onToggleCollapsed: () => void
  onChangeView: (view: string, sectionId?: string | null) => void
}) {
  const attentionSections = report.sections.filter((section) => section.status !== "pass")
  const passedSections = report.sections.filter((section) => section.status === "pass")
  const orderedSections = [...attentionSections, ...passedSections]
  const passPct = report.sections.length ? ((report.sections.length - attentionSections.length) / report.sections.length) * 100 : 0

  if (collapsed) {
    return (
      <aside className="theme-sidebar flex w-11 shrink-0 flex-col items-center border-r py-2 backdrop-blur-xl">
        <button onClick={onToggleCollapsed} className="theme-ghost-button button-motion control-focus flex h-8 w-8 items-center justify-center rounded-lg" title="Expand review panel" aria-label="Expand review panel">
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="mt-4 vertical-rail-label">Review</div>
        <span className="theme-badge mt-4 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold" title="Sections needing attention">{attentionSections.length}</span>
      </aside>
    )
  }

  return (
    <aside className="theme-sidebar shrink-0 overflow-auto border-r px-2 py-3 backdrop-blur-xl" style={{ width }}>
      <div className="px-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="muted-label">Review</div>
            <div className="mt-0.5 truncate text-sm font-semibold text-[color:var(--theme-text-primary)]">Audit queue</div>
          </div>
          <button onClick={onToggleCollapsed} className="theme-ghost-button button-motion control-focus flex h-8 w-8 items-center justify-center rounded-lg" title="Collapse review panel" aria-label="Collapse review panel">
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface)] p-3 shadow-sm">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.10em] text-[color:var(--theme-text-soft)]">Coverage</span>
            <span className="text-sm font-semibold text-[color:var(--theme-text-primary)]">{Math.round(passPct)}%</span>
          </div>
          <div className="mt-2"><ScoreBar score={passPct} max={100} slim /></div>
          <p className="mt-2 text-[13px] leading-5 text-[color:var(--theme-text-muted)]">{attentionSections.length === 0 ? "No active blockers." : `${attentionSections.length} sections need review.`}</p>
        </div>
      </div>

      <nav className="mt-3 space-y-0.5">
        {reportViews.map((view) => {
          const Icon = view.icon
          const active = activeReportView === view.id && !activeSectionId
          return (
            <button
              key={view.id}
              onClick={() => onChangeView(view.id, null)}
              className={`button-motion control-focus flex min-h-8 w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium ${active ? "theme-active-item" : "theme-nav-item"}`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{view.label}</span>
              {view.id === "findings" && (report.counts.errors + report.counts.warnings > 0) && (
                <span className="theme-chip ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold">{report.counts.errors + report.counts.warnings}</span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="mt-5 flex items-center justify-between px-2">
        <span className="muted-label">Sections</span>
        <span className="theme-badge rounded-full border px-2 py-0.5 text-[10px] font-semibold">{report.sections.length}</span>
      </div>

      <nav className="mt-2 space-y-0.5 pb-2">
        {orderedSections.map((section) => (
          <SectionNavButton
            key={section.id}
            section={section}
            active={activeSectionId === section.id}
            onClick={() => onChangeView("section", section.id)}
          />
        ))}
      </nav>
    </aside>
  )
}

function SectionNavButton({ section, active, onClick }: { section: ValidationSection; active: boolean; onClick: () => void }) {
  const isPass = section.status === "pass"
  return (
    <button
      onClick={onClick}
      className={`button-motion control-focus group relative flex min-h-8 w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] ${active ? "theme-active-item ring-1 ring-[color:var(--theme-nav-active-border)]" : "theme-nav-item"}`}
      title={`${section.title} - ${sectionLabel(section)}`}
    >
      <span className={`absolute left-0 top-1.5 h-5 w-0.5 rounded-r-full transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover:opacity-50"} ${severityDotClass(section.severity)}`} />
      <span className="flex min-w-0 items-center gap-2 pl-1">
        {isPass ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" /> : <span className={`h-2 w-2 shrink-0 rounded-full ${severityDotClass(section.severity)}`} />}
        <span className={`truncate font-medium ${isPass && !active ? "text-[color:var(--theme-text-soft)]" : ""}`}>{section.title}</span>
      </span>
      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-normal ${sectionBadgeClass(section)}`}>
        {sectionLabel(section)}
      </span>
    </button>
  )
}

function sectionLabel(section: ValidationSection) {
  if (section.status === "fail") return "Fail"
  if (section.status === "pass_with_warnings") return "Warn"
  if (section.status === "info") return "Info"
  return "Pass"
}

function sectionBadgeClass(section: ValidationSection) {
  if (section.severity === "danger") return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200"
  if (section.severity === "warn") return "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-100"
  return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
}
