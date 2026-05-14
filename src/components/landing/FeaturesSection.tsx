import React from "react"
import {
  ArrowDownRight, BadgeCheck, BookOpenCheck, Code2, Download, FileCode2,
  FileSearch, GitPullRequest, Link2, LockKeyhole, ShieldCheck, Wand2,
} from "lucide-react"

function SectionHeading({ eyebrow, title, detail, dark = false }: { eyebrow: string; title: string; detail: string; dark?: boolean }) {
  return (
    <div className="max-w-2xl">
      <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${dark ? "text-lime-200/70" : "text-zinc-500"}`}>{eyebrow}</p>
      <h2 className={`mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl ${dark ? "text-white" : "text-zinc-950"}`}>{title}</h2>
      <p className={`mt-4 text-base leading-7 ${dark ? "text-zinc-400" : "text-zinc-600"}`}>{detail}</p>
    </div>
  )
}

function FeatureCard({ icon, title, detail, dark = false }: { icon: React.ReactNode; title: string; detail: string; dark?: boolean }) {
  return (
    <article className={`group rounded-[24px] border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${dark ? "border-white/10 bg-zinc-900/80 hover:border-white/20 hover:shadow-black/20" : "border-zinc-900/10 bg-[#fffdf6] hover:border-zinc-900/25 hover:shadow-lg hover:shadow-zinc-900/5"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm ${dark ? "bg-lime-200/10 text-lime-200" : "bg-zinc-950 text-lime-200"}`}>{icon}</div>
        <ArrowDownRight className={`h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:translate-y-1 ${dark ? "text-zinc-500 group-hover:text-white" : "text-zinc-300 group-hover:text-zinc-950"}`} />
      </div>
      <h3 className={`mt-5 text-base font-semibold tracking-tight ${dark ? "text-white" : "text-zinc-950"}`}>{title}</h3>
      <p className={`mt-2 text-sm leading-6 ${dark ? "text-zinc-300" : "text-zinc-600"}`}>{detail}</p>
    </article>
  )
}

function CheckItem({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <li className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-6 shadow-sm ${dark ? "border-white/10 bg-white/[0.05] text-zinc-300" : "border-zinc-900/10 bg-white/75 text-zinc-700"}`}>
      <BadgeCheck className={`mt-1 h-4 w-4 shrink-0 ${dark ? "text-lime-200" : "text-zinc-950"}`} />
      <span>{children}</span>
    </li>
  )
}

function WorkflowStep({ Icon, title, detail, step }: { Icon: React.ElementType; title: string; detail: string; step: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-4">
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-lime-200">
          <Icon className="h-4 w-4" />
        </div>
        {step !== "04" && <div className="h-10 w-px bg-white/10" />}
      </div>
      <div className={step === "04" ? "pb-0" : "pb-6"}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lime-200/60">{step}</p>
        <p className="mt-1 text-base font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm leading-6 text-zinc-400">{detail}</p>
      </div>
    </div>
  )
}

