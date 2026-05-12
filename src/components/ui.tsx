import React from "react"
import { AlertTriangle, CheckCircle, ChevronRight, FileWarning, Info } from "lucide-react"
import type { FindingType, Severity } from "../validator/types"

export const severityRank: Record<Severity, number> = { safe: 0, warn: 1, danger: 2 }

export function severityClasses(severity: Severity, bg = false) {
  if (severity === "danger") return bg ? "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200" : "text-red-600 dark:text-red-400"
  if (severity === "warn") return bg ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200" : "text-amber-600 dark:text-amber-400"
  return bg ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200" : "text-emerald-600 dark:text-emerald-400"
}

export function severityBorderClass(severity: Severity) {
  if (severity === "danger") return "border-l-red-500"
  if (severity === "warn") return "border-l-amber-500"
  return "border-l-emerald-500"
}

export function severityDotClass(severity: Severity) {
  if (severity === "danger") return "bg-red-500"
  if (severity === "warn") return "bg-amber-500"
  return "bg-emerald-500"
}

export function SeverityIcon({ severity, className = "h-5 w-5" }: { severity: Severity | FindingType; className?: string }) {
  if (severity === "danger" || severity === "error") return <AlertTriangle className={`${className} text-red-500`} />
  if (severity === "warn" || severity === "warning") return <FileWarning className={`${className} text-amber-500`} />
  if (severity === "info") return <Info className={`${className} text-blue-500`} />
  return <CheckCircle className={`${className} text-emerald-500`} />
}

export function StatusPill({ severity, children }: { severity: Severity; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${severityClasses(severity, true)}`}>{children}</span>
}

export function InfoDisclosure({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-slate-700 dark:text-slate-200">
        <span className="inline-flex items-center gap-2"><Info className="h-4 w-4 text-blue-500" />{title}</span>
        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-open:rotate-90" />
      </summary>
      <div className="mt-3 leading-relaxed">{children}</div>
    </details>
  )
}

export function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = Math.max(0, Math.min(100, Math.round((score / max) * 100)))
  const tone = pct >= 85 ? "bg-emerald-500" : pct >= 65 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
      <div className={`h-full rounded-full ${tone} transition-[width] duration-300 ease-out`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex h-full min-h-[320px] items-center justify-center p-8 text-center">
      <div className="animate-soft-enter">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <Info className="h-6 w-6 text-slate-500" />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{detail}</p>
      </div>
    </div>
  )
}
