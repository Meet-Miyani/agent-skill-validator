import React, { type DragEvent } from "react"
import { ArrowRight, Github, Sparkles } from "lucide-react"
import { UploadPanel } from "./UploadPanel"

const GITHUB_URL = "https://github.com/Meet-Miyani/agent-skill-check"

function StatTile({ value, label, darkMode }: { value: string; label: string; darkMode: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 text-center shadow-sm backdrop-blur ${darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-white/75"}`}>
      <p className={`text-3xl font-black ${darkMode ? "text-white" : "text-slate-950"}`}>{value}</p>
      <p className={`mt-1 text-xs font-bold uppercase tracking-widest ${darkMode ? "text-white/40" : "text-slate-400"}`}>{label}</p>
    </div>
  )
}

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

export function HeroSection(props: Props) {
  const { darkMode } = props
  return (
    <section
      id="top"
      className={`relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24 ${darkMode ? "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" : "bg-[radial-gradient(circle_at_top_left,rgba(199,210,254,0.72),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]"}`}
    >
      <div className={`pointer-events-none absolute inset-0 ${darkMode ? "[background:radial-gradient(ellipse_80%_50%_at_50%_-10%,rgb(139,92,246,0.18),transparent)]" : "[background:radial-gradient(ellipse_70%_45%_at_68%_0%,rgb(59,130,246,0.14),transparent)]"}`} />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
        <div className="flex flex-col">
          <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${darkMode ? "border-violet-500/30 bg-violet-500/10 text-violet-300" : "border-blue-200 bg-white/70 text-blue-700 shadow-sm"}`}>
            <Sparkles className="h-3.5 w-3.5" />
            Browser-based · Zero server upload
          </div>

          <h1 className={`mt-6 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl ${darkMode ? "text-white" : "text-slate-950"}`}>
            Validate AI agent skills{" "}
            <span className={`${darkMode ? "bg-gradient-to-r from-violet-400 to-indigo-400" : "bg-gradient-to-r from-blue-700 to-violet-700"} bg-clip-text text-transparent`}>
              before you ship.
            </span>
          </h1>

          <p className={`mt-5 max-w-xl text-base leading-7 sm:text-lg ${darkMode ? "text-white/60" : "text-slate-600"}`}>
            Agent Skill Check reviews{" "}
            <code className={`rounded-md border px-1.5 py-0.5 text-sm font-bold ${darkMode ? "border-white/10 bg-white/10 text-violet-300" : "border-blue-100 bg-white text-blue-700"}`}>
              SKILL.md
            </code>{" "}
            packages against structure, description quality, token budget, security
            patterns, and export readiness — entirely in the browser.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#scan"
              className="button-motion control-focus inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
            >
              Scan a skill <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className={`button-motion control-focus inline-flex min-h-11 items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold ${darkMode ? "border-white/15 bg-white/[0.08] text-white hover:bg-white/[0.15]" : "border-slate-200 bg-white/80 text-slate-800 shadow-sm hover:bg-white"}`}
            >
              <Github className="h-4 w-4" /> View source
            </a>
          </div>

          <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
            <StatTile value="14" label="review sections" darkMode={darkMode} />
            <StatTile value="100" label="point score" darkMode={darkMode} />
            <StatTile value="0" label="server uploads" darkMode={darkMode} />
          </div>
        </div>

        <div id="scan" className="scroll-mt-24">
          <UploadPanel {...props} />
        </div>
      </div>
    </section>
  )
}
