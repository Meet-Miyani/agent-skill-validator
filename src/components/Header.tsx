import React from "react"
import { Copy, Download, FileJson, Moon, RefreshCw, Sun, Wand2 } from "lucide-react"
import type { ValidationReport } from "../validator/types"

type ButtonTone = "primary" | "dark" | "secondary" | "ghost"

function HeaderButton({
  children,
  onClick,
  tone = "secondary",
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  tone?: ButtonTone
  label?: string
}) {
  const className = tone === "primary"
    ? "border border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700"
    : tone === "dark"
      ? "border border-slate-800 bg-slate-900 text-white shadow-sm hover:bg-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
      : tone === "ghost"
        ? "border border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950"
        : "border border-slate-200 bg-white/80 text-slate-700 shadow-sm hover:border-slate-300 hover:bg-white hover:text-slate-950"

  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`button-motion control-focus inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${className}`}
    >
      {children}
    </button>
  )
}

function ResultPill({ result }: { result: ValidationReport["result"] }) {
  const className = result === "FAIL"
    ? "border-red-200 bg-red-50 text-red-700"
    : result === "PASS_WITH_WARNINGS"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700"

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-black uppercase tracking-wide ${className}`}>
      {result.replace(/_/g, " ")}
    </span>
  )
}

function CountBadge({ label, value, tone }: { label: string; value: number; tone: "red" | "amber" | "slate" }) {
  const className = tone === "red"
    ? "border-red-200 bg-red-50 text-red-700"
    : tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-slate-200 bg-slate-100 text-slate-600"

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${className}`}>
      <span>{value}</span>
      <span className="font-semibold opacity-75">{label}</span>
    </span>
  )
}

export function Header({
  report,
  notice,
  darkMode,
  onToggleDarkMode,
  onCopyAiPrompt,
  onAutoLinkRefs,
  onDownloadZip,
  onDownloadJson,
  onStartOver,
}: {
  report: ValidationReport
  notice: string | null
  darkMode: boolean
  onToggleDarkMode: () => void
  onCopyAiPrompt: () => void
  onAutoLinkRefs: () => void
  onDownloadZip: () => void
  onDownloadJson: () => void
  onStartOver: () => void
}) {
  return (
    <header className="relative z-40 shrink-0 border-b border-slate-200/80 bg-white/85 px-4 py-2.5 shadow-sm backdrop-blur-xl lg:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-700 text-base font-black text-white shadow-lg shadow-slate-950/15">
            {report.grade}
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <h1 className="truncate text-lg font-black tracking-tight text-slate-950 dark:text-slate-100">Agent Skill Check</h1>
              <ResultPill result={report.result} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-900 shadow-sm">{report.score}/100</span>
              <CountBadge label="errors" value={report.counts.errors} tone="red" />
              <CountBadge label="warnings" value={report.counts.warnings} tone="amber" />
              <CountBadge label="checks" value={report.counts.checks} tone="slate" />
              {notice && <span className="animate-toast-enter rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 shadow-sm">{notice}</span>}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <HeaderButton onClick={onCopyAiPrompt} tone="primary"><Copy className="h-4 w-4" /> Copy prompt</HeaderButton>
          <HeaderButton onClick={onAutoLinkRefs}><Wand2 className="h-4 w-4" /> Auto-link refs</HeaderButton>
          <HeaderButton onClick={onDownloadZip} tone="dark"><Download className="h-4 w-4" /> Export ZIP</HeaderButton>
          <HeaderButton onClick={onDownloadJson}><FileJson className="h-4 w-4" /> JSON</HeaderButton>
          <HeaderButton onClick={onToggleDarkMode} tone="ghost" label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="hidden sm:inline">{darkMode ? "Light" : "Dark"}</span>
          </HeaderButton>
          <HeaderButton onClick={onStartOver} tone="ghost"><RefreshCw className="h-4 w-4" /> Reset</HeaderButton>
        </div>
      </div>
    </header>
  )
}
