import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { flushSync } from "react-dom";

import { Header } from "./components/Header";
import { FileEditor } from "./components/FileEditor";
import { FileTreePanel } from "./components/FileTree";
import { ReportTab } from "./components/ReportTab";
import { ReportSidebar, reportViews } from "./components/ReportSidebar";
import { UploadDropzone } from "./components/UploadDropzone";
import { WorkspaceTabs, type WorkspaceTab } from "./components/WorkspaceTabs";

import { useDarkMode } from "./hooks/useDarkMode";
import { usePanelResize } from "./hooks/usePanelResize";

import { copyToClipboard } from "./domain/clipboard";
import { captureDroppedData } from "./domain/dropData";
import {
  applyIssueFix,
  autoLinkReferenceMentions,
  buildFileIssueMeta,
  generateAiFixPrompt,
  resolveIssueLocation,
} from "./domain/issues";
import { buildSampleSkillFiles } from "./domain/sampleSkill";
import type { EditableSkillFile, IssueLocation } from "./domain/files";
import { fileByPath, toEditableFiles, toValidatorFiles } from "./domain/files";
import type {
  Severity,
  ValidationIssue,
  ValidationReport,
} from "./validator/types";

async function validateEditableFiles(files: EditableSkillFile[]) {
  const { validateSkill } = await import("./validator/validateSkill");
  return validateSkill(toValidatorFiles(files));
}

type LandingBusyPhase =
  | "idle"
  | "reading-package"
  | "reading-folder"
  | "scanning-skill";

type ScreenSurface = "landing" | "workspace";
type HistoryMode = "push" | "replace" | "none";
type AppHistoryState =
  | {
      app: "skilllint";
      sessionId: number;
      page: "landing";
    }
  | {
      app: "skilllint";
      sessionId: number;
      page: "report";
      view: string;
      sectionId: string | null;
    }
  | {
      app: "skilllint";
      sessionId: number;
      page: "file";
      path: string;
    };

const reportViewIds = new Set(reportViews.map((view) => view.id));

function isAppHistoryState(value: unknown): value is AppHistoryState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AppHistoryState>;
  return candidate.app === "skilllint" && typeof candidate.sessionId === "number";
}

