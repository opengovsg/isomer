import assert from "node:assert/strict"
import { test } from "node:test"

import {
  generateHtml,
  getDefaultDateRange,
  isValidDate,
  prepareGazettes,
} from "./create-static-page"

void test("static export handles Singapore dates, month ends, and safe HTML links", () => {
  assert.deepEqual(getDefaultDateRange(new Date("2026-09-15T16:00:00Z")), {
    from: "2026-06-16",
    to: "2026-09-16",
  })
  assert.deepEqual(getDefaultDateRange(new Date("2026-05-31T00:00:00+08:00")), {
    from: "2026-02-28",
    to: "2026-05-31",
  })
  assert.deepEqual(getDefaultDateRange(new Date("2024-05-31T00:00:00+08:00")), {
    from: "2024-02-29",
    to: "2024-05-31",
  })
  assert.deepEqual(getDefaultDateRange(new Date("2026-01-01T00:00:00+08:00")), {
    from: "2025-10-01",
    to: "2026-01-01",
  })
  assert.equal(isValidDate("2024-02-29"), true)
  for (const date of [
    "2026-02-29",
    "2026-04-31",
    "2026-13-01",
    "15/09/2026",
    "0000-01-01",
    "",
  ]) {
    assert.equal(isValidDate(date), false)
  }

  const gazette = {
    title: '<script>alert("x")</script> & Gazette',
    ref: "/2026/Government Gazette/a #1?.pdf",
    category: "Government & Gazette",
    subCategory: "Acts <Supplement>",
    number: null,
    date: "15/09/2026",
  }
  const html = generateHtml([gazette], "assets.example.gov.sg")
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
  assert.ok(
    generateHtml([], "assets.example.gov.sg").includes("No published gazettes"),
  )
  for (const ref of [
    "javascript:alert(1)",
    "//other.example/file.pdf",
    "/../file.pdf",
    "/\\other.example/file.pdf",
  ]) {
    assert.throws(
      () => generateHtml([{ ...gazette, ref }], "assets.example.gov.sg"),
      /Invalid PDF reference/,
    )
  }
  for (const domain of [
    "https://assets.example.gov.sg",
    "assets.example.gov.sg/path",
    "user:password@assets.example.gov.sg",
  ]) {
    assert.throws(() => generateHtml([], domain))
  }
})

void test("exports valid records despite bad metadata, with inclusive dates and warnings", () => {
  const row = {
    id: "1",
    title: "Start boundary",
    ref: "/2026/gazette.pdf",
    category: "Government Gazette",
    subCategory: "Acts",
    number: "123",
    date: "15/06/2026",
  }
  const { gazettes, warnings } = prepareGazettes(
    [
      row,
      { ...row, id: "2", title: "Too early", date: "14/06/2026" },
      { ...row, id: "3", title: "Bad calendar date", date: "31/06/2026" },
      { ...row, id: "4", title: "Missing date", date: null },
      { ...row, id: "5", title: "Missing PDF", ref: null },
      { ...row, id: "6", title: "Unsafe PDF", ref: "javascript:alert(1)" },
      { ...row, id: "7", title: "End boundary", date: "15/09/2026" },
      { ...row, id: "8", title: "Too late", date: "16/09/2026" },
      {
        ...row,
        id: "9",
        title: "Missing optional metadata",
        date: "01/07/2026",
        category: null,
        subCategory: null,
        number: null,
      },
      { ...row, id: "10", title: "Same-day publication", date: "15/09/2026" },
    ],
    "2026-06-15",
    "2026-09-15",
  )
  assert.deepEqual(
    gazettes.map((gazette) => gazette.title),
    [
      "End boundary",
      "Same-day publication",
      "Missing optional metadata",
      "Start boundary",
    ],
  )
  assert.deepEqual(warnings, [
    "[3] Skipped: missing or invalid publication date.",
    "[4] Skipped: missing or invalid publication date.",
    "[5] Skipped: missing or invalid PDF reference.",
    "[6] Skipped: missing or invalid PDF reference.",
    "[9] Missing category; displaying N/A.",
    "[9] Missing or unknown subcategory; displaying N/A.",
  ])
  const html = generateHtml(gazettes, "assets.example.gov.sg")
  assert.equal(html.match(/class="gazette-item"/g)?.length, 4)
  assert.ok(html.includes("Category: N/A, Sub-Category: N/A"))
  assert.ok(!html.includes("Unsafe PDF"))
})
