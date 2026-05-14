import React, { useCallback, useMemo, useState, type DragEvent } from "react"
import { flushSync } from "react-dom"

import { Header } from "./components/Header"
import { FileEditor } from "./components/FileEditor"
import { FileTreePanel } from "./components/FileTree"
import { ReportTab } from "./components/ReportTab"
import { ReportSidebar } from "./components/ReportSidebar"
import { UploadDropzone } from "./components/UploadDropzone"
import { WorkspaceTabs, type WorkspaceTab } from "./components/WorkspaceTabs"

import { useDarkMode } from "./hooks/useDarkMode"
import { usePanelResize } from "./hooks/usePanelResize"

import { copyToClipboard } from "./domain/clipboard"
import {
  applyIssueFix, autoLinkReferenceMentions, buildFileIssueMeta,
  generateAiFixPrompt, resolveIssueLocation,
} from "./domain/issues"
import {
  downloadEditedSkillZip, downloadJsonReport,
  readBrowserFiles, readDroppedItems, toEditableFiles,
} from "./domain/packageIO"
import { buildSampleSkillFiles } from "./domain/sampleSkill"
import type { EditableSkillFile, IssueLocation } from "./domain/files"
import { fileByPath, toValidatorFiles } from "./domain/files"
import type { Severity, ValidationIssue } from "./validator/types"
import { validateSkill } from "./validator/validateSkill"

function validateEditableFiles(files: EditableSkillFile[]) {
  return validateSkill(toValidatorFiles(files))
}

