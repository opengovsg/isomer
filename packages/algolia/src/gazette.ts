import { create as createContentDisposition } from "content-disposition"
import { formatInTimeZone } from "date-fns-tz"
import { PdfReader } from "pdfreader"

/**
 * Shape of a gazette Search Record pushed to the shared egazette Algolia index.
 * Must match egazette field-for-field — the index schema is set by egazette.
 *
 * A gazette produces one Search Record per text chunk; every record of a
 * gazette shares the same Object Group (its S3 object key).
 *
 * The index signature makes SearchRecord directly assignable to
 * `({ objectID: string } & Record<string, unknown>)[]` (the
 * saveObjectsToSearchIndex parameter type) without an unsafe cast.
 */
export type SearchRecord = {
  objectID: string
  objectGroup: string
  title: string
  category: string
  subCategory: string
  notificationNum?: string
  lexiNotificationNum?: string
  /** Publish date in "DD/MM/YYYY" format (Asia/Singapore local time). */
  publishDate: string
  publishYear: number
  publishMonth: number
  publishDay: number
  /** Epoch milliseconds of the publish timestamp. */
  publishTimestamp: number
  fileUrl: string
  /** One text chunk (up to 7 000 chars) from the parsed PDF. */
  text: string
} & Record<string, string | number | undefined>

/**
 * Derive a gazette's objectGroup — the S3 key (no leading slash), shared by
 * every Search Record belonging to that gazette — from its page ref.
 */
export const objectGroupFromRef = (ref: string): string => ref.slice(1)

/**
 * Algolia filter expression matching every Search Record sharing a gazette's
 * objectGroup. Wrapped in double quotes because objectGroup contains forward
 * slashes and a dot (e.g. "2026/cat/sub/file.pdf") which Algolia's filter
 * parser would otherwise mis-tokenise.
 */
export const buildGazetteObjectGroupFilter = (objectGroup: string): string =>
  `objectGroup:"${objectGroup}"`

const getExtensionFromKey = (key: string): string => {
  const filename = key.split("/").pop() ?? ""
  return filename.includes(".")
    ? filename.slice(filename.lastIndexOf("."))
    : ""
}

/**
 * Build Content-Disposition using a human-readable title as the download
 * filename, keeping the key's extension so the saved file still opens in
 * the right application. Shared by the ingestion cron and the repair admin
 * script, which both need to rewrite a gazette object's disposition on
 * publish/republish.
 */
export const getContentDispositionForTitle = (
  title: string,
  key: string,
): string => {
  const extension = getExtensionFromKey(key)
  // content-disposition runs path.basename on the filename, which would
  // truncate a title containing "/" or "\" (e.g. "A/B" -> "B"). Replace path
  // separators up front so the full title survives in the download filename.
  const filename = `${title}${extension}`.replaceAll(/[/\\]/gu, "-")
  return createContentDisposition(filename, { type: "inline" })
}

export interface BuildGazetteSearchRecordsParams {
  parsedText: string
  objectGroup: string
  title: string
  category: string
  subCategory: string
  notificationNum?: string
  fileUrl: string
  scheduledAt: Date
}

// Taken as is from egazette codebase.
// Instantiates a fresh PdfReader per call — the cron handler parses PDFs
// concurrently via Promise.all and pdfreader is built on pdf2json whose
// underlying state is not safe to share across overlapping parseBuffer
// invocations.
export const parseFullTextFromPDF = async (pdfBuffer: Uint8Array) => {
  const pdfReader = new PdfReader({})
  const parsedData: string[] = []

  // oxlint-disable-next-line promise/avoid-new -- pdfreader only exposes a callback-based parseBuffer API
  await new Promise<void>((resolve, reject) => {
    pdfReader.parseBuffer(Buffer.from(pdfBuffer), (err, item) => {
      if (err !== undefined && err !== null && err !== "") {
        reject(new Error(`Failed to parse PDF: ${err}`))
        return
      }
      if (item === null || item === undefined) {
        resolve()
        return
      }
      // SAFETY: pdfreader callbacks are untyped; only read optional text after confirming the key exists.
      const text =
        "text" in item ? (item as { text?: string }).text : undefined
      if (text !== undefined && text.length > 0) {
        parsedData.push(text)
      }
    })
  })

  return parsedData.join(" ")
}

/**
 * Build Algolia Search Records for a gazette, one record per text chunk.
 *
 * Pure function — no I/O, no env reads, no feature-flag checks.
 * The caller (cron) is responsible for the flag check.
 */
export const buildGazetteSearchRecords = ({
  parsedText,
  objectGroup,
  title,
  category,
  subCategory,
  notificationNum,
  fileUrl,
  scheduledAt,
}: BuildGazetteSearchRecordsParams): SearchRecord[] => {
  if (!parsedText) {return []}

  // Split parsedText into chunks of up to 7 000 characters, ending on a
  // whitespace boundary where possible. This keeps each Algolia record well
  // below the ~10 KB record-size limit.
  //
  // The regex matches up to 7 000 characters followed by whitespace OR
  // end-of-string. The `g` flag advances through the string chunk by chunk.
  // We use a while-loop (not matchAll/split) to mirror egazette's own
  // chunking logic exactly.
  //
  // WHY end on whitespace: splitting mid-word fragments search tokens across
  // two records and hurts recall; whitespace-aligned splits are semantically
  // cleaner and egazette uses the same boundary.
  //
  // NOTE: a contiguous run of non-whitespace characters longer than 7000 chars
  // causes the regex to skip the leading portion of that run (it begins matching
  // at the first position from which it can consume up to 7000 chars ending at
  // the string boundary). Same behavior as egazette; gazette PDFs are
  // whitespace-delimited prose, so this does not arise in practice.
  const CHUNK_REGEX = /.{1,7000}(?:\s|$)/gu

  const chunks: string[] = []
  let match: RegExpExecArray | null
  while ((match = CHUNK_REGEX.exec(parsedText)) !== null) {
    chunks.push(match[0])
  }

  // Derive SG-local date fields from scheduledAt. publishDate (and the
  // day/month/year parsed out of it) are canonical stored/filtered Algolia
  // fields, so the DD/MM/YYYY shape must be deterministic across runtimes.
  // formatInTimeZone uses an explicit format token in an explicit timezone —
  // Asia/Singapore is pinned because gazette publish dates are always in
  // Singapore time (SGT = UTC+8), and a locale-based toLocaleDateString("en-SG")
  // can silently fall back to en-US on a minimal-ICU runtime and swap the
  // day/month order.
  const publishDate = formatInTimeZone(
    scheduledAt,
    "Asia/Singapore",
    "dd/MM/yyyy",
  )
  const publishDateParts = publishDate.split("/").map(Number)
  const day = publishDateParts[0] ?? 0
  const month = publishDateParts[1] ?? 0
  const year = publishDateParts[2] ?? 0

  // lexiNotificationNum is notificationNum left-padded to 10 digits.
  // 10 = egazette's MAX_NOTIFICATION_NUMBER_LENGTH; must match for consistent
  // sort ordering in Algolia.
  const lexiNotificationNum =
    notificationNum !== undefined && notificationNum.length > 0
      ? notificationNum.padStart(10, "0")
      : undefined

  return chunks.map((chunk, idx) => ({
    category,
    fileUrl,
    lexiNotificationNum,
    notificationNum,
    objectGroup,
    objectID: `${objectGroup}-text-${idx}`,
    publishDate,
    publishDay: day,
    publishMonth: month,
    publishTimestamp: scheduledAt.getTime(),
    publishYear: year,
    subCategory,
    text: chunk,
    title,
  }))
}
