// Generates a synthetic coverage site exercising every block and layout, in apps/template's
// on-disk layout (data/, schema/, sitemap.json). Usage:
//   tsx scripts/make-fixture.ts <outDir> [totalPages=60]
// Extra pages are articles spread across collections of up to 100 items each.
import fs from "node:fs"
import path from "node:path"

import {
  CONTENT_ALLOWED_BLOCKS,
  DEFAULT_BLOCKS,
  HOMEPAGE_ALLOWED_BLOCKS,
} from "../../../apps/studio/src/components/PageEditor/constants"
import articleTemplate from "../../../apps/studio/src/features/editing-experience/data/articleLayoutPreview.json"
import contentTemplate from "../../../apps/studio/src/features/editing-experience/data/contentLayoutPreview.json"
import databaseTemplate from "../../../apps/studio/src/features/editing-experience/data/databaseLayoutPreview.json"
import footer from "../../../apps/studio/src/features/editing-experience/data/footer.json"
import navbar from "../../../apps/studio/src/features/editing-experience/data/navbar.json"
import homepageTemplate from "../../../apps/studio/src/features/editing-experience/data/placeholder.json"

const [outDir, totalArg = "60"] = process.argv.slice(2)
if (!outDir) throw new Error("usage: make-fixture.ts <outDir> [totalPages]")
const TOTAL_PAGES = Number(totalArg)
const COLLECTION_SIZE = 100
// Local image so measurements never wait on the network (images are excluded from byte counts).
const IMG = "/placeholder_no_image.png"
const LAST_MODIFIED = "2026-01-01T00:00:00.000Z"

// Every string field that looks like an image URL is pointed at the local placeholder.
const localiseImages = <T>(value: T): T =>
  JSON.parse(
    JSON.stringify(value).replace(
      /"(src|backgroundUrl|imageUrl|image|url)":"(https?:\/\/[^"]*\.(?:png|jpe?g|webp|svg|gif)[^"]*|https:\/\/images\.unsplash\.com[^"]*)"/g,
      `"$1":"${IMG}"`,
    ),
  ) as T

const blocksFor = (sections: { types: string[] }[]) =>
  sections
    .flatMap((s) => s.types)
    .filter((t): t is keyof typeof DEFAULT_BLOCKS => t in DEFAULT_BLOCKS)
    .map((t) => DEFAULT_BLOCKS[t])

const paragraph = (text: string) => ({
  type: "paragraph",
  content: [{ type: "text", text }],
})
const prose = {
  type: "prose",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "About this page" }],
    },
    paragraph(
      "Isomer is a website builder made for government teams. This paragraph stands in for real long-form content so pages carry a realistic amount of text.",
    ),
    paragraph(
      "Agencies publish announcements, guides and datasets. Each page is assembled from blocks that site editors pick in Studio and publish as static HTML.",
    ),
  ],
}

const heroCarousel = {
  type: "hero",
  variant: "carousel",
  carousel: { layout: "block", imagePosition: "right" },
  slides: [1, 2, 3].map((i) => ({
    backgroundUrl: IMG,
    title: `Slide ${i}: set up good government websites, fast`,
    subtitle: "Isomer is a website builder made for government teams.",
    buttonLabel: "Get started",
    buttonUrl: "/content",
  })),
}

const pages: Record<string, unknown> = {}
const write = (permalink: string, schema: unknown) => {
  pages[permalink === "/" ? "_index" : permalink.slice(1)] =
    localiseImages(schema)
}

const contentPageHeader = { summary: "A page summary shown under the title." }
write("/", {
  ...homepageTemplate,
  content: [heroCarousel, ...blocksFor(HOMEPAGE_ALLOWED_BLOCKS)],
})
write("/content", {
  ...contentTemplate,
  page: {
    ...contentTemplate.page,
    title: "Every content block",
    contentPageHeader,
  },
  content: [prose, ...blocksFor(CONTENT_ALLOWED_BLOCKS)],
})
write("/database", {
  ...databaseTemplate,
  page: { ...databaseTemplate.page, title: "Database", contentPageHeader },
})

const FIXED_PAGES = 3
const articleCount = Math.max(TOTAL_PAGES - FIXED_PAGES, 1)
const collectionCount = Math.ceil(articleCount / (COLLECTION_SIZE + 1))
const TAG_OPTIONS = [
  "Announcements",
  "Guides",
  "Speeches",
  "Press releases",
].map((label, i) => ({
  label,
  id: `tag-${i}`,
}))

const collections = Array.from({ length: collectionCount }, (_, c) => {
  const permalink = `/collection-${c + 1}`
  const itemCount = Math.min(
    COLLECTION_SIZE,
    articleCount - c * (COLLECTION_SIZE + 1) - 1,
  )
  const items = Array.from({ length: Math.max(itemCount, 1) }, (_, i) => {
    const itemPermalink = `${permalink}/article-${i + 1}`
    const date = new Date(Date.UTC(2020 + (i % 6), i % 12, (i % 27) + 1))
      .toISOString()
      .slice(0, 10)
    const tagged = [TAG_OPTIONS[i % TAG_OPTIONS.length]!.id]
    write(itemPermalink, {
      ...articleTemplate,
      page: {
        ...articleTemplate.page,
        title: `Article ${i + 1} in collection ${c + 1}`,
        date,
        tagged,
      },
    })
    return {
      id: `${c}-${i}`,
      permalink: itemPermalink,
      lastModified: LAST_MODIFIED,
      layout: "article",
      title: `Article ${i + 1} in collection ${c + 1}`,
      summary: "A summary of the article that appears on the collection card.",
      date,
      tagged,
      image: { src: IMG, alt: "" },
    }
  })
  write(permalink, {
    version: "0.1.0",
    layout: "collection",
    page: {
      title: `Collection ${c + 1}`,
      subtitle: "Articles, announcements and press releases.",
      tagCategories: [
        {
          label: "Topic",
          id: "topic",
          isRequired: false,
          display: "pills",
          options: TAG_OPTIONS,
        },
      ],
    },
    content: [],
  })
  return {
    id: `collection-${c}`,
    permalink,
    lastModified: LAST_MODIFIED,
    layout: "collection",
    title: `Collection ${c + 1}`,
    summary: "",
    children: items,
  }
})

const sitemap = {
  id: "root",
  permalink: "/",
  lastModified: LAST_MODIFIED,
  layout: "homepage",
  title: "Home",
  summary: "",
  children: [
    {
      id: "content",
      permalink: "/content",
      lastModified: LAST_MODIFIED,
      layout: "content",
      title: "Every content block",
      summary: "",
    },
    {
      id: "database",
      permalink: "/database",
      lastModified: LAST_MODIFIED,
      layout: "database",
      title: "Database",
      summary: "",
    },
    ...collections,
  ],
}

const config = JSON.parse(
  fs.readFileSync(
    path.join(import.meta.dirname, "../../../apps/template/data/config.json"),
    "utf8",
  ),
) as Record<string, unknown>

fs.rmSync(outDir, { recursive: true, force: true })
const put = (file: string, data: unknown) => {
  const full = path.join(outDir, file)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, JSON.stringify(data, null, 2))
}
put("data/config.json", config)
put("data/navbar.json", localiseImages(navbar))
put("data/footer.json", footer)
put("sitemap.json", sitemap)
for (const [file, schema] of Object.entries(pages))
  put(`schema/${file}.json`, schema)
// apps/template's publisher copies the homepage to not-found.json (see app/not-found.tsx).
put("schema/not-found.json", pages._index)

console.log(`Wrote ${Object.keys(pages).length} pages to ${outDir}`)
