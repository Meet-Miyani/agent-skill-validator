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

const LINE_HEIGHT = 20

function issueLineClass(issue?: EditorIssueLine, focused?: boolean) {
  if (focused) return "bg-amber-100 ring-1 ring-inset ring-amber-300"
  if (!issue) return ""
  if (issue.type === "error" || issue.severity === "danger") return "bg-red-50"
  if (issue.type === "warning" || issue.severity === "warn") return "bg-amber-50"
  return "bg-blue-50"
}

function gutterLineClass(issue?: EditorIssueLine, focused?: boolean) {
  if (focused) return "bg-amber-200 text-amber-900 ring-1 ring-amber-300"
  if (!issue) return "text-slate-400"
  if (issue.type === "error" || issue.severity === "danger") return "bg-red-100 text-red-700"
  if (issue.type === "warning" || issue.severity === "warn") return "bg-amber-100 text-amber-700"
  return "bg-blue-100 text-blue-700"
}

function issueChipClass(issue: EditorIssueLine) {
  if (issue.type === "error" || issue.severity === "danger") return "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
  if (issue.type === "warning" || issue.severity === "warn") return "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
  return "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
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
    <div className="w-16 shrink-0 overflow-hidden border-r border-slate-200 bg-slate-50 text-right font-mono text-xs leading-5">
      <div className="px-2 py-4" style={{ transform: `translateY(-${scrollTop}px)` }}>
        {Array.from({ length: Math.max(1, lineCount) }, (_, index) => {
          const line = index + 1
          const issue = issueLines.get(line)
          const focused = line === highlightLine
          return (
            <div key={line} className="flex h-5 items-center justify-end">
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
  const visibleIssueLines = issueLines.slice(0, 8)
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

  if (!file) return <EmptyState title="Open a file" detail="Select a finding or file to inspect the source." />

  if (file.binary) {
    return (
      <div className="p-8">
        <h2 className="font-bold text-slate-950">Binary preview unavailable</h2>
        <p className="mt-2 text-sm text-slate-500">{file.path}</p>
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
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div className="min-w-0">
          <div className="truncate text-sm font-black text-slate-950" title={file.path}>{file.path}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{lineCount} lines</span>
            <span>{issueLines.length} issue line{issueLines.length === 1 ? "" : "s"}</span>
            <span className={file.dirty ? "font-bold text-blue-700" : ""}>{file.dirty ? "modified" : "unchanged"}</span>
          </div>
        </div>
        <button onClick={onSaveLocal} className="button-motion control-focus inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">
          <Save className="h-4 w-4" /> Save local
        </button>
      </div>

      {issueLines.length > 0 && (
        <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-5 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Issue lines</span>
            {visibleIssueLines.map((issue) => (
              <button key={issue.line} onClick={() => focusLine(issue.line)} className={`button-motion control-focus rounded-full border px-2.5 py-1 text-xs font-bold ${issueChipClass(issue)}`} title={issue.message}>
                Line {issue.line}{issue.count > 1 ? ` (${issue.count})` : ""}
              </button>
            ))}
            {hiddenIssueCount > 0 && <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600">+{hiddenIssueCount}</span>}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <LineGutter lineCount={lineCount} highlightLine={focusedLine} issueLines={issueLineMap} scrollTop={scrollPosition.top} />
        <div className="relative min-w-0 flex-1 overflow-hidden bg-white">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="min-w-full px-4 py-4 font-mono text-xs leading-5 text-transparent"
              style={{ transform: `translate(${-scrollPosition.left}px, ${-scrollPosition.top}px)` }}
            >
              {lines.map((line, index) => {
                const lineNumber = index + 1
                const issue = issueLineMap.get(lineNumber)
                const focused = lineNumber === focusedLine
                return (
                  <div key={`${lineNumber}-${line.length}`} className={`h-5 min-w-full whitespace-pre transition-colors ${issueLineClass(issue, focused)}`}>
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
            className="absolute inset-0 z-10 h-full w-full resize-none overflow-auto border-0 bg-transparent px-4 py-4 font-mono text-xs leading-5 text-slate-800 caret-slate-950 outline-none focus:ring-0"
          />
        </div>
      </div>
    </div>
  )
}
