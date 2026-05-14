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
    ? "border-zinc-950 bg-zinc-950 text-white hover:bg-zinc-800 dark:border-lime-200 dark:bg-lime-200 dark:text-zinc-950 dark:hover:bg-lime-100"
    : tone === "dark"
      ? "border-lime-300 bg-lime-300 text-zinc-950 shadow-sm shadow-lime-300/20 hover:bg-lime-200 dark:border-lime-200 dark:bg-lime-200 dark:hover:bg-lime-100"
      : tone === "ghost"
        ? "border-transparent bg-transparent text-zinc-500 hover:bg-zinc-900/5 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
        : "border-zinc-900/10 bg-[#fffdf6]/70 text-zinc-700 hover:border-zinc-900/20 hover:bg-[#fffdf6] hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"

  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`button-motion control-focus inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold ${className}`}
    >
      {children}
    </button>
  )
}

function resultTone(result: ValidationReport["result"]) {
  if (result === "FAIL") return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
  if (result === "PASS_WITH_WARNINGS") return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
  return "border-lime-300 bg-lime-100 text-zinc-950 dark:border-lime-200/30 dark:bg-lime-200/10 dark:text-lime-100"
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
    <header className="relative z-40 shrink-0 border-b border-zinc-900/10 bg-[#fbf7ea]/90 px-4 py-2 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90 lg:px-5">
      <div className="flex min-h-10 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-zinc-950 bg-zinc-950 text-sm font-semibold text-lime-200 shadow-sm dark:border-lime-200/20 dark:bg-lime-200/10 dark:text-lime-200">
            {report.grade}
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="truncate text-[15px] font-semibold tracking-tight text-zinc-950 dark:text-white">SkillLint</h1>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.10em] ${resultTone(report.result)}`}>{report.result.replace(/_/g, " ")}</span>
              {notice && <span className="animate-toast-enter rounded-full border border-lime-300 bg-lime-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-950 dark:border-lime-200/30 dark:bg-lime-200/10 dark:text-lime-100">{notice}</span>}
            </div>
            <div className="mt-0.5 text-[13px] text-zinc-600 dark:text-zinc-300">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{report.score}/100</span>
              <span className="mx-1.5 text-zinc-300 dark:text-zinc-700">/</span>{report.counts.errors} errors
              <span className="mx-1.5 text-zinc-300 dark:text-zinc-700">/</span>{report.counts.warnings} warnings
              <span className="mx-1.5 text-zinc-300 dark:text-zinc-700">/</span>{report.counts.checks} checks
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          <HeaderButton onClick={onCopyAiPrompt} tone="primary"><Copy className="h-3.5 w-3.5" /> Prompt</HeaderButton>
          <HeaderButton onClick={onAutoLinkRefs}><Wand2 className="h-3.5 w-3.5" /> Auto-link</HeaderButton>
          <HeaderButton onClick={onDownloadZip} tone="dark"><Download className="h-3.5 w-3.5" /> ZIP</HeaderButton>
          <HeaderButton onClick={onDownloadJson}><FileJson className="h-3.5 w-3.5" /> JSON</HeaderButton>
          <HeaderButton onClick={onToggleDarkMode} tone="ghost" label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
            {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </HeaderButton>
          <HeaderButton onClick={onStartOver} tone="ghost" label="Reset"><RefreshCw className="h-3.5 w-3.5" /></HeaderButton>
        </div>
      </div>
    </header>
  )
}
