import React, { type ChangeEvent, type DragEvent } from "react"
import { FileArchive, FolderOpen, Loader2, LockKeyhole, ScanLine, UploadCloud } from "lucide-react"

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

const ACCEPTED_FORMATS = ["ZIP", ".skill", "folder", "SKILL.md"]

export function UploadPanel({
  loading, loadingStatusText, dragActive, error, darkMode,
  onDragActiveChange, onFilesSelected, onDropFiles,
}: Props) {
  const handleBrowse = (event: ChangeEvent<HTMLInputElement>) => {
    onFilesSelected(Array.from(event.target.files ?? []))
    event.target.value = ""
  }

  const shell = darkMode
    ? "border-white/10 bg-zinc-950/80 shadow-2xl shadow-black/30"
    : "border-zinc-900/10 bg-[#fffdf6]/[0.92] shadow-2xl shadow-zinc-900/10"
  const drop = dragActive
    ? darkMode
      ? "border-lime-300 bg-lime-300/10 ring-4 ring-lime-300/10"
      : "border-lime-600 bg-lime-100/70 ring-4 ring-lime-300/40"
    : darkMode
      ? "border-white/15 bg-white/[0.03] hover:border-lime-300/50 hover:bg-lime-300/[0.05]"
      : "border-zinc-900/15 bg-white/70 hover:border-zinc-900/35 hover:bg-white"

  return (
    <aside className={`relative rounded-[28px] border p-3 backdrop-blur-xl ${shell}`} aria-label="AI agent skill upload">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

      <div className="flex items-center justify-between gap-4 px-2 pb-3">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${darkMode ? "text-lime-200/70" : "text-zinc-500"}`}>Local skill audit</p>
          <h2 className={`mt-1 text-lg font-semibold tracking-tight ${darkMode ? "text-white" : "text-zinc-950"}`}>Drop an AI agent skill.</h2>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${darkMode ? "border-white/10 bg-white/5 text-lime-200" : "border-zinc-900/10 bg-zinc-950 text-lime-200"}`}>
          <ScanLine className="h-5 w-5" />
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); onDragActiveChange(true) }}
        onDragLeave={() => onDragActiveChange(false)}
        onDrop={(e) => { onDragActiveChange(false); onDropFiles(e) }}
        className={`relative overflow-hidden rounded-[22px] border border-dashed px-6 py-8 text-center transition-all duration-200 ${drop}`}
      >
        <div className={`pointer-events-none absolute inset-0 opacity-60 ${darkMode ? "bg-[radial-gradient(circle_at_50%_0%,rgba(190,242,100,0.12),transparent_46%)]" : "bg-[radial-gradient(circle_at_50%_0%,rgba(132,204,22,0.18),transparent_48%)]"}`} />
        <div className="relative">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border transition-transform duration-200 ${dragActive ? "-translate-y-1 rotate-2" : ""} ${darkMode ? "border-lime-200/20 bg-lime-200/10 text-lime-200" : "border-zinc-900/10 bg-zinc-950 text-lime-200 shadow-lg shadow-zinc-900/10"}`}>
            <UploadCloud className="h-8 w-8" />
          </div>

          <p className={`mt-5 text-xl font-semibold tracking-tight ${darkMode ? "text-white" : "text-zinc-950"}`}>Check skill</p>
          <p className={`mx-auto mt-2 max-w-sm text-sm leading-6 ${darkMode ? "text-zinc-400" : "text-zinc-600"}`}>Supports folders, ZIP archives, .skill bundles, and standalone SKILL.md files.</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <label className={`control-focus button-motion inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold ${darkMode ? "bg-lime-200 text-zinc-950 hover:bg-lime-100" : "bg-zinc-950 text-white hover:bg-zinc-800"}`}>
              <FileArchive className="h-4 w-4" />
              Browse ZIP / files
              <input className="hidden" type="file" multiple onChange={handleBrowse} />
            </label>
            <label className={`control-focus button-motion inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold ${darkMode ? "border-white/15 bg-white/5 text-white hover:bg-white/10" : "border-zinc-900/15 bg-white/75 text-zinc-900 hover:bg-white"}`}>
              <FolderOpen className="h-4 w-4" />
              Browse folder
              <input className="hidden" type="file" multiple {...({ webkitdirectory: "true" } as any)} onChange={handleBrowse} />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {ACCEPTED_FORMATS.map((format) => (
              <span key={format} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${darkMode ? "border-white/10 bg-white/5 text-zinc-300" : "border-zinc-900/10 bg-[#f7f1df] text-zinc-600"}`}>{format}</span>
            ))}
          </div>
        </div>

        {loading && (
          <div className={`absolute inset-0 flex items-center justify-center rounded-[22px] backdrop-blur-sm ${darkMode ? "bg-zinc-950/[0.82]" : "bg-[#fffdf6]/[0.85]"}`}>
            <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${darkMode ? "bg-lime-200 text-zinc-950" : "bg-zinc-950 text-white"}`}>
              <Loader2 className="h-4 w-4 animate-spin" /> {loadingStatusText}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-medium ${darkMode ? "border-red-300/25 bg-red-500/10 text-red-200" : "border-red-200 bg-red-50 text-red-700"}`}>
          {error}
        </p>
      )}

      <div className={`mt-3 flex items-start gap-3 rounded-2xl border px-4 py-3 ${darkMode ? "border-white/10 bg-white/[0.03] text-zinc-400" : "border-zinc-900/10 bg-[#f9f4e7] text-zinc-600"}`}>
        <LockKeyhole className={`mt-0.5 h-4 w-4 shrink-0 ${darkMode ? "text-lime-200" : "text-zinc-900"}`} />
        <p className="text-xs leading-5"><span className="font-semibold">No upload endpoint.</span> Files are parsed locally, checked locally, edited locally, and exported from memory.</p>
      </div>
    </aside>
  )
}
