import React from "react"
import { BarChart3, X } from "lucide-react"
import type { EditableSkillFile } from "../domain/files"
import { shortFileName } from "../domain/files"

export type WorkspaceTab = "report" | string

export function WorkspaceTabs({
  files,
  openFileTabs,
  activeTab,
  onSelectTab,
  onCloseFile,
}: {
  files: EditableSkillFile[]
  openFileTabs: string[]
  activeTab: WorkspaceTab
  onSelectTab: (tab: WorkspaceTab) => void
  onCloseFile: (path: string) => void
}) {
  const fileMap = new Map(files.map((file) => [file.path, file]))
  return (
    <div className="flex h-10 shrink-0 items-end gap-1 overflow-x-auto border-b border-zinc-200 bg-white/65 px-2 pt-1.5 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/45">
      <button
        onClick={() => onSelectTab("report")}
        className={`button-motion control-focus flex h-8 shrink-0 items-center gap-1.5 rounded-t-lg border px-3 text-[13px] font-medium ${activeTab === "report" ? "border-zinc-200 border-b-white bg-white text-zinc-950 shadow-sm dark:border-zinc-800 dark:border-b-zinc-950 dark:bg-lime-200 dark:text-zinc-950" : "border-transparent text-zinc-500 hover:bg-white/80 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"}`}
      >
        <BarChart3 className="h-3.5 w-3.5" /> Report
      </button>

      {openFileTabs.map((path) => {
        const file = fileMap.get(path)
        const active = activeTab === path
        return (
          <div
            key={path}
            className={`group flex h-8 min-w-[118px] max-w-[220px] shrink-0 items-center overflow-hidden rounded-t-lg border ${active ? "border-zinc-200 border-b-white bg-white text-zinc-950 shadow-sm dark:border-zinc-800 dark:border-b-zinc-950 dark:bg-lime-200 dark:text-zinc-950" : "border-transparent text-zinc-500 hover:bg-white/80 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"}`}
            title={path}
          >
            <button
              onClick={() => onSelectTab(path)}
              className="control-focus flex h-full min-w-0 flex-1 items-center gap-1.5 px-2.5 text-left text-[13px] font-medium"
            >
              <span className="truncate">{shortFileName(path)}</span>
              {file?.dirty && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" title="Modified" />}
            </button>
            <button
              onClick={() => onCloseFile(path)}
              className="control-focus mr-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              aria-label={`Close ${path}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
