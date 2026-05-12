import React from "react"
import {
  BadgeCheck, BookOpenCheck, Code2, Download, FileCode2,
  FileSearch, GitPullRequest, Link2, ShieldCheck, Wand2,
} from "lucide-react"

/** Individual feature card. */
function FeatureCard({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-black text-slate-950">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-slate-500">{detail}</p>
    </article>
  )
}

/** Tick-list item for "Checks performed" section. */
function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
      <span>{children}</span>
    </li>
  )
}

/** Step in the "How it works" workflow card. */
function WorkflowStep({ Icon, title, detail }: { Icon: React.ElementType; title: string; detail: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-black text-slate-950">{title}</p>
        <p className="mt-0.5 text-sm leading-5 text-slate-500">{detail}</p>
      </div>
    </div>
  )
}

/** Section heading with kicker label, title, and detail text. */
function SectionHeading({ kicker, title, detail }: { kicker: string; title: string; detail: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-black uppercase tracking-widest text-violet-600">{kicker}</p>
      <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{detail}</p>
    </div>
  )
}

/** Social-proof bar between hero and features. */
export function TrustBar() {
  const items = [
    ["Official-source informed", "OpenAI, Agent Skills, and Anthropic guidance"],
    ["Actionable findings", "Errors, warnings, file locations, and suggested fixes"],
    ["Token-aware", "Activation and package estimates with cost context"],
    ["Export-ready", "Edit in-browser and download repaired packages"],
  ]
  return (
    <div className="border-y border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {items.map(([title, detail]) => (
          <div key={title} className="flex items-start gap-3">
            <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
            <div>
              <p className="text-sm font-black text-slate-950">{title}</p>
              <p className="mt-0.5 text-sm leading-5 text-slate-500">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** "What gets scanned" feature cards grid. */
export function WhatGetsScanned() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionHeading
        kicker="What gets scanned"
        title="A full package review, not just a frontmatter check."
        detail="The validator walks the skill package the way an agent will consume it: root instructions first, then linked references, scripts, metadata, and risky repository artifacts."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FeatureCard icon={<FileCode2 className="h-5 w-5" />} title="SKILL.md structure" detail="Required root file, YAML delimiters, name and description fields, body size, headings, and examples." />
        <FeatureCard icon={<Link2 className="h-5 w-5" />} title="References" detail="Linked reference files, orphaned docs, missing targets, long reference files, and nested reference chains." />
        <FeatureCard icon={<Code2 className="h-5 w-5" />} title="Scripts and metadata" detail="Script discovery, documentation mentions, browser permission limits, and optional OpenAI agent metadata." />
        <FeatureCard icon={<ShieldCheck className="h-5 w-5" />} title="Safety and hygiene" detail="Secret patterns, private keys, JWT-like tokens, absolute paths, dangerous commands, and noisy build artifacts." />
      </div>
    </section>
  )
}

/** "Checks performed" checklist + "How it works" card. */
export function ChecksAndWorkflow() {
  return (
    <>
      {/* Checks list */}
      <section id="checks" className="bg-slate-50 scroll-mt-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1fr] lg:px-8">
          <SectionHeading
            kicker="Checks performed"
            title="Clear findings mapped to real skill authoring concerns."
            detail="Each report groups checks, scanned targets, algorithms used, and references so contributors can understand the reasoning."
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            <CheckItem>Spec compliance for root files, frontmatter, body limits, and markdown fences.</CheckItem>
            <CheckItem>Description quality for trigger clarity, action verbs, voice, and negative boundaries.</CheckItem>
            <CheckItem>Progressive disclosure checks for linked references, token budget, and package size.</CheckItem>
            <CheckItem>Internal links, markdown syntax, heading hierarchy, and duplicate heading detection.</CheckItem>
            <CheckItem>Security scan for API keys, private keys, JWT-like tokens, absolute paths, and risky commands.</CheckItem>
            <CheckItem>Weighted score, grade, improvement list, AI fix prompt, and repaired ZIP export.</CheckItem>
          </ul>
        </div>
      </section>

      {/* Workflow card */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <BookOpenCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-950">Local-first review workflow</h3>
                <p className="mt-0.5 text-sm text-slate-500">Scan, edit, and export without leaving the browser.</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <WorkflowStep Icon={FileSearch} title="Upload a package" detail="Drop a ZIP, .skill, folder, or SKILL.md file." />
              <WorkflowStep Icon={GitPullRequest} title="Review findings" detail="Open issue groups, source-backed checks, file risks, and section metrics." />
              <WorkflowStep Icon={Wand2} title="Repair faster" detail="Apply supported fixes, auto-link references, or copy an AI fix prompt." />
              <WorkflowStep Icon={Download} title="Export the result" detail="Download a repaired skill package or JSON report." />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
