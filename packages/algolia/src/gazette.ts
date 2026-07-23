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
export interface SearchRecord {
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
  [key: string]: unknown
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
  const data: string[] = await new Promise((resolve, reject) => {
    const parsedData: string[] = []
    pdfReader.parseBuffer(Buffer.from(pdfBuffer), (err, item) => {
      if (err) {
        reject(new Error(err))
      } else if (!item) {
        resolve(parsedData)
      } else if (item.text) {
        parsedData.push(item.text)
      }
    })
  })

  return data.join(" ")
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
  if (!parsedText) return []

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
  const CHUNK_REGEX = /.{1,7000}(?:\s|$)/g

  const chunks: string[] = []
  let match: RegExpExecArray | null
  while ((match = CHUNK_REGEX.exec(parsedText)) !== null) {
    chunks.push(match[0])
  }

  // Derive SG-local date fields from scheduledAt.
  // Asia/Singapore is pinned explicitly because gazette publish dates are
  // always expressed in Singapore time (SGT = UTC+8); using the server's
  // local time would produce wrong year/month/day for any deployment outside
  // the SGT zone.
  const publishDate = scheduledAt.toLocaleDateString("en-SG", {
    timeZone: "Asia/Singapore",
  })
  const [day, month, year] = publishDate.split("/").map(Number) as [
    number,
    number,
    number,
  ]

  // lexiNotificationNum is notificationNum left-padded to 10 digits.
  // 10 = egazette's MAX_NOTIFICATION_NUMBER_LENGTH; must match for consistent
  // sort ordering in Algolia.
  const lexiNotificationNum = notificationNum
    ? notificationNum.padStart(10, "0")
    : undefined

  return chunks.map((chunk, idx) => ({
    objectID: `${objectGroup}-text-${idx}`,
    objectGroup,
    title,
    category,
    subCategory,
    notificationNum,
    lexiNotificationNum,
    publishDate,
    publishYear: year,
    publishMonth: month,
    publishDay: day,
    publishTimestamp: scheduledAt.getTime(),
    fileUrl,
    text: chunk,
  }))
}
