import fs from "node:fs"
import path from "node:path"

const sourceRoots = ["src", "components", "hooks", "lib"]
const extensions = new Set([".ts", ".tsx"])
const explicitAnyPatterns = [
  /:\s*any\b/g,
  /\bas\s+any\b/g,
  /=\s*any\b/g,
  /\bextends\s+any\b/g,
  /\bArray\s*<\s*any\s*>/g,
  /\bany\s*\[\s*\]/g,
  /<\s*any(?:\s*[,>])/g,
  /[|&]\s*any\b/g,
]

function collectSourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return collectSourceFiles(entryPath)
    }

    return extensions.has(path.extname(entry.name)) ? [entryPath] : []
  })
}

const violations = sourceRoots
  .filter((root) => fs.existsSync(root))
  .flatMap(collectSourceFiles)
  .flatMap((filePath) => {
    const sourceText = fs.readFileSync(filePath, "utf8")
    return explicitAnyPatterns.flatMap((pattern) =>
      Array.from(sourceText.matchAll(pattern), (match) => {
        const prefix = sourceText.slice(0, match.index)
        const line = prefix.split("\n").length
        const lastLineBreak = prefix.lastIndexOf("\n")
        const column = match.index - lastLineBreak
        return `${filePath}:${line}:${column}`
      }),
    )
  })

if (violations.length > 0) {
  console.error("Explicit any types are not allowed:")
  violations.forEach((violation) => console.error(`- ${violation}`))
  process.exitCode = 1
} else {
  console.log("No explicit any types found in application TypeScript.")
}
