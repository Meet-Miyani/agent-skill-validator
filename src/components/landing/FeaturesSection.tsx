import React from "react"
import {
  ArrowDownRight, BadgeCheck, BookOpenCheck, Code2, Download, FileCode2,
  FileSearch, GitPullRequest, Link2, ShieldCheck, Wand2,
} from "lucide-react"

function SectionHeading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--theme-text-soft)]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[color:var(--theme-text-primary)] sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-[color:var(--theme-text-muted)]">{detail}</p>
    </div>
  )
}

function FeatureCard({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <article className="panel-hover group rounded-[24px] border border-[color:var(--theme-border)] bg-[color:var(--theme-surface)] p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div className="theme-icon-box flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm">{icon}</div>
        <ArrowDownRight className="h-5 w-5 text-[color:var(--theme-text-soft)] transition-transform group-hover:translate-x-1 group-hover:translate-y-1 group-hover:text-[color:var(--theme-text-primary)]" />
      </div>
      <h3 className="mt-5 text-base font-semibold tracking-tight text-[color:var(--theme-text-primary)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[color:var(--theme-text-muted)]">{detail}</p>
    </article>
  )
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] px-4 py-3 text-sm leading-6 text-[color:var(--theme-text-muted)] shadow-sm">
      <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-[color:var(--theme-icon-muted-fg)]" />
      <span>{children}</span>
    </li>
  )
}

function WorkflowStep({ Icon, title, detail, step }: { Icon: React.ElementType; title: string; detail: string; step: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-4">
      <div className="flex flex-col items-center">
        <div className="theme-icon-muted flex h-10 w-10 items-center justify-center rounded-full border">
          <Icon className="h-4 w-4" />
        </div>
        {step !== "04" && <div className="h-10 w-px bg-[color:var(--theme-border)]" />}
      </div>
      <div className={step === "04" ? "pb-0" : "pb-6"}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--theme-text-soft)]">{step}</p>
        <p className="mt-1 text-base font-semibold text-[color:var(--theme-text-primary)]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[color:var(--theme-text-muted)]">{detail}</p>
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
    <section className="border-y border-[color:var(--theme-border)] bg-[color:var(--theme-canvas-muted)] text-[color:var(--theme-text-primary)]">
      <div className="mx-auto grid max-w-7xl gap-0 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {items.map(([title, detail], index) => (
          <div key={title} className="border-[color:var(--theme-border)] py-5 sm:px-5 lg:border-l first:border-l-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--theme-text-soft)]">0{index + 1}</p>
            <p className="mt-2 text-sm font-semibold text-[color:var(--theme-text-primary)]">{title}</p>
            <p className="mt-1 text-sm leading-6 text-[color:var(--theme-text-muted)]">{detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function WhatGetsScanned() {
  return (
    <section className="bg-[color:var(--theme-canvas)] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Scan surface"
          title="An AI skill audit, not a decoration pass."
          detail="SkillLint checks the skill the way an agent consumes it: root instructions first, then linked references, scripts, metadata, assets, and risky repository artifacts."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard icon={<FileCode2 className="h-5 w-5" />} title="SKILL.md structure" detail="Root file presence, YAML delimiters, name and description fields, body size, headings, and examples." />
          <FeatureCard icon={<Link2 className="h-5 w-5" />} title="Reference graph" detail="Linked reference files, orphaned docs, missing targets, long reference files, and nested reference chains." />
          <FeatureCard icon={<Code2 className="h-5 w-5" />} title="Scripts and agents" detail="Script discovery, documentation mentions, browser permission limits, and optional OpenAI agent metadata." />
          <FeatureCard icon={<ShieldCheck className="h-5 w-5" />} title="Repository hygiene" detail="Secret patterns, private keys, JWT-like tokens, absolute paths, dangerous commands, and noisy build artifacts." />
        </div>
      </div>
    </section>
  )
}

export function ChecksAndWorkflow() {
  return (
    <section id="checks" className="scroll-mt-20 bg-[color:var(--theme-canvas-muted)] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_0.9fr]">
        <div className="rounded-[32px] border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-strong)] p-6 shadow-sm sm:p-8">
          <SectionHeading
            eyebrow="Checks performed"
            title="Clear findings mapped to real skill authoring work."
            detail="Each report groups checks, scanned targets, algorithms used, and references so authors can understand what needs attention."
          />
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            <CheckItem>Spec compliance for root files, frontmatter, body limits, and markdown fences.</CheckItem>
            <CheckItem>Description quality for trigger clarity, action verbs, voice, and negative boundaries.</CheckItem>
            <CheckItem>Progressive disclosure checks for linked references, token budget, and package size.</CheckItem>
            <CheckItem>Internal links, markdown syntax, heading hierarchy, and duplicate heading detection.</CheckItem>
            <CheckItem>Security scan for API keys, private keys, JWT-like tokens, absolute paths, and risky commands.</CheckItem>
            <CheckItem>Weighted score, grade, improvement list, AI fix prompt, and repaired ZIP export.</CheckItem>
          </ul>
        </div>

        <div className="rounded-[32px] border border-[color:var(--theme-border)] bg-[color:var(--theme-surface)] p-6 shadow-2xl shadow-black/10 sm:p-8 dark:shadow-black/30">
          <div className="flex items-start justify-between gap-4 border-b border-[color:var(--theme-border)] pb-6">
            <SectionHeading
              eyebrow="Workflow"
              title="From rough skill to exportable package."
              detail="The workflow mirrors the product: check, inspect, repair, and export."
            />
            <div className="theme-icon-box hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:flex">
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
