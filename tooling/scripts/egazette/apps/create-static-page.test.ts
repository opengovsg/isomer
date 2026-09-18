import assert from "node:assert/strict"
import { test } from "node:test"

import {
  generateHtml,
  getDefaultDateRange,
  isValidDate,
  prepareGazettes,
} from "./create-static-page"

void test("getDefaultDateRange defaults to three Singapore-time calendar months back", () => {
  // Arrange
  const now = new Date("2026-09-15T16:00:00Z")

  // Act
  const range = getDefaultDateRange(now)

  // Assert
  assert.deepEqual(range, { from: "2026-06-16", to: "2026-09-16" })
})

void test("getDefaultDateRange clamps a 31-day start month to a shorter month's last day", () => {
  // Arrange
  const now = new Date("2026-05-31T00:00:00+08:00")

  // Act
  const range = getDefaultDateRange(now)

  // Assert
  assert.deepEqual(range, { from: "2026-02-28", to: "2026-05-31" })
})

void test("getDefaultDateRange clamps to 29 February in a leap year", () => {
  // Arrange
  const now = new Date("2024-05-31T00:00:00+08:00")

  // Act
  const range = getDefaultDateRange(now)

  // Assert
  assert.deepEqual(range, { from: "2024-02-29", to: "2024-05-31" })
})

void test("getDefaultDateRange crosses a year boundary", () => {
  // Arrange
  const now = new Date("2026-01-01T00:00:00+08:00")

  // Act
  const range = getDefaultDateRange(now)

  // Assert
  assert.deepEqual(range, { from: "2025-10-01", to: "2026-01-01" })
})

void test("isValidDate accepts a real calendar date, including a leap day", () => {
  // Act & Assert
  assert.equal(isValidDate("2024-02-29"), true)
})

void test("isValidDate rejects malformed or non-existent dates", () => {
  // Arrange
  const invalidDates = [
    "2026-02-29",
    "2026-04-31",
    "2026-13-01",
    "15/09/2026",
    "0000-01-01",
    "",
  ]

  // Act & Assert
  for (const date of invalidDates) {
    assert.equal(isValidDate(date), false)
  }
})

void test("generateHtml escapes HTML and renders gazette metadata", () => {
  // Arrange
  const gazette = {
    title: '<script>alert("x")</script> & Gazette',
    ref: "/2026/Government Gazette/a #1?.pdf",
    category: "Government & Gazette",
    subCategory: "Acts <Supplement>",
    number: null,
    date: "15/09/2026",
  }

  // Act
  const html = generateHtml([gazette], "assets.example.gov.sg")

  // Assert
  assert.ok(html.startsWith("<!DOCTYPE html>"))
  assert.ok(html.endsWith("</html>\n"))
  assert.ok(!html.includes("<script>"))
  assert.ok(
    html.includes(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; Gazette",
    ),
  )
  assert.ok(
    html.includes(
      "Category: Government &amp; Gazette, Sub-Category: Acts &lt;Supplement&gt;",
    ),
  )
  assert.ok(html.includes("Number: N/A"))
  assert.ok(html.includes("Date of publication: 15/09/2026"))
  assert.ok(
    html.includes(
      'href="https://assets.example.gov.sg/2026/Government%20Gazette/a%20%231%3F.pdf"',
    ),
  )
})

void test("generateHtml renders a placeholder message for an empty gazette list", () => {
  // Act
  const html = generateHtml([], "assets.example.gov.sg")

  // Assert
  assert.ok(html.includes("No published gazettes"))
})

void test("generateHtml rejects unsafe or non-local PDF references", () => {
  // Arrange
  const gazette = {
    title: "Gazette",
    ref: "/2026/gazette.pdf",
    category: "Government Gazette",
    subCategory: "Acts",
    number: "123",
    date: "15/09/2026",
  }
  const unsafeRefs = [
    "javascript:alert(1)",
    "//other.example/file.pdf",
    "/../file.pdf",
    "/\\other.example/file.pdf",
  ]

  // Act & Assert
  for (const ref of unsafeRefs) {
    assert.throws(
      () => generateHtml([{ ...gazette, ref }], "assets.example.gov.sg"),
      /Invalid PDF reference/,
    )
  }
})

