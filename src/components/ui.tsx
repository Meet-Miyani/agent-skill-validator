import React from "react"
import { AlertTriangle, CheckCircle2, ChevronRight, Circle, FileWarning, Info } from "lucide-react"
import type { FindingType, Severity } from "../validator/types"

export const severityRank: Record<Severity, number> = { safe: 0, warn: 1, danger: 2 }

export function severityClasses(severity: Severity, bg = false) {
  if (severity === "danger") return bg ? "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200" : "text-red-600 dark:text-red-300"
  if (severity === "warn") return bg ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-300/30 dark:bg-amber-500/10 dark:text-amber-100" : "text-amber-700 dark:text-amber-300"
  return bg ? "border-lime-300/70 bg-lime-100/70 text-zinc-950 dark:border-lime-200/25 dark:bg-lime-200/10 dark:text-lime-100" : "text-emerald-600 dark:text-lime-200"
}

export function severityBorderClass(severity: Severity) {
  if (severity === "danger") return "border-l-red-500"
  if (severity === "warn") return "border-l-amber-500"
  return "border-l-lime-400"
}

export function severityDotClass(severity: Severity) {
  if (severity === "danger") return "bg-red-500"
  if (severity === "warn") return "bg-amber-500"
  return "bg-lime-400"
}

export function SeverityIcon({ severity, className = "h-4 w-4" }: { severity: Severity | FindingType; className?: string }) {
  if (severity === "danger" || severity === "error") return <AlertTriangle className={`${className} text-red-500 dark:text-red-300`} />
  if (severity === "warn" || severity === "warning") return <FileWarning className={`${className} text-amber-500 dark:text-amber-300`} />
  if (severity === "info") return <Info className={`${className} text-sky-500 dark:text-sky-300`} />
  return <CheckCircle2 className={`${className} text-emerald-600 dark:text-lime-200`} />
}

export function StatusPill({ severity, children }: { severity: Severity; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.10em] ${severityClasses(severity, true)}`}>{children}</span>
}

export function CountPill({ severity, children }: { severity: Severity; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${severityClasses(severity, true)}`}>{children}</span>
}

export function Surface({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`panel-surface ${className}`}>{children}</section>
}

export function InfoDisclosure({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-[20px] border border-zinc-900/10 bg-[#fffdf6]/80 px-4 py-3 text-sm text-zinc-600 shadow-sm dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-300">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-zinc-900 dark:text-zinc-100">
        <span className="inline-flex items-center gap-2"><Info className="h-4 w-4 text-zinc-950 dark:text-lime-200" />{title}</span>
        <ChevronRight className="h-4 w-4 transition-transform duration-150 group-open:rotate-90" />
      </summary>
      <div className="mt-3 leading-relaxed">{children}</div>
    </details>
  )
}

export function ScoreBar({ score, max, slim = false }: { score: number; max: number; slim?: boolean }) {
  const pct = Math.max(0, Math.min(100, Math.round((score / Math.max(max, 1)) * 100)))
  const tone = pct >= 85 ? "bg-lime-400" : pct >= 65 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className={`${slim ? "h-1" : "h-1.5"} overflow-hidden rounded-full bg-zinc-900/10 dark:bg-white/10`}>
      <div className={`h-full rounded-full ${tone} transition-[width] duration-300 ease-out`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex h-full min-h-[280px] items-center justify-center p-8 text-center">
      <div className="animate-soft-enter max-w-md">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-900/10 bg-[#fffdf6] shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <Circle className="h-3 w-3 fill-zinc-300 text-zinc-300 dark:fill-zinc-600 dark:text-zinc-600" />
        </div>
        <h3 className="font-semibold text-zinc-950 dark:text-zinc-100">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{detail}</p>
      </div>
    </div>
  )
}
