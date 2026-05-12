import React from "react"
import { Activity, CheckCircle2, CheckSquare, ChevronLeft, ChevronRight, Layers, ShieldAlert } from "lucide-react"
import type { ValidationReport, ValidationSection } from "../validator/types"
import { severityDotClass } from "./ui"

export const reportViews = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "findings", label: "Findings", icon: ShieldAlert },
  { id: "score", label: "Score", icon: CheckSquare },
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
      <aside className="flex w-12 shrink-0 flex-col items-center border-r border-slate-200/80 bg-white/80 py-3 shadow-sm backdrop-blur-xl">
        <button onClick={onToggleCollapsed} className="button-motion control-focus flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100" title="Expand review panel" aria-label="Expand review panel">
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="mt-4 vertical-rail-label">Review</div>
        <span className="mt-4 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-black text-slate-600 shadow-sm" title="Sections needing attention">{attentionSections.length}</span>
      </aside>
    )
  }

  return (
    <aside className="shrink-0 overflow-auto border-r border-slate-200/80 bg-white/80 px-3 py-4 shadow-sm backdrop-blur-xl" style={{ width }}>
      <div className="px-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="muted-label">Review</div>
            <div className="mt-1 text-sm font-black text-slate-950">Scan workspace</div>
          </div>
          <button onClick={onToggleCollapsed} className="button-motion control-focus flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800" title="Collapse review panel" aria-label="Collapse review panel">
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white/75 p-3 shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-slate-700">Coverage</span>
            <span className="font-black text-slate-950">{Math.round(passPct)}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-[width] duration-300"
              style={{ width: `${passPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">{passedSections.length} passed · {attentionSections.length} need attention</p>
        </div>
      </div>

      <nav className="mt-4 space-y-1">
        {reportViews.map((view) => {
          const Icon = view.icon
          const active = activeReportView === view.id && !activeSectionId
          return (
            <button
              key={view.id}
              onClick={() => onChangeView(view.id, null)}
              className={`button-motion control-focus flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold ${active ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20" : "text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm"}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{view.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-6 flex items-center justify-between px-2">
        <span className="muted-label">Sections checked</span>
        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-black text-slate-500 shadow-sm">{report.sections.length}</span>
      </div>
      <p className="mt-1 px-2 text-xs text-slate-500">
        {attentionSections.length === 0 ? "All checks currently pass." : `${attentionSections.length} need attention. Passed sections remain visible.`}
      </p>

      <nav className="mt-3 space-y-1.5 pb-2">
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
      className={`button-motion control-focus group relative flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm ${active ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm"}`}
      title={`${section.title} - ${sectionLabel(section)}`}
    >
      <span className={`absolute left-0 top-2 h-7 w-1 rounded-r-full transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover:opacity-50"} ${severityDotClass(section.severity)}`} />
      <span className="flex min-w-0 items-center gap-2 pl-1">
        {isPass ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${severityDotClass(section.severity)}`} />}
        <span className={`truncate font-semibold ${isPass ? "text-slate-500" : "text-slate-800"}`}>{section.title}</span>
      </span>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${sectionBadgeClass(section)}`}>
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
  if (section.severity === "danger") return "bg-red-50 text-red-700"
  if (section.severity === "warn") return "bg-amber-50 text-amber-700"
  return "bg-emerald-50 text-emerald-700"
}
