import React from "react"
import { ExternalLink, FileText } from "lucide-react"

interface SourceLinkProps { label: string; href: string; kind: string; darkMode?: boolean }

const SOURCES: SourceLinkProps[] = [
  { label: "OpenAI Codex skills", kind: "Official", href: "https://developers.openai.com/codex/skills" },
  { label: "Agent Skills specification", kind: "Spec", href: "https://agentskills.io/specification" },
  { label: "Agent Skills best practices", kind: "Official", href: "https://agentskills.io/skill-creation/best-practices" },
  { label: "Anthropic agent skills best practices", kind: "Official", href: "https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices" },
]

function SourceLink({ label, href, kind, darkMode = false }: SourceLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`control-focus button-motion group flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-sm shadow-sm ${darkMode ? "border-white/10 bg-zinc-900/75 text-zinc-100 hover:border-white/20 hover:bg-zinc-900" : "border-zinc-900/10 bg-white/70 text-zinc-800 hover:border-zinc-900/25 hover:bg-white"}`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${darkMode ? "bg-lime-200/10 text-lime-200" : "bg-zinc-950 text-lime-200"}`}><FileText className="h-4 w-4" /></span>
        <span className="min-w-0">
          <span className="block truncate font-semibold">{label}</span>
          <span className={`mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.14em] ${darkMode ? "text-zinc-500" : "text-zinc-400"}`}>{kind}</span>
        </span>
      </span>
      <ExternalLink className={`h-4 w-4 shrink-0 transition-colors ${darkMode ? "text-zinc-500 group-hover:text-white" : "text-zinc-400 group-hover:text-zinc-950"}`} />
    </a>
  )
}

export function SourcesSection({ darkMode = false }: { darkMode?: boolean }) {
  return (
    <section id="sources" className={`scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8 ${darkMode ? "bg-zinc-950" : "bg-[#fbf7ea]"}`}>
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1fr] lg:items-start">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${darkMode ? "text-lime-200/70" : "text-zinc-500"}`}>Sources</p>
          <h2 className={`mt-3 max-w-xl text-3xl font-semibold tracking-[-0.035em] sm:text-4xl ${darkMode ? "text-white" : "text-zinc-950"}`}>Grounded in public agent skill guidance.</h2>
          <p className={`mt-4 max-w-xl text-base leading-7 ${darkMode ? "text-zinc-300" : "text-zinc-600"}`}>Official references are surfaced in the report where they inform checks. Heuristic and internal parity checks are labeled separately so the checker stays transparent.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {SOURCES.map((source) => <SourceLink key={source.href} {...source} darkMode={darkMode} />)}
        </div>
      </div>
    </section>
  )
}
