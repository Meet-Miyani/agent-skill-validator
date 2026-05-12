import React, { type ChangeEvent, type DragEvent } from "react"
import { FileArchive, Layers3, Loader2, UploadCloud } from "lucide-react"

interface Props {
  loading: boolean
  loadingStatusText: string
  dragActive: boolean
  error: string | null
  darkMode: boolean
  onDragActiveChange: (active: boolean) => void
  onFilesSelected: (files: File[]) => void
  onDropFiles: (event: DragEvent<HTMLDivElement>) => void
}

export function UploadPanel({
  loading, loadingStatusText, dragActive, error, darkMode,
  onDragActiveChange, onFilesSelected, onDropFiles,
}: Props) {
  const handleBrowse = (event: ChangeEvent<HTMLInputElement>) => {
    onFilesSelected(Array.from(event.target.files ?? []))
    event.target.value = ""
  }

  const shell = darkMode
    ? "border-white/10 bg-white/5 shadow-2xl shadow-slate-950/40"
    : "border-slate-200 bg-white/80 shadow-2xl shadow-blue-950/10"
  const drop = dragActive
    ? darkMode
      ? "scale-[1.01] border-violet-400 bg-violet-400/10 shadow-lg"
      : "scale-[1.01] border-blue-500 bg-blue-50 shadow-lg"
    : darkMode
      ? "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10"
      : "border-slate-200 bg-slate-50/80 hover:border-blue-300 hover:bg-blue-50/60"

  return (
    <div className={`rounded-[1.75rem] border p-4 backdrop-blur-xl ${shell}`}>
      <div
        onDragOver={(e) => { e.preventDefault(); onDragActiveChange(true) }}
        onDragLeave={() => onDragActiveChange(false)}
        onDrop={(e) => { onDragActiveChange(false); onDropFiles(e) }}
        className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${drop}`}
      >
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg transition-transform duration-200 ${dragActive ? "-translate-y-1" : ""}`}>
          <UploadCloud className="h-7 w-7 text-white" />
        </div>

        <p className={`mt-4 text-lg font-bold ${darkMode ? "text-white" : "text-slate-950"}`}>
          Drop a ZIP, .skill, folder, or SKILL.md
        </p>
        <p className={`mx-auto mt-2 max-w-xs text-sm ${darkMode ? "text-white/50" : "text-slate-500"}`}>
          Validation runs entirely in your browser — nothing is uploaded to a server.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <label className="button-motion control-focus inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
            <FileArchive className="h-4 w-4" />
            Browse ZIP / files
            <input className="hidden" type="file" multiple onChange={handleBrowse} />
          </label>
          <label className={`button-motion control-focus inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold ${darkMode ? "border-white/20 bg-white/10 text-white hover:bg-white/[0.15]" : "border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50"}`}>
            <Layers3 className="h-4 w-4" />
            Browse folder
            <input className="hidden" type="file" multiple {...({ webkitdirectory: "true" } as any)} onChange={handleBrowse} />
          </label>
        </div>

        {loading && (
          <div className={`absolute inset-0 flex items-center justify-center rounded-2xl backdrop-blur-sm ${darkMode ? "bg-slate-950/80" : "bg-white/80"}`}>
            <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow ${darkMode ? "bg-white text-slate-900" : "bg-slate-950 text-white"}`}>
              <Loader2 className="h-4 w-4 animate-spin" /> {loadingStatusText}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${darkMode ? "border-red-400/30 bg-red-500/15 text-red-300" : "border-red-200 bg-red-50 text-red-700"}`}>
          {error}
        </p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold">
        {[["Private"], ["Instant"], ["Editable"]].map(([label]) => (
          <div key={label} className={`rounded-lg border py-2 ${darkMode ? "border-white/10 bg-white/5 text-white/60" : "border-slate-200 bg-white/75 text-slate-500"}`}>
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
