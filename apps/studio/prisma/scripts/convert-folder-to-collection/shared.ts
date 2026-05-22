import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

import { db, ResourceType } from "~/server/modules/database"

import type { ConversionPlan } from "./helpers"

// ---------------------------------------------------------------------------
// DB verification
// ---------------------------------------------------------------------------

export const verifySite = async (siteId: number) => {
  const site = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select(["id", "name"])
    .executeTakeFirst()
  if (!site) throw new Error(`Site ${siteId} not found`)
  return site
}

export const verifyFolder = async (folderId: string, siteId: number) => {
  const folder = await db
    .selectFrom("Resource")
    .where("id", "=", folderId)
    .where("siteId", "=", siteId)
    .select(["id", "siteId", "title", "permalink", "type"])
    .executeTakeFirst()
  if (!folder) {
    throw new Error(`Resource ${folderId} not found on site ${siteId}`)
  }
  if (folder.type !== ResourceType.Folder) {
    throw new Error(
      `Resource ${folderId} is type=${folder.type}, expected Folder`,
    )
  }
  return folder
}

export const verifyUser = async (userId: string) => {
  const user = await db
    .selectFrom("User")
    .where("id", "=", userId)
    .select("id")
    .executeTakeFirst()
  if (!user) throw new Error(`User ${userId} not found`)
  return user
}

// ---------------------------------------------------------------------------
// Plan + report I/O
// ---------------------------------------------------------------------------

const outDir = () => join(dirname(fileURLToPath(import.meta.url)), ".out")

export const writePlanFile = (plan: ConversionPlan): string => {
  const dir = outDir()
  mkdirSync(dir, { recursive: true })
  const file = join(dir, `convert-folder-${plan.folder.id}-${Date.now()}.json`)
  writeFileSync(file, JSON.stringify(plan, null, 2))
  return file
}

export const readPlanFile = (path: string): ConversionPlan => {
  return JSON.parse(readFileSync(path, "utf-8")) as ConversionPlan
}

export const findLatestPlanForFolder = (
  folderId: string,
): string | undefined => {
  const dir = outDir()
  let files: string[]
  try {
    files = readdirSync(dir)
  } catch {
    return undefined
  }
  const matches = files
    .filter(
      (f) =>
        f.startsWith(`convert-folder-${folderId}-`) && f.endsWith(".json"),
    )
    .sort()
  const latest = matches[matches.length - 1]
  return latest ? join(dir, latest) : undefined
}

export const writeReportFile = (
  plan: ConversionPlan,
  jsonPath: string,
): string => {
  const reportPath = jsonPath.replace(/\.json$/, ".report.md")
  writeFileSync(reportPath, renderReport(plan))
  return reportPath
}

const renderReport = (plan: ConversionPlan): string => {
  const lines: string[] = []
  lines.push(`# Folder → Collection conversion report`)
  lines.push(``)
  lines.push(`- **Folder**: ${plan.folder.title} (id=${plan.folder.id})`)
  lines.push(`- **Site**: ${plan.folder.siteId}`)
  lines.push(`- **Permalink**: ${plan.folder.permalink}`)
  lines.push(`- **Default category**: ${plan.defaultCategory}`)
  lines.push(`- **Total pages**: ${plan.pages.length}`)
  lines.push(``)
  lines.push(`## Index page`)
  lines.push(
    `- "${plan.indexPage.title}" (id=${plan.indexPage.resourceId}) → layout=collection`,
  )
  lines.push(``)

  lines.push(`## Pages`)
  lines.push(``)
  lines.push(`| Title | ID | Blocks | Disallowed-in-article |`)
  lines.push(`| --- | --- | ---: | --- |`)
  for (const p of plan.pages) {
    const flagged =
      p.disallowedBlocks.length > 0
        ? p.disallowedBlocks.map((b) => `${b.type}@${b.index}`).join(", ")
        : "—"
    lines.push(
      `| ${p.title} | ${p.resourceId} | ${p.currentBlob.content.length} | ${flagged} |`,
    )
  }
  lines.push(``)

  const flaggedTypes = new Map<string, number>()
  for (const p of plan.pages) {
    for (const b of p.disallowedBlocks) {
      flaggedTypes.set(b.type, (flaggedTypes.get(b.type) ?? 0) + 1)
    }
  }
  if (flaggedTypes.size > 0) {
    lines.push(`## Disallowed block types (summary)`)
    lines.push(``)
    for (const [t, n] of flaggedTypes) lines.push(`- \`${t}\`: ${n}`)
    lines.push(``)
    lines.push(
      `> These blocks are preserved in the blob and continue to render,`,
    )
    lines.push(
      `> but editors will not be able to add new blocks of these types via the Studio UI.`,
    )
  } else {
    lines.push(`## Disallowed block types (summary)`)
    lines.push(``)
    lines.push(`None — all pages are fully article-layout compatible.`)
  }
  lines.push(``)
  return lines.join("\n")
}

// ---------------------------------------------------------------------------
// Console preview
// ---------------------------------------------------------------------------

export const printPlan = (plan: ConversionPlan) => {
  console.log("\n=== Folder → Collection conversion preview ===")
  console.log(`Folder      : ${plan.folder.title} (id=${plan.folder.id})`)
  console.log(`Site        : ${plan.folder.siteId}`)
  console.log(`Permalink   : ${plan.folder.permalink}`)
  console.log(`Default category for articles: "${plan.defaultCategory}"`)
  console.log(`Total pages : ${plan.pages.length}`)
  console.log(
    `\nIndex page  : "${plan.indexPage.title}" → layout=collection (subtitle from contentPageHeader.summary)`,
  )

  const flaggedTypes = new Map<string, number>()
  console.log("\nPages:")
  for (const p of plan.pages) {
    const contentBlocks = p.currentBlob.content
    const flagStr =
      p.disallowedBlocks.length > 0
        ? ` ⚠ disallowed-in-article blocks: ${p.disallowedBlocks
            .map((b) => `${b.type}@${b.index}`)
            .join(", ")}`
        : ""
    for (const b of p.disallowedBlocks) {
      flaggedTypes.set(b.type, (flaggedTypes.get(b.type) ?? 0) + 1)
    }
    console.log(
      `  • ${p.title} (id=${p.resourceId}, ${contentBlocks.length} blocks)${flagStr}`,
    )
  }

  if (flaggedTypes.size > 0) {
    console.log(
      `\n⚠  Article layout does not list these as allowed editor blocks:`,
    )
    for (const [t, n] of flaggedTypes) console.log(`     - ${t}: ${n}`)
    console.log(
      "   The blocks will be preserved in the blob — they will continue to render —",
    )
    console.log(
      "   but editors will not be able to add new blocks of these types via the Studio UI.",
    )
  }
}

// ---------------------------------------------------------------------------
// Prompt validators
// ---------------------------------------------------------------------------

export const validateNumericId = (label: string) => (v: string) =>
  /^\d+$/.test(v.trim()) || `${label} must be a numeric string`
