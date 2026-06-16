// filenamify is intentionally not imported here — filenamify@6 re-exports
// filenamifyPath which does `import path from 'node:path'`, and webpack 5
// cannot handle node: URI schemes in the Storybook build.

/**
 * Coerces an uploaded file name into a valid gazette file ID matching the
 * schema regex `^[_\-a-zA-Z0-9]+\.pdf$`.
 */
export const toFileId = (filename: string): string => {
  const base = filename.replace(/\.pdf$/i, "")
  const sanitized =
    base
      .replace(/[/\\:*?"<>|]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/[^_\-a-zA-Z0-9]/g, "") || "file"
  return `${sanitized}.pdf`
}
