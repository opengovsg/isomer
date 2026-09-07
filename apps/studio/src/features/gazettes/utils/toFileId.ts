// filenamify is intentionally not imported here — filenamify@6 re-exports
// filenamifyPath which does `import path from 'node:path'`, and webpack 5
// cannot handle node: URI schemes in the Storybook build.

/**
 * Coerces an uploaded file name into a valid gazette file ID matching the
 * schema regex `^[_\-a-zA-Z0-9]+\.pdf$`.
 */
export const toFileId = (filename: string): string => {
  const base = filename.replace(/\.pdf$/iu, "")
  const sanitized =
    base
      // oxlint-disable-next-line eslint/require-unicode-regexp -- core cleanup deferred
      .replaceAll(/[/uuuuuuuuuuuuuuuuuu\\:*?"<>|]/g, "-")
      .replaceAll(/\s+/gu, "-")
      .replaceAll(/[^_\-a-zA-Z0-9]/gu, "") || "file"
  return `${sanitized}.pdf`
}