export default function App() {
  const [files, setFiles] = useState<EditableSkillFile[]>([]);
  const [screenSurface, setScreenSurface] = useState<ScreenSurface>("landing");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("report");
  const [openFileTabs, setOpenFileTabs] = useState<string[]>([]);
  const [activeReportView, setActiveReportView] = useState("overview");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<IssueLocation | null>(null);
  const [landingBusyPhase, setLandingBusyPhase] =
    useState<LandingBusyPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [report, setReport] = useState<ValidationReport | null>(null);

  const { darkMode, toggle: toggleDarkMode } = useDarkMode();
  const panels = usePanelResize();
  const historySessionRef = useRef(0);

  const buildLandingHistoryState = useCallback(
    (sessionId = historySessionRef.current): AppHistoryState => ({
      app: "skilllint",
      sessionId,
      page: "landing",
    }),
    [],
  );

  const buildReportHistoryState = useCallback(
    (view: string, sectionId: string | null, sessionId = historySessionRef.current): AppHistoryState => ({
      app: "skilllint",
      sessionId,
      page: "report",
      view,
      sectionId,
    }),
    [],
  );

  const buildFileHistoryState = useCallback(
    (path: string, sessionId = historySessionRef.current): AppHistoryState => ({
      app: "skilllint",
      sessionId,
      page: "file",
      path,
    }),
    [],
  );

  const writeHistoryState = useCallback((state: AppHistoryState, mode: HistoryMode) => {
    if (mode === "none") return;
    if (mode === "push") {
      window.history.pushState(state, "");
      return;
    }
    window.history.replaceState(state, "");
  }, []);

  const normalizeReportDestination = useCallback(
    (view: string, sectionId: string | null) => {
      if (sectionId) {
        if (!report || report.sections.some((section) => section.id === sectionId)) {
          return { view: "section", sectionId };
        }
        return { view: "overview", sectionId: null };
      }

      if (view !== "section" && reportViewIds.has(view)) {
        return { view, sectionId: null };
      }

      return { view: "overview", sectionId: null };
    },
    [report],
  );

  const applyLandingSurface = useCallback(() => {
    setScreenSurface("landing");
  }, []);

  const applyReportDestination = useCallback((view: string, sectionId: string | null) => {
    const normalized = normalizeReportDestination(view, sectionId);
    setScreenSurface("workspace");
    setActiveTab("report");
    setActiveReportView(normalized.view);
    setActiveSectionId(normalized.sectionId);
    setHighlight(null);
    return normalized;
  }, [normalizeReportDestination]);

  const applyFileDestination = useCallback((path: string, line?: number) => {
    const target = fileByPath(files, path);
    if (!target) return null;

    setScreenSurface("workspace");
    setOpenFileTabs((c) => (c.includes(target.path) ? c : [...c, target.path]));
    setActiveTab(target.path);
    setHighlight(line ? { path: target.path, line } : { path: target.path });
    return target.path;
  }, [files]);

  const replaceWithSafeFallback = useCallback(() => {
    if (screenSurface === "workspace" && report) {
      applyReportDestination("overview", null);
      writeHistoryState(buildReportHistoryState("overview", null), "replace");
      return;
    }

    applyLandingSurface();
    writeHistoryState(buildLandingHistoryState(), "replace");
  }, [
    applyLandingSurface,
    applyReportDestination,
    buildLandingHistoryState,
    buildReportHistoryState,
    report,
    screenSurface,
    writeHistoryState,
  ]);

  const navigateToReport = useCallback((view: string, sectionId: string | null = null, historyMode: HistoryMode = "push") => {
    const normalized = applyReportDestination(view, sectionId);
    writeHistoryState(
      buildReportHistoryState(normalized.view, normalized.sectionId),
      historyMode,
    );
  }, [applyReportDestination, buildReportHistoryState, writeHistoryState]);

  const navigateToFile = useCallback((path: string, line?: number, historyMode: HistoryMode = "push") => {
    const resolvedPath = applyFileDestination(path, line);
    if (!resolvedPath) {
      replaceWithSafeFallback();
      return false;
    }

    writeHistoryState(buildFileHistoryState(resolvedPath), historyMode);
    return true;
  }, [
    applyFileDestination,
    buildFileHistoryState,
    replaceWithSafeFallback,
    writeHistoryState,
  ]);

  const navigateToTab = useCallback((tab: WorkspaceTab, historyMode: HistoryMode = "push") => {
    if (tab === "report") {
      navigateToReport(activeSectionId ? "section" : activeReportView, activeSectionId, historyMode);
      return;
    }

    void navigateToFile(tab, undefined, historyMode);
  }, [activeReportView, activeSectionId, navigateToFile, navigateToReport]);

  useEffect(() => {
    let cancelled = false;

    if (files.length === 0) {
      setReport(null);
      setLandingBusyPhase("idle");
      return;
    }

    setLandingBusyPhase("scanning-skill");
    validateEditableFiles(files)
      .then((nextReport) => {
        if (!cancelled) setReport(nextReport);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setReport(null);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to validate the uploaded skill.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLandingBusyPhase((current) =>
            current === "scanning-skill" ? "idle" : current,
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [files]);
  const issueMeta = useMemo(
    () => buildFileIssueMeta(report, files),
    [report, files],
  );

  const flashNotice = useCallback((msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice((c) => (c === msg ? null : c)), 2600);
  }, []);

  const closeFile = useCallback((path: string) => {
    setOpenFileTabs((c) => c.filter((p) => p !== path));
    if (activeTab === path) {
      navigateToReport(activeSectionId ? "section" : activeReportView, activeSectionId);
    }
  }, [activeReportView, activeSectionId, activeTab, navigateToReport]);

  const processFiles = useCallback(
    (nextFiles: EditableSkillFile[]) => {
      const nextSessionId = historySessionRef.current + 1;
      historySessionRef.current = nextSessionId;
      const defaultPath =
        nextFiles.find((f) => f.path.toLowerCase() === "skill.md")?.path ??
        nextFiles.find((f) => !f.binary)?.path;
      setScreenSurface("workspace");
      setFiles(nextFiles);
      setActiveTab("report");
      setActiveReportView("overview");
      setActiveSectionId(null);
      setOpenFileTabs(defaultPath ? [defaultPath] : []);
      setHighlight(defaultPath ? { path: defaultPath } : null);
      panels.setLeftPanelCollapsed(false);
      panels.setRightPanelCollapsed(false);
      writeHistoryState(
        buildReportHistoryState("overview", null, nextSessionId),
        "push",
      );
    },
    [buildReportHistoryState, panels, writeHistoryState],
  );

  const loadSampleReport = useCallback(() => {
    setError(null);
    setNotice(null);
    flushSync(() => {
      processFiles(buildSampleSkillFiles());
    });
    flashNotice("Sample report loaded");
  }, [flashNotice, processFiles]);

  const processUpload = useCallback(
    async (uploaded: File[]) => {
      let handedOffToValidation = false;
      setLandingBusyPhase("reading-package");
      setError(null);
      setNotice(null);
      try {
        const { readBrowserFiles } = await import("./domain/packageIO");
        const pkgFiles = await readBrowserFiles(uploaded);
        if (pkgFiles.length === 0)
          throw new Error("No readable files found in the selected upload.");
        flushSync(() => {
          processFiles(toEditableFiles(pkgFiles));
        });
        handedOffToValidation = true;
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to read the uploaded skill package.",
        );
      } finally {
        if (!handedOffToValidation) setLandingBusyPhase("idle");
      }
    },
    [processFiles],
  );

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      let handedOffToValidation = false;
      setError(null);
      setNotice(null);
      try {
        const droppedData = captureDroppedData(event.dataTransfer);
        const hasDirectoryDrop = droppedData.items.some(
          ({ entry }) => entry?.isDirectory,
        );
        setLandingBusyPhase(
          hasDirectoryDrop ? "reading-folder" : "reading-package",
        );
        const { readDroppedDataSnapshot } = await import("./domain/packageIO");
        const pkgFiles = await readDroppedDataSnapshot(droppedData);
        if (pkgFiles.length === 0)
          throw new Error("No readable files found in the dropped content.");
        flushSync(() => {
          processFiles(toEditableFiles(pkgFiles));
        });
        handedOffToValidation = true;
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to read dropped skill package.",
        );
      } finally {
        if (!handedOffToValidation) setLandingBusyPhase("idle");
      }
    },
    [processFiles],
  );

  const updateFile = useCallback((path: string, content: string) => {
    setFiles((c) =>
      c.map((f) =>
        f.path === path
          ? {
              ...f,
              currentContent: content,
              dirty: content !== f.originalContent,
            }
          : f,
      ),
    );
  }, []);

  const saveLocal = useCallback(
    () => flashNotice("Saved locally and revalidated"),
    [flashNotice],
  );

  const applyFix = useCallback(
    (issue: ValidationIssue) => {
      setFiles((c) => {
        const next = applyIssueFix(issue, c);
        const changed = next.find(
          (f, i) => f.currentContent !== c[i]?.currentContent,
        );
        if (changed) window.setTimeout(() => navigateToFile(changed.path), 0);
        return next;
      });
      flashNotice("Suggested fix applied");
    },
    [flashNotice, navigateToFile],
  );

  const autoLinkRefs = useCallback(() => {
    setFiles((c) => {
      const result = autoLinkReferenceMentions(c);
      if (!result.changed) {
        flashNotice("No reference mentions needed auto-linking");
        return c;
      }
      window.setTimeout(() => navigateToFile("SKILL.md"), 0);
      flashNotice("Reference mentions converted to links");
      return result.files;
    });
  }, [flashNotice, navigateToFile]);

  const copyAiPrompt = useCallback(() => {
    if (!report) return;
    copyToClipboard(generateAiFixPrompt(report, files));
    flashNotice("AI fix prompt copied");
  }, [files, flashNotice, report]);

  const downloadZip = useCallback(() => {
    void import("./domain/packageIO").then(({ downloadEditedSkillZip }) => downloadEditedSkillZip(files));
  }, [files]);

  const reset = useCallback(() => {
    historySessionRef.current += 1;
    setScreenSurface("landing");
    setFiles([]);
    setActiveTab("report");
    setOpenFileTabs([]);
    setHighlight(null);
    setActiveReportView("overview");
    setActiveSectionId(null);
    setLandingBusyPhase("idle");
    setError(null);
    setNotice(null);
    writeHistoryState(buildLandingHistoryState(historySessionRef.current), "replace");
  }, [buildLandingHistoryState, writeHistoryState]);

  useEffect(() => {
    writeHistoryState(buildLandingHistoryState(), "replace");
  }, [buildLandingHistoryState, writeHistoryState]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (!isAppHistoryState(state)) {
        replaceWithSafeFallback();
        return;
      }

      if (state.page === "landing") {
        applyLandingSurface();
        return;
      }

      if (state.sessionId !== historySessionRef.current) {
        replaceWithSafeFallback();
        return;
      }

      if (state.page === "report") {
        const normalized = applyReportDestination(state.view, state.sectionId);
        if (
          normalized.view !== state.view ||
          normalized.sectionId !== state.sectionId
        ) {
          writeHistoryState(
            buildReportHistoryState(normalized.view, normalized.sectionId),
            "replace",
          );
        }
        return;
      }

      if (!applyFileDestination(state.path)) {
        replaceWithSafeFallback();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [
    applyFileDestination,
    applyLandingSurface,
    applyReportDestination,
    buildReportHistoryState,
    replaceWithSafeFallback,
    writeHistoryState,
  ]);

  useEffect(() => {
    if (
      screenSurface !== "workspace" ||
      activeTab !== "report" ||
      !activeSectionId ||
      !report
    ) {
      return;
    }

    const sectionExists = report.sections.some(
      (section) => section.id === activeSectionId,
    );
    if (!sectionExists) {
      navigateToReport("overview", null, "replace");
    }
  }, [
    activeSectionId,
    activeTab,
    navigateToReport,
    report,
    screenSurface,
  ]);

  const activeFile = useMemo(
    () => (activeTab !== "report" ? fileByPath(files, activeTab) : undefined),
    [activeTab, files],
  );

  const activeIssueLines = useMemo(() => {
    if (!activeFile || !report) return [];
    const severityRank: Record<Severity, number> = {
      safe: 0,
      warn: 1,
      danger: 2,
    };
    const lineMap = new Map<
      number,
      {
        line: number;
        severity: Severity;
        type: ValidationIssue["type"];
        message: string;
        count: number;
      }
    >();
    for (const issue of report.issues) {
      const loc = resolveIssueLocation(issue, files);
      if (!loc?.line || loc.path !== activeFile.path) continue;
      const existing = lineMap.get(loc.line);
      if (!existing) {
        lineMap.set(loc.line, {
          line: loc.line,
          severity: issue.severity,
          type: issue.type,
          message: issue.message,
          count: 1,
        });
        continue;
      }
      existing.count += 1;
      existing.message = `${existing.message}; ${issue.message}`;
      if (severityRank[issue.severity] > severityRank[existing.severity])
        existing.severity = issue.severity;
      if (
        issue.type === "error" ||
        (issue.type === "warning" && existing.type !== "error")
      )
        existing.type = issue.type;
    }
    return Array.from(lineMap.values()).sort((a, b) => a.line - b.line);
  }, [activeFile, files, report]);

  const showLandingScreen =
    screenSurface === "landing" ||
    files.length === 0 ||
    landingBusyPhase === "reading-package" ||
    landingBusyPhase === "reading-folder" ||
    !report;
  const landingBusy = landingBusyPhase !== "idle";
  const landingStatusText =
    landingBusyPhase === "reading-folder"
      ? "Reading folder…"
      : landingBusyPhase === "scanning-skill"
        ? "Scanning skill…"
        : "Reading package…";

  // Upload / loading screen
  if (showLandingScreen) {
    return (
      <div className={darkMode ? "dark" : ""}>
        <UploadDropzone
          busy={landingBusy}
          busyStatusText={landingStatusText}
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
    );
  }

  return (
    <div
      className={`flex h-screen min-h-0 flex-col overflow-hidden ${darkMode ? "dark report-app-frame" : "report-app-frame"}`}
    >
      <Header
        report={report}
        notice={notice}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onCopyAiPrompt={copyAiPrompt}
        onAutoLinkRefs={autoLinkRefs}
        onDownloadZip={downloadZip}
        onDownloadJson={() => { void import("./domain/packageIO").then(({ downloadJsonReport }) => downloadJsonReport(report)); }}
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
            navigateToReport(view, sectionId);
          }}
        />

        {!panels.leftPanelCollapsed && (
          <div
            className="panel-resize-handle"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize review panel"
            onPointerDown={(e) => panels.beginResize("left", e)}
          />
        )}

        <section className="flex min-w-0 flex-1 flex-col border-r border-[color:var(--theme-border)]">
          <WorkspaceTabs
            files={files}
            openFileTabs={openFileTabs}
            activeTab={activeTab}
            onSelectTab={navigateToTab}
            onCloseFile={closeFile}
          />
          <div className="min-h-0 flex-1 overflow-hidden">
            {activeTab === "report" ? (
              <ReportTab
                report={report}
                files={files}
                activeReportView={activeReportView}
                activeSectionId={activeSectionId}
                onChangeView={(view, sectionId = null) => {
                  navigateToReport(view, sectionId);
                }}
                onOpenFile={navigateToFile}
                onApplyIssueFix={applyFix}
              />
            ) : (
              <FileEditor
                file={activeFile}
                highlight={highlight}
                issueLines={activeIssueLines}
                onUpdateFile={updateFile}
                onSaveLocal={saveLocal}
              />
            )}
          </div>
        </section>

        {!panels.rightPanelCollapsed && (
          <div
            className="panel-resize-handle"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize files panel"
            onPointerDown={(e) => panels.beginResize("right", e)}
          />
        )}

        <FileTreePanel
          files={files}
          activeFilePath={activeTab === "report" ? null : activeTab}
          issueMeta={issueMeta}
          collapsed={panels.rightPanelCollapsed}
          width={panels.rightPanelWidth}
          onToggleCollapsed={() => panels.setRightPanelCollapsed((c) => !c)}
          onOpenFile={navigateToFile}
        />
      </div>
    </div>
  );
}
