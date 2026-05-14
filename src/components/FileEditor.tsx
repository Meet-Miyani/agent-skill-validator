import React, { useEffect, useMemo, useRef, useState, type KeyboardEvent, type UIEvent } from "react"
import { Save } from "lucide-react"
import type { EditableSkillFile, IssueLocation } from "../domain/files"
import { textLineCount } from "../domain/files"
import type { FindingType, Severity } from "../validator/types"
import { EmptyState } from "./ui"

type EditorIssueLine = {
  line: number
  severity: Severity
  type: FindingType
  message: string
  count: number
}

type ScrollPosition = { top: number; left: number }

const LINE_HEIGHT = 21

function issueLineClass(issue?: EditorIssueLine, focused?: boolean) {
  if (focused) return "bg-amber-100 ring-1 ring-inset ring-amber-300 dark:bg-amber-500/20 dark:ring-amber-400/40"
  if (!issue) return ""
  if (issue.type === "error" || issue.severity === "danger") return "bg-red-50 dark:bg-red-500/10"
  if (issue.type === "warning" || issue.severity === "warn") return "bg-amber-50 dark:bg-amber-500/10"
  return "bg-sky-50 dark:bg-sky-500/10"
}

function gutterLineClass(issue?: EditorIssueLine, focused?: boolean) {
  if (focused) return "bg-amber-200 text-amber-950 ring-1 ring-amber-300 dark:bg-amber-500/25 dark:text-amber-100 dark:ring-amber-400/40"
  if (!issue) return "text-zinc-400 dark:text-zinc-600"
  if (issue.type === "error" || issue.severity === "danger") return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200"
  if (issue.type === "warning" || issue.severity === "warn") return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"
  return "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200"
}

function issueChipClass(issue: EditorIssueLine) {
  if (issue.type === "error" || issue.severity === "danger") return "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
  if (issue.type === "warning" || issue.severity === "warn") return "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
  return "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
}

