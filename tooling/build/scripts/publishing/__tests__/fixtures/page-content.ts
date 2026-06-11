// Minimal-but-valid Isomer page schemas used as `Blob.content` in fixtures.
// `Blob.content` is `IsomerSchema` (a layout-discriminated union), so fixture
// content must be a real, minimally-valid page schema rather than arbitrary
// JSON — this validates real-shaped content end-to-end (plan decisions 7 & 10).

const ISOMER_SCHEMA_VERSION = "0.1.0"

export const contentPage = (summary: string) => ({
  version: ISOMER_SCHEMA_VERSION,
  layout: "content",
  page: {
    contentPageHeader: { summary },
  },
  content: [
    {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: summary }],
        },
      ],
    },
  ],
})

// A content page whose first block is an image, to exercise getResourceFirstImage.
export const contentPageWithImage = (summary: string, src: string) => ({
  version: ISOMER_SCHEMA_VERSION,
  layout: "content",
  page: {
    contentPageHeader: { summary },
  },
  content: [
    { type: "image", src, alt: "fixture image" },
    {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: summary }],
        },
      ],
    },
  ],
})

export const articlePage = (summary: string, category: string) => ({
  version: ISOMER_SCHEMA_VERSION,
  layout: "article",
  page: {
    date: "01/01/2026",
    category,
    articlePageHeader: { summary },
  },
  content: [],
})

// An index page carrying an explicit `childrenpages` ordering block. The
// ordering is filled in by the fixture builder once child resource ids exist.
export const indexPage = (childrenPagesOrdering: string[]) => ({
  version: ISOMER_SCHEMA_VERSION,
  layout: "index",
  page: {
    contentPageHeader: { summary: "Index" },
  },
  content: [
    {
      type: "childrenpages",
      childrenPagesOrdering,
    },
  ],
})