void test("generateHtml rejects a domain that isn't a bare hostname", () => {
  // Arrange
  const invalidDomains = [
    "https://assets.example.gov.sg",
    "assets.example.gov.sg/path",
    "user:password@assets.example.gov.sg",
  ]

  // Act & Assert
  for (const domain of invalidDomains) {
    assert.throws(() => generateHtml([], domain))
  }
})

void test("prepareGazettes filters to the inclusive date range and sorts newest first", () => {
  // Arrange
  const row = {
    id: "1",
    title: "Start boundary",
    ref: "/2026/gazette.pdf",
    category: "Government Gazette",
    subCategory: "Acts",
    number: "123",
    date: "15/06/2026",
  }
  const rows = [
    row,
    { ...row, id: "2", title: "Too early", date: "14/06/2026" },
    { ...row, id: "7", title: "End boundary", date: "15/09/2026" },
    { ...row, id: "8", title: "Too late", date: "16/09/2026" },
    { ...row, id: "10", title: "Same-day publication", date: "15/09/2026" },
  ]

  // Act
  const { gazettes } = prepareGazettes(rows, "2026-06-15", "2026-09-15")

  // Assert
  assert.deepEqual(
    gazettes.map((gazette) => gazette.title),
    ["End boundary", "Same-day publication", "Start boundary"],
  )
})

void test("prepareGazettes skips records with missing or invalid dates or PDF references, warning per record", () => {
  // Arrange
  const row = {
    id: "1",
    title: "Valid",
    ref: "/2026/gazette.pdf",
    category: "Government Gazette",
    subCategory: "Acts",
    number: "123",
    date: "15/06/2026",
  }
  const rows = [
    { ...row, id: "3", title: "Bad calendar date", date: "31/06/2026" },
    { ...row, id: "4", title: "Missing date", date: null },
    { ...row, id: "5", title: "Missing PDF", ref: null },
    { ...row, id: "6", title: "Unsafe PDF", ref: "javascript:alert(1)" },
  ]

  // Act
  const { gazettes, warnings } = prepareGazettes(
    rows,
    "2026-06-01",
    "2026-06-30",
  )

  // Assert
  assert.deepEqual(gazettes, [])
  assert.deepEqual(warnings, [
    "[3] Skipped: missing or invalid publication date.",
    "[4] Skipped: missing or invalid publication date.",
    "[5] Skipped: missing or invalid PDF reference.",
    "[6] Skipped: missing or invalid PDF reference.",
  ])
})

void test("prepareGazettes keeps a record with missing optional metadata, warning per field", () => {
  // Arrange
  const row = {
    id: "9",
    title: "Missing optional metadata",
    ref: "/2026/gazette.pdf",
    category: null,
    subCategory: null,
    number: null,
    date: "01/07/2026",
  }

  // Act
  const { gazettes, warnings } = prepareGazettes(
    [row],
    "2026-07-01",
    "2026-07-31",
  )

  // Assert
  assert.deepEqual(
    gazettes.map((gazette) => gazette.title),
    ["Missing optional metadata"],
  )
  assert.deepEqual(warnings, [
    "[9] Missing category; displaying N/A.",
    "[9] Missing or unknown subcategory; displaying N/A.",
  ])
})

void test("prepareGazettes output renders missing metadata as N/A and excludes filtered-out records", () => {
  // Arrange
  const row = {
    id: "1",
    title: "Valid",
    ref: "/2026/gazette.pdf",
    category: null,
    subCategory: null,
    number: "123",
    date: "15/06/2026",
  }
  const excluded = {
    ...row,
    id: "6",
    title: "Unsafe PDF",
    ref: "javascript:alert(1)",
  }

  // Act
  const { gazettes } = prepareGazettes(
    [row, excluded],
    "2026-06-01",
    "2026-06-30",
  )
  const html = generateHtml(gazettes, "assets.example.gov.sg")

  // Assert
  assert.equal(html.match(/class="gazette-item"/g)?.length, 1)
  assert.ok(html.includes("Category: N/A, Sub-Category: N/A"))
  assert.ok(!html.includes("Unsafe PDF"))
})
