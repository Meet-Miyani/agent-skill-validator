import type { SkillFile, Severity } from "../validator/types"
import { normalizeSkillPath } from "../validator/validateSkill"

export type UploadSkillFile = SkillFile & { binaryData?: Uint8Array }

export type EditableSkillFile = UploadSkillFile & {
  originalContent: string
  currentContent: string
  dirty: boolean
}

export type IssueLocation = {
  path: string
  line?: number
  endLine?: number
}

export type FileIssueMeta = {
  errors: number
  warnings: number
  info: number
  severity: Severity
}

export function toValidatorFiles(files: EditableSkillFile[]): SkillFile[] {
  return files.map((file) => ({
    path: file.path,
    content: file.binary ? "" : file.currentContent,
    binary: file.binary,
    size: file.binary ? file.size : file.currentContent.length,
  }))
}

export function fileByPath(files: EditableSkillFile[], path?: string) {
  if (!path) return undefined
  const normalized = normalizeSkillPath(path).toLowerCase()
  return files.find((file) => file.path.toLowerCase() === normalized)
}

export function isTextLikePath(path: string) {
  const normalized = normalizeSkillPath(path)
  if (/(^|\/)(SKILL\.md|README(\.md)?|LICENSE(\.md|\.txt)?)$/i.test(normalized)) return true
  return /\.(md|mdx|txt|ya?ml|json|js|jsx|ts|tsx|mjs|cjs|py|sh|bash|zsh|rb|rs|go|java|kt|kts|gradle|toml|ini|cfg|conf|csv|html|css|xml|svg)$/i.test(normalized)
}

export function textLineCount(content: string) {
  return content.length === 0 ? 0 : content.split("\n").length
}

export function shortFileName(path: string) {
  return path.split("/").pop() || path
}

export function extensionLabel(path: string) {
  const file = shortFileName(path)
  if (file.toLowerCase() === "skill.md") return "skill"
  const ext = file.includes(".") ? file.split(".").pop() : "file"
  return ext?.toLowerCase() || "file"
}

export function hasTextChanges(file: EditableSkillFile) {
  return !file.binary && file.currentContent !== file.originalContent
}
