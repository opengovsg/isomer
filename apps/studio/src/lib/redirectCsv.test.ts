import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import {
  BULK_REDIRECT_CSV_ERROR_HEADER,
  BULK_REDIRECT_CSV_HEADERS,
  BULK_REDIRECT_CSV_NO_ERROR,
  buildRedirectErrorsCsv,
  parseRedirectCsv,
} from "./redirectCsv"

const { source: SOURCE_HEADER, destination: DESTINATION_HEADER } =
  BULK_REDIRECT_CSV_HEADERS

const header = `${SOURCE_HEADER},${DESTINATION_HEADER}`

describe("parseRedirectCsv", () => {
  it("parses rows with 1-based line numbers and trims cells", () => {
    // Arrange
    const csv = `${header}\n/old , /new\n/blog,https://example.gov.sg`

    // Act
    const result = parseRedirectCsv(csv)

    // Assert
    expect(result.fileError).toBeUndefined()
    expect(result.rows).toEqual([
      { rowNumber: 2, source: "/old", destination: "/new", malformed: false },
      {
        rowNumber: 3,
        source: "/blog",
        destination: "https://example.gov.sg",
        malformed: false,
      },
    ])
  })

  it("flags a row split by an unquoted comma as malformed", () => {
    // Arrange: the destination contains an unquoted comma, so it splits into a
    // stray third field that would otherwise silently truncate the destination.
    const csv = `${header}\n/old,https://example.gov.sg/a,b`

    // Act
    const result = parseRedirectCsv(csv)

    // Assert
    expect(result.rows?.[0]).toMatchObject({ source: "/old", malformed: true })
  })

  it("does not flag a well-formed row (or a benign trailing comma) as malformed", () => {
    // Arrange / Act
    const result = parseRedirectCsv(`${header}\n/old,/new,`)

    // Assert: the extra column is empty, so the row is not malformed.
    expect(result.rows?.[0]).toMatchObject({
      destination: "/new",
      malformed: false,
    })
  })

  it("matches columns by name regardless of order, case, or extra columns", () => {
    // Arrange: reversed order, different case, and an extra Error column (as a
    // re-uploaded errors file would have).
    const csv = [
      `${BULK_REDIRECT_CSV_ERROR_HEADER},redirect them to,WHEN SOMEONE VISITS`,
      `No error,/new,/old`,
    ].join("\n")

    // Act
    const result = parseRedirectCsv(csv)

    // Assert
    expect(result.rows).toEqual([
      { rowNumber: 2, source: "/old", destination: "/new", malformed: false },
    ])
  })

  it("strips a leading BOM before reading the header", () => {
    // Arrange
    const csv = `﻿${header}\n/old,/new`

    // Act
    const result = parseRedirectCsv(csv)

    // Assert
    expect(result.rows).toHaveLength(1)
    expect(result.rows?.[0]).toMatchObject({ source: "/old" })
  })

  it("flags a missing required column as a file error", () => {
    // Arrange
    const csv = `${SOURCE_HEADER},something else\n/old,/new`

    // Act
    const result = parseRedirectCsv(csv)

    // Assert
    expect(result.rows).toBeUndefined()
    expect(result.fileError).toContain(DESTINATION_HEADER)
  })

  it("flags an empty file", () => {
    // Arrange / Act
    const result = parseRedirectCsv("   \n  ")

    // Assert
    expect(result.fileError).toContain("empty")
  })

  it("flags a header-only file as having no redirects", () => {
    // Arrange / Act
    const result = parseRedirectCsv(header)

    // Assert
    expect(result.fileError).toContain("no redirects")
  })
})

describe("buildRedirectErrorsCsv", () => {
  it("lists failed rows first, keeps passing rows marked 'No error', and round-trips", () => {
    // Arrange
    const rows = [
      { source: "/ok", destination: "/fine", error: null },
      { source: "/bad", destination: "not a url", error: "Enter a valid URL." },
    ]

    // Act
    const csv = buildRedirectErrorsCsv(rows)
    const reparsed = parseRedirectCsv(csv)

    // Assert: failed row is first, and the Error column is ignored on re-parse.
    const lines = csv.split(/\r?\n/)
    expect(lines[0]).toContain(BULK_REDIRECT_CSV_ERROR_HEADER)
    expect(lines[1]).toContain("Enter a valid URL.")
    expect(csv).toContain(BULK_REDIRECT_CSV_NO_ERROR)
    expect(reparsed.rows).toEqual([
      {
        rowNumber: 2,
        source: "/bad",
        destination: "not a url",
        malformed: false,
      },
      { rowNumber: 3, source: "/ok", destination: "/fine", malformed: false },
    ])
  })
})

describe("redirects template file", () => {
  it("has the exact header the parser expects (guards against drift)", () => {
    // Arrange
    const templatePath = fileURLToPath(
      new URL("../../public/redirects-template.csv", import.meta.url),
    )

    // Act
    const contents = readFileSync(templatePath, "utf8")
    const firstLine = contents.replace(/^﻿/, "").split(/\r?\n/)[0]

    // Assert
    expect(firstLine).toBe(`${SOURCE_HEADER},${DESTINATION_HEADER}`)
  })
})
