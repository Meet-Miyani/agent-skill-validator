import React, { type DragEvent } from "react"
import { FileSearch, Github, Moon, Star, Sun } from "lucide-react"
import { useGitHubStars, formatStars } from "../../hooks/useGitHubStars"
import { HeroSection } from "./HeroSection"
import { TrustBar, WhatGetsScanned, ChecksAndWorkflow } from "./FeaturesSection"
import { SourcesSection } from "./SourcesSection"

const GITHUB_URL = "https://github.com/Meet-Miyani/agent-skill-validator"
const GITHUB_API = "https://api.github.com/repos/Meet-Miyani/agent-skill-validator"

interface Props {
  loading: boolean
  loadingStatusText?: string
  dragActive: boolean
  error: string | null
  darkMode: boolean
  onToggleDarkMode: () => void
  onLoadSample: () => void
  onDragActiveChange: (active: boolean) => void
  onFilesSelected: (files: File[]) => void
  onDropFiles: (event: DragEvent<HTMLDivElement>) => void
}

export function UploadDropzone({
  loading, loadingStatusText = "Reading package...",
  dragActive, error, darkMode, onToggleDarkMode, onLoadSample,
  onDragActiveChange, onFilesSelected, onDropFiles,
}: Props) {
  const stars = useGitHubStars(GITHUB_API)

  return (
    <main className={`min-h-screen overflow-hidden antialiased ${darkMode ? "bg-zinc-950 text-zinc-100" : "bg-[#fbf7ea] text-zinc-900"}`}>
      <header className={`sticky top-0 z-30 border-b backdrop-blur-xl ${darkMode ? "border-white/10 bg-zinc-950/[0.86]" : "border-zinc-900/10 bg-[#fbf7ea]/[0.88]"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="#top" className="control-focus inline-flex items-center gap-3 rounded-2xl">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${darkMode ? "border-lime-200/20 bg-lime-200/10 text-lime-200" : "border-zinc-900 bg-zinc-950 text-lime-200"}`}>
              <FileSearch className="h-4 w-4" />
            </span>
            <span>
              <span className={`block text-sm font-semibold tracking-tight ${darkMode ? "text-white" : "text-zinc-950"}`}>SkillLint</span>
              <span className={`hidden text-xs sm:block ${darkMode ? "text-zinc-500" : "text-zinc-600"}`}>AI skill checker & agent skill validator</span>
            </span>
          </a>

          <nav className="hidden items-center gap-6 text-sm font-medium md:flex" aria-label="Landing page navigation">
            <a href="#scan" className={`${darkMode ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-zinc-950"}`}>Scan</a>
            <a href="#checks" className={`${darkMode ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-zinc-950"}`}>Checks</a>
            <a href="#sources" className={`${darkMode ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-zinc-950"}`}>Sources</a>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className={`control-focus button-motion inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${darkMode ? "border-white/15 bg-white/5 text-white hover:bg-white/10" : "border-zinc-900/10 bg-white/60 text-zinc-900 shadow-sm hover:bg-white"}`}
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${darkMode ? "bg-white/10 text-zinc-300" : "bg-[#eee7d6] text-zinc-600"}`}>
                <Star className="h-3 w-3 fill-current" />
                {stars === null ? "Star" : formatStars(stars)}
              </span>
            </a>
            <button
              onClick={onToggleDarkMode}
              className={`control-focus button-motion inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${darkMode ? "border-white/15 bg-white/5 text-white hover:bg-white/10" : "border-zinc-900/10 bg-white/60 text-zinc-900 shadow-sm hover:bg-white"}`}
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
        onLoadSample={onLoadSample}
        onDragActiveChange={onDragActiveChange}
        onFilesSelected={onFilesSelected}
        onDropFiles={onDropFiles}
      />
      <TrustBar />
      <WhatGetsScanned />
      <ChecksAndWorkflow />
      <SourcesSection />

      <footer className={`border-t ${darkMode ? "border-white/10 bg-zinc-950" : "border-zinc-900/10 bg-[#fbf7ea]"}`}>
        <div className={`mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 ${darkMode ? "text-zinc-500" : "text-zinc-600"}`}>
          <p>Independent browser-based validator for AI agent skills.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span>Local browser validation</span>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className={`control-focus inline-flex items-center gap-2 rounded-lg font-semibold ${darkMode ? "text-zinc-400 hover:text-lime-200" : "text-zinc-700 hover:text-zinc-950"}`}
            >
              <Github className="h-4 w-4" /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
