import filenamify from "filenamify"

/**
 * Coerces an uploaded file name into a valid gazette file ID matching the
 * schema regex `^[_\-a-zA-Z0-9]+\.pdf$`.
 *
 * filenamify only strips filesystem-illegal characters (`/ \ : * ? " < > |`),
 * turning them into hyphens so separated tokens stay separated; we still strip
 * everything outside the allowed charset afterwards.
 */
export const toFileId = (filename: string): string => {
  const base = filename.replace(/\.pdf$/i, "")
  const sanitized =
    filenamify(base, { replacement: "-" })
      .replace(/\s+/g, "-")
      .replace(/[^_\-a-zA-Z0-9]/g, "") || "file"
  return `${sanitized}.pdf`
}