export default function App() {
  const [files, setFiles] = useState<EditableSkillFile[]>([])
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("report")
  const [openFileTabs, setOpenFileTabs] = useState<string[]>([])
  const [activeReportView, setActiveReportView] = useState("overview")
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [highlight, setHighlight] = useState<IssueLocation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const { darkMode, toggle: toggleDarkMode } = useDarkMode()
  const panels = usePanelResize()
  const report = useMemo(() => (files.length > 0 ? validateEditableFiles(files) : null), [files])
  const issueMeta = useMemo(() => buildFileIssueMeta(report, files), [report, files])

  const flashNotice = useCallback((msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice((c) => (c === msg ? null : c)), 2600)
  }, [])

  const openFileByPath = useCallback((path: string, line?: number) => {
    setOpenFileTabs((c) => (c.includes(path) ? c : [...c, path]))
    setActiveTab(path)
    setHighlight({ path, line })
  }, [])

  const openFile = useCallback(
    (path: string, line?: number) => {
      const target = fileByPath(files, path)
      if (target) openFileByPath(target.path, line)
    },
    [files, openFileByPath],
  )

  const closeFile = useCallback((path: string) => {
    setOpenFileTabs((c) => c.filter((p) => p !== path))
    setActiveTab((c) => (c === path ? "report" : c))
  }, [])

  const processFiles = useCallback(
    (nextFiles: EditableSkillFile[]) => {
      const defaultPath =
        nextFiles.find((f) => f.path.toLowerCase() === "skill.md")?.path ??
        nextFiles.find((f) => !f.binary)?.path
      setFiles(nextFiles)
      setActiveTab("report")
      setActiveReportView("overview")
      setActiveSectionId(null)
      setOpenFileTabs(defaultPath ? [defaultPath] : [])
      setHighlight(defaultPath ? { path: defaultPath } : null)
      panels.setLeftPanelCollapsed(false)
      panels.setRightPanelCollapsed(false)
    },
    [panels],
  )

  const loadSampleReport = useCallback(() => {
    setError(null)
    setNotice(null)
    flushSync(() => { processFiles(buildSampleSkillFiles()) })
    flashNotice("Sample report loaded")
  }, [flashNotice, processFiles])

  const processUpload = useCallback(
    async (uploaded: File[]) => {
      setLoading(true)
      setError(null)
      setNotice(null)
      try {
        const pkgFiles = await readBrowserFiles(uploaded)
        if (pkgFiles.length === 0) throw new Error("No readable files found in the selected upload.")
        flushSync(() => { processFiles(toEditableFiles(pkgFiles)) })
      } catch (err: any) {
        setError(err?.message || "Failed to read the uploaded skill package.")
      } finally {
        setLoading(false)
      }
    },
    [processFiles],
  )

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setLoading(true)
      setError(null)
      try {
        const pkgFiles = await readDroppedItems(event.dataTransfer)
        if (pkgFiles.length === 0) throw new Error("No readable files found in the dropped content.")
        flushSync(() => { processFiles(toEditableFiles(pkgFiles)) })
      } catch (err: any) {
        setError(err?.message || "Failed to read dropped skill package.")
      } finally {
        setLoading(false)
      }
    },
    [processFiles],
  )

  const updateFile = useCallback((path: string, content: string) => {
    setFiles((c) =>
      c.map((f) =>
        f.path === path ? { ...f, currentContent: content, dirty: content !== f.originalContent } : f,
      ),
    )
  }, [])

  const saveLocal = useCallback(() => flashNotice("Saved locally and revalidated"), [flashNotice])

  const applyFix = useCallback(
    (issue: ValidationIssue) => {
      setFiles((c) => {
        const next = applyIssueFix(issue, c)
        const changed = next.find((f, i) => f.currentContent !== c[i]?.currentContent)
        if (changed) window.setTimeout(() => openFileByPath(changed.path), 0)
        return next
      })
      flashNotice("Suggested fix applied")
    },
    [flashNotice, openFileByPath],
  )

  const autoLinkRefs = useCallback(() => {
    setFiles((c) => {
      const result = autoLinkReferenceMentions(c)
      if (!result.changed) { flashNotice("No reference mentions needed auto-linking"); return c }
      window.setTimeout(() => openFileByPath("SKILL.md"), 0)
      flashNotice("Reference mentions converted to links")
      return result.files
    })
  }, [flashNotice, openFileByPath])

  const copyAiPrompt = useCallback(() => {
    if (!report) return
    copyToClipboard(generateAiFixPrompt(report, files))
    flashNotice("AI fix prompt copied")
  }, [files, flashNotice, report])

  const downloadZip = useCallback(() => { void downloadEditedSkillZip(files) }, [files])

  const reset = useCallback(() => {
    setFiles([])
    setActiveTab("report")
    setOpenFileTabs([])
    setHighlight(null)
    setActiveReportView("overview")
    setActiveSectionId(null)
    setError(null)
    setNotice(null)
  }, [])

  const activeFile = useMemo(
    () => (activeTab !== "report" ? fileByPath(files, activeTab) : undefined),
    [activeTab, files],
  )

  const activeIssueLines = useMemo(() => {
    if (!activeFile || !report) return []
    const severityRank: Record<Severity, number> = { safe: 0, warn: 1, danger: 2 }
    const lineMap = new Map<number, { line: number; severity: Severity; type: ValidationIssue["type"]; message: string; count: number }>()
    for (const issue of report.issues) {
      const loc = resolveIssueLocation(issue, files)
      if (!loc?.line || loc.path !== activeFile.path) continue
      const existing = lineMap.get(loc.line)
      if (!existing) {
        lineMap.set(loc.line, { line: loc.line, severity: issue.severity, type: issue.type, message: issue.message, count: 1 })
        continue
      }
      existing.count += 1
      existing.message = `${existing.message}; ${issue.message}`
      if (severityRank[issue.severity] > severityRank[existing.severity]) existing.severity = issue.severity
      if (issue.type === "error" || (issue.type === "warning" && existing.type !== "error")) existing.type = issue.type
    }
    return Array.from(lineMap.values()).sort((a, b) => a.line - b.line)
  }, [activeFile, files, report])

  // Upload / loading screen
  if (files.length === 0 || loading) {
    const statusText = files.length > 0 && loading ? "Scanning skill…" : "Reading package…"
    return (
      <div className={darkMode ? "dark" : ""}>
        <UploadDropzone
          loading={loading}
          loadingStatusText={statusText}
          dragActive={dragActive}
          error={error}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          onLoadSample={loadSampleReport}
          onDragActiveChange={setDragActive}
          onFilesSelected={processUpload}
          onDropFiles={handleDrop}
        />
      </div>
    )
  }

  if (!report) return null

  return (
    <div className={`flex h-screen min-h-0 flex-col overflow-hidden ${darkMode ? "dark report-app-frame text-zinc-100" : "report-app-frame text-zinc-900"}`}>
      <Header
        report={report}
        notice={notice}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onCopyAiPrompt={copyAiPrompt}
        onAutoLinkRefs={autoLinkRefs}
        onDownloadZip={downloadZip}
        onDownloadJson={() => downloadJsonReport(report)}
        onStartOver={reset}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ReportSidebar
          report={report}
          activeReportView={activeReportView}
          activeSectionId={activeSectionId}
          collapsed={panels.leftPanelCollapsed}
          width={panels.leftPanelWidth}
          onToggleCollapsed={() => panels.setLeftPanelCollapsed((c) => !c)}
          onChangeView={(view, sectionId = null) => {
            setActiveTab("report")
            setActiveReportView(view)
            setActiveSectionId(sectionId)
          }}
        />

        {!panels.leftPanelCollapsed && (
          <div className="panel-resize-handle" role="separator" aria-orientation="vertical" aria-label="Resize review panel" onPointerDown={(e) => panels.beginResize("left", e)} />
        )}

        <section className="flex min-w-0 flex-1 flex-col border-r border-zinc-200 dark:border-zinc-800">
          <WorkspaceTabs files={files} openFileTabs={openFileTabs} activeTab={activeTab} onSelectTab={setActiveTab} onCloseFile={closeFile} />
          <div className="min-h-0 flex-1 overflow-hidden">
            {activeTab === "report" ? (
              <ReportTab
                report={report}
                files={files}
                activeReportView={activeReportView}
                activeSectionId={activeSectionId}
                onChangeView={(view, sectionId = null) => { setActiveReportView(view); setActiveSectionId(sectionId) }}
                onOpenFile={openFile}
                onApplyIssueFix={applyFix}
              />
            ) : (
              <FileEditor file={activeFile} highlight={highlight} issueLines={activeIssueLines} onUpdateFile={updateFile} onSaveLocal={saveLocal} />
            )}
          </div>
        </section>

        {!panels.rightPanelCollapsed && (
          <div className="panel-resize-handle" role="separator" aria-orientation="vertical" aria-label="Resize files panel" onPointerDown={(e) => panels.beginResize("right", e)} />
        )}

        <FileTreePanel
          files={files}
          activeFilePath={activeTab === "report" ? null : activeTab}
          issueMeta={issueMeta}
          collapsed={panels.rightPanelCollapsed}
          width={panels.rightPanelWidth}
          onToggleCollapsed={() => panels.setRightPanelCollapsed((c) => !c)}
          onOpenFile={openFile}
        />
      </div>
    </div>
  )
}
