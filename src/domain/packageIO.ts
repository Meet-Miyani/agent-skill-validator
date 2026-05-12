import JSZip from "jszip"
import { normalizeSkillFiles } from "../validator/validateSkill"
import type { EditableSkillFile, UploadSkillFile } from "./files"
import { isTextLikePath } from "./files"

function isSkillArchiveFileName(name: string): boolean {
  return /\.(zip|skill)$/i.test(name)
}

export async function readZipSkill(file: File): Promise<UploadSkillFile[]> {
  const loadedZip = await JSZip.loadAsync(file)
  const skillFiles: UploadSkillFile[] = []
  const promises: Promise<void>[] = []

  loadedZip.forEach((relativePath: string, zipEntry: any) => {
    if (zipEntry.dir || relativePath.includes("__MACOSX")) return
    promises.push((async () => {
      if (isTextLikePath(relativePath)) {
        const content = await zipEntry.async("string")
        skillFiles.push({ path: relativePath, content, size: content.length })
      } else {
        const binaryData = await zipEntry.async("uint8array")
        skillFiles.push({ path: relativePath, content: "", binary: true, binaryData, size: binaryData.byteLength })
      }
    })())
  })

  await Promise.all(promises)
  return normalizeSkillFiles(skillFiles).files as UploadSkillFile[]
}

export async function readBrowserFiles(selectedFiles: File[]): Promise<UploadSkillFile[]> {
  if (selectedFiles.length === 0) return []
  const first = selectedFiles[0]
  if (selectedFiles.length === 1 && isSkillArchiveFileName(first.name)) {
    return readZipSkill(first)
  }

  const skillFiles: UploadSkillFile[] = []
  await Promise.all(selectedFiles.map(async (file) => {
    const path = (file as any).webkitRelativePath || file.name
    if (isTextLikePath(path)) {
      const content = await file.text()
      skillFiles.push({ path, content, size: content.length })
    } else {
      const binaryData = new Uint8Array(await file.arrayBuffer())
      skillFiles.push({ path, content: "", binary: true, binaryData, size: binaryData.byteLength })
    }
  }))

  return normalizeSkillFiles(skillFiles).files as UploadSkillFile[]
}

async function traverseFileEntry(fileEntry: any, prefix = ""): Promise<UploadSkillFile> {
  return new Promise((resolve, reject) => {
    fileEntry.file(async (file: File) => {
      try {
        const path = `${prefix}${fileEntry.fullPath || file.name}`.replace(/^\//, "")
        if (isTextLikePath(path)) {
          const content = await file.text()
          resolve({ path, content, size: content.length })
        } else {
          const binaryData = new Uint8Array(await file.arrayBuffer())
          resolve({ path, content: "", binary: true, binaryData, size: binaryData.byteLength })
        }
      } catch (error) {
        reject(error)
      }
    }, reject)
  })
}

async function traverseDirectoryEntry(directoryEntry: any): Promise<UploadSkillFile[]> {
  const reader = directoryEntry.createReader()
  const entries: any[] = []

  async function readBatch(): Promise<void> {
    const batch: any[] = await new Promise((resolve, reject) => reader.readEntries(resolve, reject))
    if (batch.length === 0) return
    entries.push(...batch)
    await readBatch()
  }

  await readBatch()
  const nested = await Promise.all(entries.map(async (entry) => {
    if (entry.isDirectory) return traverseDirectoryEntry(entry)
    if (entry.isFile) return [await traverseFileEntry(entry)]
    return []
  }))
  return nested.flat()
}

export async function readDroppedItems(dataTransfer: DataTransfer): Promise<UploadSkillFile[]> {
  const items = Array.from(dataTransfer.items || [])
  const supportsEntries = items.some((item: any) => typeof item.webkitGetAsEntry === "function")
  if (!supportsEntries) return readBrowserFiles(Array.from(dataTransfer.files || []))

  const nested = await Promise.all(items.map(async (item: any) => {
    const entry = item.webkitGetAsEntry?.()
    if (!entry) return []
    if (entry.isDirectory) return traverseDirectoryEntry(entry)
    if (entry.isFile) {
      if (isSkillArchiveFileName(entry.name) && typeof item.getAsFile === "function") {
        const dropped = item.getAsFile()
        if (dropped) return readZipSkill(dropped)
      }
      return [await traverseFileEntry(entry)]
    }
    return []
  }))

  const files = nested.flat().filter((file) => !file.path.includes("__MACOSX"))
  return normalizeSkillFiles(files).files as UploadSkillFile[]
}

export function toEditableFiles(files: UploadSkillFile[]): EditableSkillFile[] {
  return files.map((file) => ({
    ...file,
    originalContent: file.content,
    currentContent: file.content,
    dirty: false,
  }))
}

export async function downloadEditedSkillZip(files: EditableSkillFile[], filename = "updated-skill.zip") {
  const zip = new JSZip()
  files.forEach((file) => {
    if (file.binary && file.binaryData) zip.file(file.path, file.binaryData)
    else zip.file(file.path, file.currentContent)
  })
  const blob = await zip.generateAsync({ type: "blob" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadJsonReport(report: unknown, filename = "skill-report.json") {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
