import React from "react"
import { ChevronLeft, ChevronRight, Circle, FileCode2, Folder, FolderOpen } from "lucide-react"
import type { EditableSkillFile, FileIssueMeta } from "../domain/files"
import { extensionLabel, hasTextChanges, shortFileName } from "../domain/files"
import { severityClasses, severityDotClass } from "./ui"

type TreeNode = {
  name: string
  path: string
  type: "dir" | "file"
  children: Map<string, TreeNode>
}

function buildTree(files: EditableSkillFile[]) {
  const root: TreeNode = { name: "", path: "", type: "dir", children: new Map() }
  for (const file of files) {
    const parts = file.path.split("/")
    let current = root
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1
      const path = parts.slice(0, index + 1).join("/")
      let child = current.children.get(part)
      if (!child) {
        child = { name: part, path, type: isFile ? "file" : "dir", children: new Map() }
        current.children.set(part, child)
      }
      current = child
    })
  }
  return root
}

function Badge({ meta }: { meta?: FileIssueMeta }) {
  if (!meta) return null
  const count = meta.errors + meta.warnings + meta.info
  if (count === 0) return null
  return <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${severityClasses(meta.severity, true)}`}>{count}</span>
}

function TreeRow({
  node,
  depth,
  activeFilePath,
  issueMeta,
  fileMap,
  onOpenFile,
}: {
  node: TreeNode
  depth: number
  activeFilePath: string | null
  issueMeta: Record<string, FileIssueMeta>
  fileMap: Map<string, EditableSkillFile>
  onOpenFile: (path: string) => void
}) {
  const children = Array.from(node.children.values()).sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  if (node.type === "file") {
    const active = node.path === activeFilePath
    const file = fileMap.get(node.path)
    const changed = file ? hasTextChanges(file) : false
    const meta = issueMeta[node.path]

    return (
      <button
        onClick={() => onOpenFile(node.path)}
        className={`button-motion control-focus group flex min-h-8 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] ${active ? "bg-zinc-950 text-lime-200 shadow-sm dark:bg-lime-200 dark:text-zinc-950" : "text-zinc-600 hover:bg-white hover:text-zinc-950 hover:shadow-sm dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"}`}
        style={{ paddingLeft: 10 + depth * 12 }}
        title={node.path}
      >
        <FileCode2 className={`h-3.5 w-3.5 shrink-0 ${active ? "text-current opacity-65" : "text-zinc-400"}`} />
        <span className="min-w-0 flex-1 truncate font-medium">{shortFileName(node.path)}</span>
        {changed && <Circle className={`h-2 w-2 shrink-0 fill-current ${active ? "text-current" : "text-sky-500"}`} aria-label="Modified" />}
        {meta && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${severityDotClass(meta.severity)}`} />}
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${active ? "bg-white/[0.16] text-current dark:bg-zinc-950/10" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"}`}>{extensionLabel(node.path)}</span>
        {!active && <Badge meta={meta} />}
      </button>
    )
  }

  return (
    <div>
      {node.name && (
        <div className="mt-2 flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500" style={{ paddingLeft: 10 + depth * 12 }}>
          {children.length > 0 ? <FolderOpen className="h-3.5 w-3.5" /> : <Folder className="h-3.5 w-3.5" />}
          <span className="truncate">{node.name}</span>
        </div>
      )}
      <div className="space-y-0.5">
        {children.map((child) => (
          <TreeRow
            key={child.path}
            node={child}
            depth={node.name ? depth + 1 : depth}
            activeFilePath={activeFilePath}
            issueMeta={issueMeta}
            fileMap={fileMap}
            onOpenFile={onOpenFile}
          />
        ))}
      </div>
    </div>
  )
}

export function FileTreePanel({
  files,
  activeFilePath,
  issueMeta,
  collapsed,
  width,
  onToggleCollapsed,
  onOpenFile,
}: {
  files: EditableSkillFile[]
  activeFilePath: string | null
  issueMeta: Record<string, FileIssueMeta>
  collapsed: boolean
  width: number
  onToggleCollapsed: () => void
  onOpenFile: (path: string) => void
}) {
  const tree = buildTree(files)
  const dirtyCount = files.filter((file) => file.dirty).length
  const issueFileCount = Object.values(issueMeta).filter((meta) => meta.errors + meta.warnings + meta.info > 0).length
  const fileMap = new Map(files.map((file) => [file.path, file]))

  if (collapsed) {
    return (
      <aside className="flex w-11 shrink-0 flex-col items-center border-l border-zinc-200 bg-white/75 py-2 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80">
        <button onClick={onToggleCollapsed} className="button-motion control-focus flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Expand files panel" aria-label="Expand files panel">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="mt-4 vertical-rail-label">Files</div>
        <span className="mt-4 rounded-full border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300" title="Files in package">{files.length}</span>
        {dirtyCount > 0 && <span className="mt-2 h-2 w-2 rounded-full bg-sky-500" title="Modified files" />}
      </aside>
    )
  }

  return (
    <aside className="flex shrink-0 flex-col border-l border-zinc-200 bg-white/75 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80" style={{ width }}>
      <div className="border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="muted-label">Package</div>
            <h2 className="mt-0.5 truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">Files</h2>
          </div>
          <button onClick={onToggleCollapsed} className="button-motion control-focus flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100" title="Collapse files panel" aria-label="Collapse files panel">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
          <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">{files.length} files</span>
          <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">{issueFileCount} issue files</span>
          {dirtyCount > 0 && <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 font-semibold text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">{dirtyCount} changed</span>}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        <TreeRow node={tree} depth={0} activeFilePath={activeFilePath} issueMeta={issueMeta} fileMap={fileMap} onOpenFile={onOpenFile} />
      </div>
    </aside>
  )
}
