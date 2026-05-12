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
    <div className="flex h-12 shrink-0 items-end gap-1 overflow-x-auto border-b border-slate-200/80 bg-white/60 px-3 pt-2 backdrop-blur-xl">
      <button
        onClick={() => onSelectTab("report")}
        className={`button-motion control-focus flex h-10 shrink-0 items-center gap-2 rounded-t-xl border px-4 text-sm font-bold ${activeTab === "report" ? "border-slate-200 border-b-white bg-white text-blue-700 shadow-sm" : "border-transparent text-slate-600 hover:bg-white/80"}`}
      >
        <BarChart3 className="h-4 w-4" /> Report
        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-600">Pinned</span>
      </button>

      {openFileTabs.map((path) => {
        const file = fileMap.get(path)
        const active = activeTab === path
        return (
          <div
            key={path}
            className={`group flex h-10 min-w-[140px] max-w-[240px] shrink-0 items-center overflow-hidden rounded-t-xl border ${active ? "border-slate-200 border-b-white bg-white text-blue-700 shadow-sm" : "border-transparent text-slate-600 hover:bg-white/80"}`}
            title={path}
          >
            <button
              onClick={() => onSelectTab(path)}
              className="control-focus flex h-full min-w-0 flex-1 items-center gap-2 px-3 text-left text-sm font-semibold"
            >
              <span className="truncate">{shortFileName(path)}</span>
              {file?.dirty && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" title="Modified" />}
            </button>
            <button
              onClick={() => onCloseFile(path)}
              className="control-focus mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
              aria-label={`Close ${path}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