export function TrustBar() {
  const items = [
    ["Official-source informed", "Checks map back to public skill documentation and labeled heuristics."],
    ["Actionable findings", "Warnings connect to files, lines, suggested fixes, and report sections."],
    ["Token-aware", "Activation budget and reference size are visible before export."],
    ["Local export", "Repair, auto-link, copy prompts, and download a revised package."],
  ]
  return (
    <section className="border-y border-zinc-900/10 bg-zinc-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-0 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {items.map(([title, detail], index) => (
          <div key={title} className="border-zinc-800 py-5 sm:px-5 lg:border-l first:border-l-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lime-200/60">0{index + 1}</p>
            <p className="mt-2 text-sm font-semibold text-white">{title}</p>
            <p className="mt-1 text-sm leading-6 text-zinc-400">{detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function WhatGetsScanned({ darkMode = false }: { darkMode?: boolean }) {
  return (
    <section className={`px-4 py-16 sm:px-6 lg:px-8 ${darkMode ? "bg-zinc-950" : "bg-[#fbf7ea]"}`}>
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Scan surface"
          title="An AI skill audit, not a decoration pass."
          detail="SkillLint checks the skill the way an agent consumes it: root instructions first, then linked references, scripts, metadata, assets, and risky repository artifacts."
          dark={darkMode}
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard dark={darkMode} icon={<FileCode2 className="h-5 w-5" />} title="SKILL.md structure" detail="Root file presence, YAML delimiters, name and description fields, body size, headings, and examples." />
          <FeatureCard dark={darkMode} icon={<Link2 className="h-5 w-5" />} title="Reference graph" detail="Linked reference files, orphaned docs, missing targets, long reference files, and nested reference chains." />
          <FeatureCard dark={darkMode} icon={<Code2 className="h-5 w-5" />} title="Scripts and agents" detail="Script discovery, documentation mentions, browser permission limits, and optional OpenAI agent metadata." />
          <FeatureCard dark={darkMode} icon={<ShieldCheck className="h-5 w-5" />} title="Repository hygiene" detail="Secret patterns, private keys, JWT-like tokens, absolute paths, dangerous commands, and noisy build artifacts." />
        </div>
      </div>
    </section>
  )
}

export function ChecksAndWorkflow({ darkMode = false }: { darkMode?: boolean }) {
  return (
    <section id="checks" className={`scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8 ${darkMode ? "bg-zinc-900/60" : "bg-[#eee7d6]"}`}>
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_0.9fr]">
        <div className={`rounded-[32px] border p-6 shadow-sm sm:p-8 ${darkMode ? "border-white/10 bg-zinc-950/70" : "border-zinc-900/10 bg-[#fffdf6]"}`}>
          <SectionHeading
            eyebrow="Checks performed"
            title="Clear findings mapped to real skill authoring work."
            detail="Each report groups checks, scanned targets, algorithms used, and references so authors can understand what needs attention."
            dark={darkMode}
          />
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            <CheckItem dark={darkMode}>Spec compliance for root files, frontmatter, body limits, and markdown fences.</CheckItem>
            <CheckItem dark={darkMode}>Description quality for trigger clarity, action verbs, voice, and negative boundaries.</CheckItem>
            <CheckItem dark={darkMode}>Progressive disclosure checks for linked references, token budget, and package size.</CheckItem>
            <CheckItem dark={darkMode}>Internal links, markdown syntax, heading hierarchy, and duplicate heading detection.</CheckItem>
            <CheckItem dark={darkMode}>Security scan for API keys, private keys, JWT-like tokens, absolute paths, and risky commands.</CheckItem>
            <CheckItem dark={darkMode}>Weighted score, grade, improvement list, AI fix prompt, and repaired ZIP export.</CheckItem>
          </ul>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-zinc-950 p-6 text-white shadow-2xl shadow-zinc-900/20 sm:p-8">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
            <SectionHeading
              eyebrow="Workflow"
              title="From rough skill to exportable package."
              detail="The workflow mirrors the product: check, inspect, repair, and export."
              dark
            />
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-200 text-zinc-950 sm:flex">
              <BookOpenCheck className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-7">
            <WorkflowStep step="01" Icon={FileSearch} title="Upload a skill" detail="Drop a ZIP, .skill bundle, folder, or SKILL.md file." />
            <WorkflowStep step="02" Icon={GitPullRequest} title="Review findings" detail="Open issue groups, source-backed checks, file risks, and section metrics." />
            <WorkflowStep step="03" Icon={Wand2} title="Repair faster" detail="Apply supported fixes, auto-link references, or copy an AI fix prompt." />
            <WorkflowStep step="04" Icon={Download} title="Export the result" detail="Download a repaired skill bundle or JSON report." />
          </div>
        </div>
      </div>
    </section>
  )
}
