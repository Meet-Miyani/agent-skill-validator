import React from "react"
import { BookOpenCheck, ExternalLink } from "lucide-react"

interface SourceLinkProps { label: string; href: string; kind: string }

/** External documentation reference link. */
function SourceLink({ label, href, kind }: SourceLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="button-motion control-focus group flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50"
    >
      <span className="min-w-0">
        <span className="block truncate">{label}</span>
        <span className="mt-0.5 block text-xs font-bold uppercase tracking-wide text-slate-400">{kind}</span>
      </span>
      <ExternalLink className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-violet-600" />
    </a>
  )
}

const SOURCES: SourceLinkProps[] = [
  { label: "OpenAI Codex skills", kind: "Official", href: "https://developers.openai.com/codex/skills" },
  { label: "Agent Skills specification", kind: "Spec", href: "https://agentskills.io/specification" },
  { label: "Agent Skills best practices", kind: "Official", href: "https://agentskills.io/skill-creation/best-practices" },
  { label: "Anthropic agent skills best practices", kind: "Official", href: "https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices" },
]

/** "Sources" section — links to official skill documentation. */
export function SourcesSection() {
  return (
    <section id="sources" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-black uppercase tracking-widest text-violet-600">Sources</p>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          Grounded in public skill documentation.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Official references are surfaced in the report where they inform checks. Heuristic and internal parity checks are labeled separately.
        </p>
        <div className="mt-6 grid gap-3">
          {SOURCES.map((source) => <SourceLink key={source.href} {...source} />)}
        </div>
      </div>
    </section>
  )
}
