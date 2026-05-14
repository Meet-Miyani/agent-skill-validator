import React, { type DragEvent } from "react"
import { ArrowRight, Braces, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react"
import { UploadPanel } from "./UploadPanel"

function SpecPill({ children, darkMode }: { children: React.ReactNode; darkMode: boolean }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${darkMode ? "border-white/10 bg-white/5 text-zinc-300" : "border-zinc-900/10 bg-[#f4ecd6] text-zinc-700"}`}>{children}</span>
  )
}

function ProofRow({ icon, title, detail, darkMode }: { icon: React.ReactNode; title: string; detail: string; darkMode: boolean }) {
  return (
    <div className="flex gap-3">
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${darkMode ? "border-lime-200/20 bg-lime-200/10 text-lime-200" : "border-zinc-900/10 bg-zinc-950 text-lime-200"}`}>{icon}</div>
      <div>
        <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-zinc-950"}`}>{title}</p>
        <p className={`mt-1 text-sm leading-6 ${darkMode ? "text-zinc-400" : "text-zinc-600"}`}>{detail}</p>
      </div>
    </div>
  )
}

interface Props {
  loading: boolean
  loadingStatusText: string
  dragActive: boolean
  error: string | null
  darkMode: boolean
  onLoadSample: () => void
  onDragActiveChange: (active: boolean) => void
  onFilesSelected: (files: File[]) => void
  onDropFiles: (event: DragEvent<HTMLDivElement>) => void
}

export function HeroSection(props: Props) {
  const { darkMode } = props
  return (
    <section
      id="top"
      className={`relative isolate overflow-hidden px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-20 ${darkMode ? "bg-[linear-gradient(135deg,#09090b_0%,#111827_58%,#1f2a1c_100%)]" : "bg-[#fbf7ea]"}`}
    >
      <div className={`pointer-events-none absolute inset-0 -z-10 ${darkMode ? "bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" : "bg-[linear-gradient(rgba(24,24,27,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(24,24,27,0.055)_1px,transparent_1px)] bg-[size:44px_44px]"}`} />
      <div className={`pointer-events-none absolute left-[8%] top-20 -z-10 h-72 w-72 rounded-full blur-3xl ${darkMode ? "bg-lime-300/10" : "bg-lime-300/30"}`} />
      <div className={`pointer-events-none absolute bottom-0 right-0 -z-10 h-[28rem] w-[28rem] rounded-full blur-3xl ${darkMode ? "bg-amber-300/[0.08]" : "bg-amber-300/30"}`} />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.02fr_0.82fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] ${darkMode ? "border-lime-200/20 bg-lime-200/10 text-lime-100" : "border-zinc-900 bg-zinc-950 text-lime-200 shadow-sm"}`}>
              <Sparkles className="h-3.5 w-3.5" /> Browser-based agent skill audit
            </span>
            <SpecPill darkMode={darkMode}>Local-first</SpecPill>
            <SpecPill darkMode={darkMode}>Guideline-aware</SpecPill>
          </div>

          <h1 className={`mt-8 max-w-4xl text-[clamp(3rem,8vw,6.8rem)] font-normal leading-[0.92] tracking-[-0.055em] ${darkMode ? "text-white" : "text-zinc-950"}`} style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Check AI agent skills before they ship.
          </h1>

          <p className={`mt-6 max-w-2xl text-lg leading-8 ${darkMode ? "text-zinc-300" : "text-zinc-700"}`}>
            SkillLint checks AI agent skills from folders, ZIP archives, .skill bundles, and <code className={`rounded-md border px-1.5 py-0.5 text-[0.9em] font-semibold ${darkMode ? "border-white/10 bg-white/5 text-lime-200" : "border-zinc-900/10 bg-white/70 text-zinc-950"}`}>SKILL.md</code> files - then turns structure, script, reference, link, asset, and token issues into a clean report you can act on.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#scan"
              className={`control-focus button-motion inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold ${darkMode ? "bg-lime-200 text-zinc-950 hover:bg-lime-100" : "bg-zinc-950 text-white hover:bg-zinc-800"}`}
            >
              Check skill <ArrowRight className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={props.onLoadSample}
              className={`control-focus button-motion inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold ${darkMode ? "border-white/15 bg-white/5 text-white hover:bg-white/10" : "border-zinc-900/15 bg-white/65 text-zinc-900 hover:bg-white"}`}
            >
              <CheckCircle2 className="h-4 w-4" /> View sample report
            </button>
          </div>

          <div className={`mt-10 grid max-w-3xl gap-4 rounded-[28px] border p-4 backdrop-blur ${darkMode ? "border-white/10 bg-black/20" : "border-zinc-900/10 bg-white/45"} sm:grid-cols-3`}>
            <ProofRow icon={<CheckCircle2 className="h-4 w-4" />} title="90 checks" detail="Grouped into readable audit sections instead of raw validator noise." darkMode={darkMode} />
            <ProofRow icon={<Braces className="h-4 w-4" />} title="Editable report" detail="Open files, apply supported fixes, auto-link references, and export a repaired ZIP." darkMode={darkMode} />
            <ProofRow icon={<ShieldCheck className="h-4 w-4" />} title="No upload step" detail="Folders, ZIPs, and .skill bundles stay inside the browser session." darkMode={darkMode} />
          </div>
        </div>

        <div id="scan" className="scroll-mt-24 lg:pl-2">
          <UploadPanel {...props} />
        </div>
      </div>
    </section>
  )
}
