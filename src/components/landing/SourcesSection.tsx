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
      className="panel-hover control-focus button-motion group flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface)] px-4 py-3 text-sm text-[color:var(--theme-text-primary)] shadow-sm"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="theme-icon-box flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"><FileText className="h-4 w-4" /></span>
        <span className="min-w-0">
          <span className="block truncate font-semibold">{label}</span>
          <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--theme-text-soft)]">{kind}</span>
        </span>
      </span>
      <ExternalLink className="h-4 w-4 shrink-0 text-[color:var(--theme-text-soft)] transition-colors group-hover:text-[color:var(--theme-text-primary)]" />
    </a>
  )
}

export function SourcesSection() {
  return (
    <section id="sources" className="scroll-mt-20 bg-[color:var(--theme-canvas)] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1fr] lg:items-start">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--theme-text-soft)]">Sources</p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.035em] text-[color:var(--theme-text-primary)] sm:text-4xl">Grounded in public agent skill guidance.</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-[color:var(--theme-text-muted)]">Official references are surfaced in the report where they inform checks. Heuristic and internal parity checks are labeled separately so the checker stays transparent.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {SOURCES.map((source) => <SourceLink key={source.href} {...source} />)}
        </div>
      </div>
    </section>
  )
}
