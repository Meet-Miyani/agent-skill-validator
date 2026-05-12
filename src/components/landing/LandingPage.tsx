import React, { type DragEvent } from "react"
import { FileSearch, Github, Moon, Star, Sun } from "lucide-react"
import { useGitHubStars, formatStars } from "../../hooks/useGitHubStars"
import { HeroSection } from "./HeroSection"
import { TrustBar, WhatGetsScanned, ChecksAndWorkflow } from "./FeaturesSection"
import { SourcesSection } from "./SourcesSection"

const GITHUB_URL = "https://github.com/Meet-Miyani/agent-skill-check"
const GITHUB_API = "https://api.github.com/repos/Meet-Miyani/agent-skill-check"

interface Props {
  loading: boolean
  loadingStatusText?: string
  dragActive: boolean
  error: string | null
  darkMode: boolean
  onToggleDarkMode: () => void
  onDragActiveChange: (active: boolean) => void
  onFilesSelected: (files: File[]) => void
  onDropFiles: (event: DragEvent<HTMLDivElement>) => void
}

export function UploadDropzone({
  loading, loadingStatusText = "Reading package…",
  dragActive, error, darkMode, onToggleDarkMode,
  onDragActiveChange, onFilesSelected, onDropFiles,
}: Props) {
  const stars = useGitHubStars(GITHUB_API)

  return (
    <main className={`min-h-screen overflow-hidden ${darkMode ? "bg-slate-950 text-slate-100" : "bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_38%,#f8fafc_100%)] text-slate-900"}`}>
      <header className={`sticky top-0 z-30 border-b backdrop-blur-xl ${darkMode ? "border-white/10 bg-slate-950/90" : "border-slate-200/80 bg-white/80"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="#top" className="control-focus inline-flex items-center gap-3 rounded-xl">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/20">
              <FileSearch className="h-4 w-4" />
            </span>
            <span>
              <span className={`block text-sm font-black ${darkMode ? "text-white" : "text-slate-950"}`}>Agent Skill Check</span>
              <span className={`hidden text-xs font-semibold sm:block ${darkMode ? "text-white/40" : "text-slate-500"}`}>Open-source SKILL.md validator</span>
            </span>
          </a>

          <div className="hidden items-center gap-5 text-sm font-bold md:flex">
            <a href="#scan" className={`${darkMode ? "text-white/60 hover:text-white" : "text-slate-500 hover:text-slate-950"}`}>Scan</a>
            <a href="#checks" className={`${darkMode ? "text-white/60 hover:text-white" : "text-slate-500 hover:text-slate-950"}`}>Checks</a>
            <a href="#sources" className={`${darkMode ? "text-white/60 hover:text-white" : "text-slate-500 hover:text-slate-950"}`}>Sources</a>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className={`button-motion control-focus inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-bold ${darkMode ? "border-white/15 bg-white/10 text-white hover:bg-white/[0.15]" : "border-slate-200 bg-white/80 text-slate-800 shadow-sm hover:bg-white"}`}
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-black ${darkMode ? "bg-white/10 text-white/70" : "bg-slate-100 text-slate-600"}`}>
                <Star className="h-3 w-3 fill-current" />
                {stars === null ? "Star" : formatStars(stars)}
              </span>
            </a>
            <button
              onClick={onToggleDarkMode}
              className={`button-motion control-focus inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-bold ${darkMode ? "border-white/15 bg-white/10 text-white hover:bg-white/[0.15]" : "border-slate-200 bg-white/80 text-slate-800 shadow-sm hover:bg-white"}`}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="hidden sm:inline">{darkMode ? "Light" : "Dark"}</span>
            </button>
          </div>
        </div>
      </header>

      <HeroSection
        loading={loading}
        loadingStatusText={loadingStatusText}
        dragActive={dragActive}
        error={error}
        darkMode={darkMode}
        onDragActiveChange={onDragActiveChange}
        onFilesSelected={onFilesSelected}
        onDropFiles={onDropFiles}
      />
      <TrustBar />
      <WhatGetsScanned />
      <ChecksAndWorkflow />
      <SourcesSection />

      <footer className={`border-t ${darkMode ? "border-white/10 bg-slate-950" : "border-slate-200 bg-white/70"}`}>
        <div className={`mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 ${darkMode ? "text-white/40" : "text-slate-500"}`}>
          <p className={`font-semibold ${darkMode ? "text-white/60" : "text-slate-600"}`}>Made by Meet Miyani for open-source agent skill authors.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span>Local browser validation</span>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className={`control-focus inline-flex items-center gap-2 rounded-lg font-bold ${darkMode ? "text-white/60 hover:text-violet-400" : "text-slate-600 hover:text-blue-700"}`}
            >
              <Github className="h-4 w-4" /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
