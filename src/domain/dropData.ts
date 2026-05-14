export type BrowserFileWithRelativePath = File & { webkitRelativePath?: string }

export type DroppedEntryBase = {
  name: string
  fullPath: string
}

export type DroppedFileEntry = DroppedEntryBase & {
  isFile: true
  isDirectory: false
  file(success: (file: File) => void, error?: (err: DOMException) => void): void
}

export type DroppedDirectoryEntry = DroppedEntryBase & {
  isFile: false
  isDirectory: true
  createReader(): {
    readEntries(success: (entries: DroppedEntry[]) => void, error?: (err: DOMException) => void): void
  }
}

export type DroppedEntry = DroppedFileEntry | DroppedDirectoryEntry

export type DroppedItemSnapshot = {
  entry: DroppedEntry | null
  file: File | null
}

export type DroppedDataSnapshot = {
  files: File[]
  items: DroppedItemSnapshot[]
}

type DataTransferItemWithEntry = Omit<DataTransferItem, "webkitGetAsEntry"> & {
  webkitGetAsEntry?: () => DroppedEntry | null
}

export function isDirectoryEntry(entry: DroppedEntry): entry is DroppedDirectoryEntry {
  return entry.isDirectory === true
}

export function isFileEntry(entry: DroppedEntry): entry is DroppedFileEntry {
  return entry.isFile === true
}

export function captureDroppedData(dataTransfer: DataTransfer): DroppedDataSnapshot {
  const items = Array.from(dataTransfer.items || []).map((item) => {
    const itemWithEntry = item as DataTransferItemWithEntry
    const entry = itemWithEntry.webkitGetAsEntry?.() ?? null
    const file = typeof item.getAsFile === "function" ? item.getAsFile() : null
    return { entry, file }
  })

  return {
    files: Array.from(dataTransfer.files || []),
    items,
  }
}