function LineGutter({
  lineCount,
  highlightLine,
  issueLines,
  scrollTop,
}: {
  lineCount: number
  highlightLine?: number
  issueLines: Map<number, EditorIssueLine>
  scrollTop: number
}) {
  return (
    <div className="w-14 shrink-0 overflow-hidden border-r border-zinc-200 bg-zinc-50 text-right font-mono text-xs leading-[21px] dark:border-zinc-800 dark:bg-zinc-950/70">
      <div className="px-1.5 py-3" style={{ transform: `tranzincY(-${scrollTop}px)` }}>
        {Array.from({ length: Math.max(1, lineCount) }, (_, index) => {
          const line = index + 1
          const issue = issueLines.get(line)
          const focused = line === highlightLine
          return (
            <div key={line} className="flex items-center justify-end">
              <span className={`min-w-8 rounded px-1 font-medium transition-colors ${gutterLineClass(issue, focused)}`} title={issue ? `${issue.count} issue${issue.count === 1 ? "" : "s"}: ${issue.message}` : undefined}>
                {line}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function lineStartOffset(content: string, targetLine: number) {
  if (targetLine <= 1) return 0
  const lines = content.split("\n")
  return lines.slice(0, targetLine - 1).join("\n").length + 1
}

export function FileEditor({
  file,
  highlight,
  issueLines,
  onUpdateFile,
  onSaveLocal,
}: {
  file?: EditableSkillFile
  highlight: IssueLocation | null
  issueLines: EditorIssueLine[]
  onUpdateFile: (path: string, content: string) => void
  onSaveLocal: () => void
}) {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({ top: 0, left: 0 })
  const [localFocusedLine, setLocalFocusedLine] = useState<number | undefined>(undefined)
  const lineCount = useMemo(() => file ? Math.max(1, textLineCount(file.currentContent)) : 0, [file])
  const lines = useMemo(() => file ? file.currentContent.split("\n") : [""], [file])
  const activeHighlight = file && highlight?.path === file.path ? highlight : null
  const focusedLine = activeHighlight?.line ?? localFocusedLine
  const issueLineMap = useMemo(() => new Map(issueLines.map((issue) => [issue.line, issue])), [issueLines])
  const visibleIssueLines = issueLines.slice(0, 9)
  const hiddenIssueCount = Math.max(0, issueLines.length - visibleIssueLines.length)

  const focusLine = (line: number) => {
    if (!file || !textAreaRef.current) return
    const textarea = textAreaRef.current
    const targetLine = Math.max(1, Math.min(line, lineCount || 1))
    const start = lineStartOffset(file.currentContent, targetLine)
    const end = Math.min(file.currentContent.length, start + (lines[targetLine - 1]?.length ?? 0))
    setLocalFocusedLine(targetLine)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start, end)
      textarea.scrollTop = Math.max(0, (targetLine - 1) * LINE_HEIGHT - textarea.clientHeight / 3)
      setScrollPosition({ top: textarea.scrollTop, left: textarea.scrollLeft })
    })
  }

  useEffect(() => {
    setScrollPosition({ top: 0, left: 0 })
    setLocalFocusedLine(undefined)
  }, [file?.path])

  useEffect(() => {
    if (!activeHighlight?.line) return
    focusLine(activeHighlight.line)
  }, [activeHighlight?.line])

  if (!file) return <EmptyState title="Open a file" detail="Select a finding or a package file to inspect source content." />

  if (file.binary) {
    return (
      <div className="p-6">
        <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">Binary preview unavailable</h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{file.path}</p>
      </div>
    )
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault()
      onSaveLocal()
    }
  }

  const handleScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget
    setScrollPosition({ top: target.scrollTop, left: target.scrollLeft })
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-zinc-950">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50" title={file.path}>{file.path}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-600 dark:text-zinc-400">
            <span>{lineCount} lines</span>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span>{issueLines.length} issue line{issueLines.length === 1 ? "" : "s"}</span>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className={file.dirty ? "font-semibold text-sky-700 dark:text-sky-300" : ""}>{file.dirty ? "modified" : "unchanged"}</span>
          </div>
        </div>
        <button onClick={onSaveLocal} className="button-motion control-focus inline-flex h-8 items-center gap-1.5 rounded-lg bg-zinc-950 px-3 text-[13px] font-semibold text-lime-200 hover:bg-zinc-800 dark:bg-lime-200 dark:text-zinc-950 dark:hover:bg-lime-100">
          <Save className="h-3.5 w-3.5" /> Save local
        </button>
      </div>

      {issueLines.length > 0 && (
        <div className="shrink-0 border-b border-zinc-200 bg-zinc-50/80 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.10em] text-zinc-400 dark:text-zinc-500">Issue lines</span>
            {visibleIssueLines.map((issue) => (
              <button key={issue.line} onClick={() => focusLine(issue.line)} className={`button-motion control-focus rounded-full border px-2 py-0.5 text-[11px] font-semibold ${issueChipClass(issue)}`} title={issue.message}>
                {issue.line}{issue.count > 1 ? ` (${issue.count})` : ""}
              </button>
            ))}
            {hiddenIssueCount > 0 && <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">+{hiddenIssueCount}</span>}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <LineGutter lineCount={lineCount} highlightLine={focusedLine} issueLines={issueLineMap} scrollTop={scrollPosition.top} />
        <div className="relative min-w-0 flex-1 overflow-hidden bg-white dark:bg-zinc-950">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="min-w-full px-4 py-3 font-mono text-[13px] leading-[21px] text-transparent"
              style={{ transform: `tranzinc(${-scrollPosition.left}px, ${-scrollPosition.top}px)` }}
            >
              {lines.map((line, index) => {
                const lineNumber = index + 1
                const issue = issueLineMap.get(lineNumber)
                const focused = lineNumber === focusedLine
                return (
                  <div key={`${lineNumber}-${line.length}`} className={`h-[21px] min-w-full whitespace-pre transition-colors ${issueLineClass(issue, focused)}`}>
                    {line || " "}
                  </div>
                )
              })}
            </div>
          </div>
          <textarea
            ref={textAreaRef}
            value={file.currentContent}
            onChange={(event) => onUpdateFile(file.path, event.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            spellCheck={false}
            wrap="off"
            className="absolute inset-0 z-10 h-full w-full resize-none overflow-auto border-0 bg-transparent px-4 py-3 font-mono text-[13px] leading-[21px] text-zinc-800 caret-zinc-950 outline-none focus:ring-0 dark:text-zinc-200 dark:caret-zinc-100"
          />
        </div>
      </div>
    </div>
  )
}
