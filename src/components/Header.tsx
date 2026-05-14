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
    ? "theme-primary-button border border-transparent"
    : tone === "dark"
      ? "theme-primary-button border border-transparent shadow-sm shadow-lime-300/20"
      : tone === "ghost"
        ? "theme-ghost-button border border-transparent bg-transparent"
        : "theme-secondary-button border"

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
    <header className="theme-topbar relative z-40 shrink-0 border-b px-4 py-2 shadow-sm backdrop-blur-xl lg:px-5">
      <div className="flex min-h-10 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="theme-icon-box flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold shadow-sm">
            {report.grade}
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="truncate text-[15px] font-semibold tracking-tight text-[color:var(--theme-text-primary)]">SkillLint</h1>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.10em] ${resultTone(report.result)}`}>{report.result.replace(/_/g, " ")}</span>
              {notice && <span className="animate-toast-enter rounded-full border border-lime-300 bg-lime-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-950 dark:border-lime-200/30 dark:bg-lime-200/10 dark:text-lime-100">{notice}</span>}
            </div>
            <div className="mt-0.5 text-[13px] text-[color:var(--theme-text-muted)]">
              <span className="font-semibold text-[color:var(--theme-text-primary)]">{report.score}/100</span>
              <span className="mx-1.5 text-[color:var(--theme-text-faint)]">/</span>{report.counts.errors} errors
              <span className="mx-1.5 text-[color:var(--theme-text-faint)]">/</span>{report.counts.warnings} warnings
              <span className="mx-1.5 text-[color:var(--theme-text-faint)]">/</span>{report.counts.checks} checks
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
