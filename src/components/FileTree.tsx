import React from "react"
import { ChevronLeft, ChevronRight, Circle, FileCode2, Folder, FolderOpen } from "lucide-react"
import type { EditableSkillFile, FileIssueMeta } from "../domain/files"
import { extensionLabel, hasTextChanges, shortFileName } from "../domain/files"
import { severityClasses } from "./ui"

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
  return <span className={`ml-auto rounded-md border px-1.5 py-0.5 text-[11px] font-black ${severityClasses(meta.severity, true)}`}>{count}</span>
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

    return (
      <button
        onClick={() => onOpenFile(node.path)}
        className={`button-motion control-focus flex min-h-9 w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm ${active ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20" : "text-slate-700 hover:bg-white hover:shadow-sm"}`}
        style={{ paddingLeft: 10 + depth * 14 }}
        title={node.path}
      >
        <FileCode2 className={`h-4 w-4 shrink-0 ${active ? "text-white/70" : "text-slate-500"}`} />
        <span className="min-w-0 flex-1 truncate font-medium">{shortFileName(node.path)}</span>
        {changed && <Circle className={`h-2.5 w-2.5 shrink-0 fill-current ${active ? "text-white" : "text-blue-500"}`} aria-label="Modified" />}
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${active ? "bg-white/[0.15] text-white/80" : "bg-slate-100 text-slate-500"}`}>{extensionLabel(node.path)}</span>
        {!active && <Badge meta={issueMeta[node.path]} />}
      </button>
    )
  }

  return (
    <div>
      {node.name && (
        <div className="mt-3 flex items-center gap-2 px-2 py-1 text-xs font-black uppercase tracking-wide text-slate-500" style={{ paddingLeft: 10 + depth * 14 }}>
          {children.length > 0 ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
          <span className="truncate">{node.name}</span>
        </div>
      )}
      <div className="space-y-1">
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
      <aside className="flex w-12 shrink-0 flex-col items-center border-l border-slate-200/80 bg-white/80 py-3 shadow-sm backdrop-blur-xl">
        <button onClick={onToggleCollapsed} className="button-motion control-focus flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100" title="Expand files panel" aria-label="Expand files panel">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="mt-4 vertical-rail-label">Files</div>
        <span className="mt-4 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-black text-slate-600 shadow-sm" title="Files in package">{files.length}</span>
        {dirtyCount > 0 && <span className="mt-2 h-2.5 w-2.5 rounded-full bg-blue-500" title="Modified files" />}
      </aside>
    )
  }

  return (
    <aside className="flex shrink-0 flex-col border-l border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl" style={{ width }}>
      <div className="border-b border-slate-200/80 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="muted-label">Package</div>
            <h2 className="mt-1 font-black text-slate-950">Files</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Open files for inline edits and issue review.</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600 shadow-sm">{files.length}</span>
            <button onClick={onToggleCollapsed} className="button-motion control-focus flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800" title="Collapse files panel" aria-label="Collapse files panel">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-slate-200 bg-white/75 px-3 py-2 shadow-sm">
            <div className="font-black text-slate-900">{issueFileCount}</div>
            <div className="text-slate-500">with issues</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/75 px-3 py-2 shadow-sm">
            <div className="font-black text-slate-900">{dirtyCount}</div>
            <div className="text-slate-500">modified</div>
          </div>
        </div>
        {dirtyCount > 0 && <p className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">Export ZIP to keep local edits.</p>}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <TreeRow node={tree} depth={0} activeFilePath={activeFilePath} issueMeta={issueMeta} fileMap={fileMap} onOpenFile={onOpenFile} />
      </div>
    </aside>
  )
}
