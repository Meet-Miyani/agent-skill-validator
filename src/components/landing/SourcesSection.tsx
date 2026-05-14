import React from "react"
import { ExternalLink, FileText } from "lucide-react"

interface SourceLinkProps { label: string; href: string; kind: string }

const SOURCES: SourceLinkProps[] = [
  { label: "OpenAI Codex skills", kind: "Official", href: "https://developers.openai.com/codex/skills" },
  { label: "Agent Skills specification", kind: "Spec", href: "https://agentskills.io/specification" },
  { label: "Agent Skills best practices", kind: "Official", href: "https://agentskills.io/skill-creation/best-practices" },
  { label: "Anthropic agent skills best practices", kind: "Official", href: "https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices" },
]

function SourceLink({ label, href, kind }: SourceLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="control-focus button-motion group flex items-center justify-between gap-4 rounded-2xl border border-zinc-900/10 bg-white/70 px-4 py-3 text-sm text-zinc-800 shadow-sm hover:border-zinc-900/25 hover:bg-white"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-lime-200"><FileText className="h-4 w-4" /></span>
        <span className="min-w-0">
          <span className="block truncate font-semibold">{label}</span>
          <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{kind}</span>
        </span>
      </span>
      <ExternalLink className="h-4 w-4 shrink-0 text-zinc-400 transition-colors group-hover:text-zinc-950" />
    </a>
  )
}

export function SourcesSection() {
  return (
    <section id="sources" className="scroll-mt-20 bg-[#fbf7ea] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1fr] lg:items-start">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Sources</p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.035em] text-zinc-950 sm:text-4xl">Grounded in public skill documentation.</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-zinc-600">Official references are surfaced in the report where they inform checks. Heuristic and internal parity checks are labeled separately.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {SOURCES.map((source) => <SourceLink key={source.href} {...source} />)}
        </div>
      </div>
    </section>
  )
}
