import type { SkillFile } from "./types";

export function uniqueByKey<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = key(item);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function normalizeSkillPath(path: string) {
  return path
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^\.\//, "")
    .replace(/\/\.\//g, "/");
}

export function normalizeSkillFiles<T extends SkillFile>(inputFiles: T[]) {
  const normalized = inputFiles
    .map((file) => ({ ...file, path: normalizeSkillPath(file.path) }))
    .filter((file) => file.path.length > 0);

  const hasRootSkill = normalized.some(
    (file) => file.path.toLowerCase() === "skill.md",
  );
  let strippedRootPrefix: string | undefined;

  if (!hasRootSkill) {
    const skillCandidates = normalized.filter((file) =>
      /(^|\/)SKILL\.md$/i.test(file.path),
    );
    if (skillCandidates.length === 1) {
      const candidatePath = skillCandidates[0].path;
      strippedRootPrefix = candidatePath.slice(
        0,
        candidatePath.length - "SKILL.md".length,
      );
    }
  }

  const files = strippedRootPrefix
    ? normalized.map((file) =>
        file.path.startsWith(strippedRootPrefix!)
          ? { ...file, path: file.path.slice(strippedRootPrefix!.length) }
          : file,
      )
    : normalized;

  return {
    files: uniqueByKey(files, (file) => file.path.toLowerCase()),
    strippedRootPrefix,
  };
}
