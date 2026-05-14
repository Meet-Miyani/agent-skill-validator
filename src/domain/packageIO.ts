import JSZip from "jszip";
import { normalizeSkillFiles } from "../validator/normalize";
import type {
  BrowserFileWithRelativePath,
  DroppedDataSnapshot,
  DroppedDirectoryEntry,
  DroppedFileEntry,
  DroppedEntry,
} from "./dropData";
import { isDirectoryEntry, isFileEntry } from "./dropData";
import type { EditableSkillFile, UploadSkillFile } from "./files";
import { isTextLikePath } from "./files";

type ZipEntry = {
  dir: boolean
  async(type: "string"): Promise<string>
  async(type: "uint8array"): Promise<Uint8Array>
}

function isSkillArchiveFileName(name: string): boolean {
  return /\.(zip|skill)$/i.test(name);
}

async function readFileAsUploadSkill(
  file: File,
  path = (file as BrowserFileWithRelativePath).webkitRelativePath || file.name,
): Promise<UploadSkillFile> {
  if (isTextLikePath(path)) {
    const content = await file.text();
    return { path, content, size: content.length };
  }

  const binaryData = new Uint8Array(await file.arrayBuffer());
  return {
    path,
    content: "",
    binary: true,
    binaryData,
    size: binaryData.byteLength,
  };
}

export async function readZipSkill(file: File): Promise<UploadSkillFile[]> {
  const loadedZip = await JSZip.loadAsync(file);
  const skillFiles: UploadSkillFile[] = [];
  const promises: Promise<void>[] = [];

  loadedZip.forEach((relativePath: string, zipEntry: ZipEntry) => {
    if (zipEntry.dir || relativePath.includes("__MACOSX")) return;
    promises.push(
      (async () => {
        if (isTextLikePath(relativePath)) {
          const content = await zipEntry.async("string");
          skillFiles.push({
            path: relativePath,
            content,
            size: content.length,
          });
        } else {
          const binaryData = await zipEntry.async("uint8array");
          skillFiles.push({
            path: relativePath,
            content: "",
            binary: true,
            binaryData,
            size: binaryData.byteLength,
          });
        }
      })(),
    );
  });

  await Promise.all(promises);
  return normalizeSkillFiles(skillFiles).files as UploadSkillFile[];
}

export async function readBrowserFiles(
  selectedFiles: File[],
): Promise<UploadSkillFile[]> {
  if (selectedFiles.length === 0) return [];
  const first = selectedFiles[0];
  if (selectedFiles.length === 1 && isSkillArchiveFileName(first.name)) {
    return readZipSkill(first);
  }

  const skillFiles = await Promise.all(
    selectedFiles.map((file) => readFileAsUploadSkill(file)),
  );

  return normalizeSkillFiles(skillFiles).files as UploadSkillFile[];
}

async function traverseFileEntry(
  fileEntry: DroppedFileEntry,
  capturedFile?: File | null,
): Promise<UploadSkillFile> {
  const path = (fileEntry.fullPath || capturedFile?.name || fileEntry.name).replace(
    /^\//,
    "",
  );

  if (capturedFile) return readFileAsUploadSkill(capturedFile, path);

  return new Promise((resolve, reject) => {
    fileEntry.file(async (file: File) => {
      try {
        resolve(await readFileAsUploadSkill(file, path));
      } catch (error) {
        reject(error);
      }
    }, reject);
  });
}

async function traverseDirectoryEntry(
  directoryEntry: DroppedDirectoryEntry,
): Promise<UploadSkillFile[]> {
  const reader = directoryEntry.createReader();
  const entries: DroppedEntry[] = [];

  async function readBatch(): Promise<void> {
    const batch: DroppedEntry[] = await new Promise((resolve, reject) =>
      reader.readEntries(resolve, reject),
    );
    if (batch.length === 0) return;
    entries.push(...batch);
    await readBatch();
  }

  await readBatch();
  const nested = await Promise.all(
    entries.map(async (entry) => {
      if (isDirectoryEntry(entry)) return traverseDirectoryEntry(entry);
      if (isFileEntry(entry)) return [await traverseFileEntry(entry)];
      return [];
    }),
  );
  return nested.flat();
}

export async function readDroppedDataSnapshot(
  snapshot: DroppedDataSnapshot,
): Promise<UploadSkillFile[]> {
  const hasEntries = snapshot.items.some((item) => item.entry !== null);

  if (!hasEntries) return readBrowserFiles(snapshot.files);

  const nested = await Promise.all(
    snapshot.items.map(async ({ entry, file }) => {
      if (!entry) return [];
      if (isDirectoryEntry(entry)) return traverseDirectoryEntry(entry);
      if (isFileEntry(entry)) {
        if (isSkillArchiveFileName(entry.name) && file) return readZipSkill(file);
        return [await traverseFileEntry(entry, file)];
      }
      return [];
    }),
  );

  const files = nested.flat().filter((file) => !file.path.includes("__MACOSX"));

  if (files.length > 0) {
    return normalizeSkillFiles(files).files as UploadSkillFile[];
  }

  return readBrowserFiles(snapshot.files);
}

export async function downloadEditedSkillZip(
  files: EditableSkillFile[],
  filename = "updated-skill.zip",
) {
  const zip = new JSZip();
  files.forEach((file) => {
    if (file.binary && file.binaryData) zip.file(file.path, file.binaryData);
    else zip.file(file.path, file.currentContent);
  });
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadJsonReport(
  report: unknown,
  filename = "skill-report.json",
) {
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
