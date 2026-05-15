import React, { type ChangeEvent, type DragEvent, type InputHTMLAttributes } from "react"
import { FileArchive, FolderOpen, Loader2, LockKeyhole, ScanLine, UploadCloud } from "lucide-react"

interface Props {
  busy: boolean
  busyStatusText: string
  dragActive: boolean
  error: string | null
  onDragActiveChange: (active: boolean) => void
  onFilesSelected: (files: File[]) => void
  onDropFiles: (event: DragEvent<HTMLDivElement>) => void
}

const ACCEPTED_FORMATS = ["ZIP", ".skill", "folder", "SKILL.md"]
const directoryInputProps = { webkitdirectory: "true" } satisfies InputHTMLAttributes<HTMLInputElement> & { webkitdirectory: string }

export function UploadPanel({
  busy, busyStatusText, dragActive, error,
  onDragActiveChange, onFilesSelected, onDropFiles,
}: Props) {
  const handleBrowse = (event: ChangeEvent<HTMLInputElement>) => {
    onFilesSelected(Array.from(event.target.files ?? []))
    event.target.value = ""
  }

  const drop = dragActive
    ? "border-[color:var(--theme-nav-active-border)] bg-[color:var(--theme-accent-soft)] ring-4 ring-[color:var(--theme-accent-soft)]"
    : "border-[color:var(--theme-secondary-action-border)] bg-[color:var(--theme-surface-soft)] hover:border-[color:var(--theme-border-strong)] hover:bg-[color:var(--theme-surface)]"

  return (
    <aside
      className="relative rounded-[28px] border border-[color:var(--theme-border)] bg-[color:var(--theme-surface)] p-3 shadow-2xl shadow-black/10 backdrop-blur-xl dark:shadow-black/30"
      aria-busy={busy}
      aria-label="AI agent skill upload"
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

      <div className="flex items-center justify-between gap-4 px-2 pb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--theme-text-soft)]">Local skill audit</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-[color:var(--theme-text-primary)]">Drop an AI agent skill.</h2>
        </div>
        <div className="theme-icon-box flex h-10 w-10 items-center justify-center rounded-2xl border">
          <ScanLine className="h-5 w-5" />
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); onDragActiveChange(true) }}
        onDragLeave={() => onDragActiveChange(false)}
        onDrop={(e) => { onDragActiveChange(false); onDropFiles(e) }}
        aria-busy={busy}
        className={`relative overflow-hidden rounded-[22px] border border-dashed px-6 py-8 text-center transition-all duration-200 ${drop}`}
      >
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: "var(--theme-upload-spotlight)" }} />
        <div className="relative">
          <div className={`theme-icon-box mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border shadow-lg transition-transform duration-200 ${dragActive ? "-translate-y-1 rotate-2" : ""}`}>
            <UploadCloud className="h-8 w-8" />
          </div>

          <p className="mt-5 text-xl font-semibold tracking-tight text-[color:var(--theme-text-primary)]">Check skill</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[color:var(--theme-text-muted)]">Supports folders, ZIP archives, .skill bundles, and standalone SKILL.md files.</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <label className="theme-primary-button control-focus button-motion inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold">
              <FileArchive className="h-4 w-4" />
              Browse ZIP / files
              <input className="hidden" type="file" multiple onChange={handleBrowse} disabled={busy} />
            </label>
            <label className="theme-secondary-button control-focus button-motion inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold">
              <FolderOpen className="h-4 w-4" />
              Browse folder
              <input className="hidden" type="file" multiple {...directoryInputProps} onChange={handleBrowse} disabled={busy} />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {ACCEPTED_FORMATS.map((format) => (
              <span key={format} className="theme-chip rounded-full border px-2.5 py-1 text-xs font-medium">{format}</span>
            ))}
          </div>
        </div>

        {busy && (
          <div className="absolute inset-0 flex items-center justify-center rounded-[22px] bg-[color:var(--theme-surface-overlay)] px-6 backdrop-blur-md">
            <div
              role="status"
              aria-live="polite"
              className="w-full max-w-xs rounded-[24px] border border-white/20 bg-[color:var(--theme-surface)]/95 px-5 py-4 text-left shadow-2xl"
            >
              <div className="theme-primary-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg">
                <Loader2 className="h-4 w-4 animate-spin" /> {busyStatusText}
              </div>
              <p className="mt-3 text-sm leading-6 text-[color:var(--theme-text-muted)]">
                Everything stays local while SkillLint reads your files and prepares the report.
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-300/25 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </p>
      )}

      <div className="mt-3 flex items-start gap-3 rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-muted)] px-4 py-3 text-[color:var(--theme-text-muted)]">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--theme-icon-muted-fg)]" />
        <p className="text-xs leading-5"><span className="font-semibold">No upload endpoint.</span> Files are parsed locally, checked locally, edited locally, and exported from memory.</p>
      </div>
    </aside>
  )
}
