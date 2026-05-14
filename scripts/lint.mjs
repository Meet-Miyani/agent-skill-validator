import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const srcDir = path.join(root, "src")
const generatedFiles = ["vite.config.js", "vite.config.d.ts", "tsconfig.tsbuildinfo", "tsconfig.node.tsbuildinfo"]
const allowedValidatorImportFiles = new Set(["src/validator/validateSkill.ts"])
const failures = []

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(fullPath)
    else if (/\.(ts|tsx)$/.test(entry.name)) yield fullPath
  }
}

for (const file of generatedFiles) {
  try {
    await readFile(path.join(root, file))
    failures.push(`Generated artifact should not be committed: ${file}`)
  } catch {
    // absent is expected
  }
}

for await (const file of walk(srcDir)) {
  const rel = path.relative(root, file).replaceAll(path.sep, "/")
  const text = await readFile(file, "utf8")

  if (/\b(as\s+any|:\s*any\b|<any>)/.test(text)) {
    failures.push(`Avoid explicit any in ${rel}`)
  }

  if (!allowedValidatorImportFiles.has(rel) && /from\s+["'].*validator\/validateSkill["']/.test(text)) {
    failures.push(`Do not statically import validator/validateSkill from ${rel}; keep the heavy tokenizer lazy-loaded.`)
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"))
  process.exit(1)
}

console.log("Quality lint passed")
