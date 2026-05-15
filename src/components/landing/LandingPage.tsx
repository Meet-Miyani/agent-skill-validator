import React, { type DragEvent } from "react"
import { FileSearch, Github, Moon, Star, Sun } from "lucide-react"
import { useGitHubStars, formatStars } from "../../hooks/useGitHubStars"
import { HeroSection } from "./HeroSection"
import { TrustBar, WhatGetsScanned, ChecksAndWorkflow } from "./FeaturesSection"
import { SourcesSection } from "./SourcesSection"

const DEFAULT_GITHUB_REPO = "Meet-Miyani/agent-skill-validator"
const GITHUB_REPO = (import.meta.env.VITE_GITHUB_REPO || DEFAULT_GITHUB_REPO).replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "")
const GITHUB_URL = `https://github.com/${GITHUB_REPO}`
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}`
const GITHUB_OWNER = GITHUB_REPO.split("/")[0] || "Meet-Miyani"
const GITHUB_OWNER_URL = `https://github.com/${GITHUB_OWNER}`

interface Props {
  busy: boolean
  busyStatusText?: string
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
  busy, busyStatusText = "Reading package...",
  dragActive, error, darkMode, onToggleDarkMode, onLoadSample,
  onDragActiveChange, onFilesSelected, onDropFiles,
}: Props) {
  const stars = useGitHubStars(GITHUB_API)

  return (
    <main className="min-h-screen overflow-hidden bg-[color:var(--theme-canvas)] text-[color:var(--theme-text-primary)] antialiased">
      <header className="theme-topbar sticky top-0 z-30 border-b backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="#top" className="control-focus inline-flex items-center gap-3 rounded-2xl">
            <span className="theme-icon-box flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border">
              <FileSearch className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight text-[color:var(--theme-text-primary)]">SkillLint</span>
              <span className="hidden text-xs text-[color:var(--theme-text-muted)] sm:block">AI skill checker & agent skill validator</span>
            </span>
          </a>

          <nav className="hidden items-center gap-6 text-sm font-medium md:flex" aria-label="Landing page navigation">
            <a href="#scan" className="theme-nav-item rounded-lg px-2 py-1">Scan</a>
            <a href="#checks" className="theme-nav-item rounded-lg px-2 py-1">Checks</a>
            <a href="#sources" className="theme-nav-item rounded-lg px-2 py-1">Sources</a>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="theme-secondary-button control-focus button-motion inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
              <span className="theme-chip inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold">
                <Star className="h-3 w-3 fill-current" />
                {stars === null ? "Star" : formatStars(stars)}
              </span>
            </a>
            <button
              onClick={onToggleDarkMode}
              className="theme-secondary-button control-focus button-motion inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="hidden sm:inline">{darkMode ? "Light" : "Dark"}</span>
            </button>
          </div>
        </div>
      </header>

      <HeroSection
        busy={busy}
        busyStatusText={busyStatusText}
        dragActive={dragActive}
        error={error}
        onLoadSample={onLoadSample}
        onDragActiveChange={onDragActiveChange}
        onFilesSelected={onFilesSelected}
        onDropFiles={onDropFiles}
      />
      <TrustBar />
      <WhatGetsScanned />
      <ChecksAndWorkflow />
      <SourcesSection />

      <footer className="border-t border-[color:var(--theme-border)] bg-[color:var(--theme-canvas)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-[color:var(--theme-text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            Made by{" "}
            <a
              href={GITHUB_OWNER_URL}
              target="_blank"
              rel="noreferrer"
              className="control-focus rounded-md font-semibold text-[color:var(--theme-text-primary)] hover:text-[color:var(--theme-accent)]"
            >
              Meet Miyani
            </a>
            {" "}for AI agent skill authors.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <span>Local browser validation</span>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="control-focus inline-flex items-center gap-2 rounded-lg font-semibold text-[color:var(--theme-text-muted)] hover:text-[color:var(--theme-text-primary)]"
            >
              <Github className="h-4 w-4" /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
