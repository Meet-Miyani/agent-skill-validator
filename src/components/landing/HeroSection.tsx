import React, { type DragEvent } from "react"
import { ArrowRight, Braces, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react"
import { UploadPanel } from "./UploadPanel"

function SpecPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="theme-chip rounded-full border px-3 py-1 text-xs font-medium">{children}</span>
  )
}

function ProofRow({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="flex gap-3">
      <div className="theme-icon-box mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-[color:var(--theme-text-primary)]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[color:var(--theme-text-muted)]">{detail}</p>
      </div>
    </div>
  )
}

interface Props {
  loading: boolean
  loadingStatusText: string
  dragActive: boolean
  error: string | null
  onLoadSample: () => void
  onDragActiveChange: (active: boolean) => void
  onFilesSelected: (files: File[]) => void
  onDropFiles: (event: DragEvent<HTMLDivElement>) => void
}

export function HeroSection(props: Props) {
  return (
    <section id="top" className="theme-hero-shell relative isolate overflow-hidden px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-20">
      <div className="theme-grid-overlay pointer-events-none absolute inset-0 -z-10" />
      <div className="pointer-events-none absolute left-[8%] top-20 -z-10 h-72 w-72 rounded-full bg-[color:var(--theme-glow-lime)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 -z-10 h-[28rem] w-[28rem] rounded-full bg-[color:var(--theme-glow-amber)] blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.02fr_0.82fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="theme-icon-box inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> Browser-based agent skill audit
            </span>
            <SpecPill>Local-first</SpecPill>
            <SpecPill>Guideline-aware</SpecPill>
          </div>

          <h1 className="mt-8 max-w-4xl text-[clamp(3rem,8vw,6.8rem)] font-normal leading-[0.92] tracking-[-0.055em] text-[color:var(--theme-text-primary)]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Check AI agent skills before they ship.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[color:var(--theme-text-muted)]">
            SkillLint checks AI agent skills from folders, ZIP archives, .skill bundles, and <code className="theme-code-chip rounded-md border px-1.5 py-0.5 text-[0.9em] font-semibold">SKILL.md</code> files - then turns structure, script, reference, link, asset, and token issues into a clean report you can act on.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#scan"
              className="theme-primary-button control-focus button-motion inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              Check skill <ArrowRight className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={props.onLoadSample}
              className="theme-secondary-button control-focus button-motion inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold"
            >
              <CheckCircle2 className="h-4 w-4" /> View sample report
            </button>
          </div>

          <div className="mt-10 grid max-w-3xl gap-4 rounded-[28px] border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-ghost)] p-4 backdrop-blur sm:grid-cols-3">
            <ProofRow icon={<CheckCircle2 className="h-4 w-4" />} title="90 checks" detail="Grouped into readable audit sections instead of raw validator noise." />
            <ProofRow icon={<Braces className="h-4 w-4" />} title="Editable report" detail="Open files, apply supported fixes, auto-link references, and export a repaired ZIP." />
            <ProofRow icon={<ShieldCheck className="h-4 w-4" />} title="No upload step" detail="Folders, ZIPs, and .skill bundles stay inside the browser session." />
          </div>
        </div>

        <div id="scan" className="scroll-mt-24 lg:pl-2">
          <UploadPanel {...props} />
        </div>
      </div>
    </section>
  )
}
