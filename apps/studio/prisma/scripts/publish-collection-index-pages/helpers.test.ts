import { describe, expect, it } from "vitest"
import { createCollectionIndexJson } from "~/server/modules/collection/collection.service"

import type { ClassifiableRow, TagCategories } from "./helpers"
import {
  buildPublishedIndexBlob,
  classifyRow,
  readTagCategories,
  resolveTitle,
} from "./helpers"

const CATEGORY: TagCategories[number] = {
  label: "Category",
  id: "11111111-1111-4111-8111-111111111111",
  options: [
    { label: "Speeches", id: "22222222-2222-4222-8222-222222222222" },
    { label: "Press releases", id: "33333333-3333-4333-8333-333333333333" },
  ],
}

/** A draft blob as stored — untyped, because that is what classifyRow must cope with. */
const draftBlob = (
  page: Record<string, unknown> = {},
): Record<string, unknown> => ({
  layout: "collection",
  page: {
    title: "Newsroom",
    subtitle:
      "Read up-to-date news articles, speeches, and press releases here.",
    sortOrder: "date-desc",
    ...page,
  },
  content: [],
  version: "0.1.0",
})

const row = (overrides: Partial<ClassifiableRow> = {}): ClassifiableRow => ({
  resourceTitle: "Newsroom",
  parentTitle: "Newsroom",
  parentPermalink: "newsroom",
  draftContent: draftBlob(),
  collectionMetaVariant: null,
  ...overrides,
})

const expectPublish = (outcome: ReturnType<typeof classifyRow>) => {
  if (outcome.kind !== "publish") {
    throw new Error(`expected "publish", got "${outcome.kind}"`)
  }
  return outcome
}

describe("buildPublishedIndexBlob", () => {
  it("with no tagCategories is identical to a fresh createCollectionIndexJson", () => {
    expect(buildPublishedIndexBlob({ title: "Newsroom" })).toStrictEqual(
      createCollectionIndexJson("Newsroom"),
    )
  })

  it.each([
    ["absent", undefined],
    ["empty", [] as TagCategories],
  ])("omits the tagCategories key when %s", (_name, tagCategories) => {
    const result = buildPublishedIndexBlob({ title: "Newsroom", tagCategories })
    expect("tagCategories" in result.page).toBe(false)
  })

  it("carries tagCategories verbatim, in order", () => {
    const second = { ...CATEGORY, id: "44444444-4444-4444-8444-444444444444" }
    const result = buildPublishedIndexBlob({
      title: "Newsroom",
      tagCategories: [CATEGORY, second],
    })
    expect(result.page.tagCategories).toStrictEqual([CATEGORY, second])
  })

  it("does NOT stamp a default `display` when the source omits it", () => {
    // `display` has no JSON Schema default by design; render time resolves it.
    const result = buildPublishedIndexBlob({
      title: "Newsroom",
      tagCategories: [CATEGORY],
    })
    const [category] = result.page.tagCategories ?? []
    expect(category && "display" in category).toBe(false)
  })

  it("preserves an explicit display and isRequired", () => {
    const decorated = {
      ...CATEGORY,
      display: "plaintext" as const,
      isRequired: true,
    }
    expect(
      buildPublishedIndexBlob({ title: "Newsroom", tagCategories: [decorated] })
        .page.tagCategories,
    ).toStrictEqual([decorated])
  })
})

describe("readTagCategories", () => {
  it("returns undefined when the key is absent", () => {
    expect(readTagCategories(draftBlob())).toBeUndefined()
  })

  it("returns undefined when the key is explicitly null", () => {
    expect(
      readTagCategories(draftBlob({ tagCategories: null })),
    ).toBeUndefined()
  })

  it("clones so the result cannot alias the source row", () => {
    const source = [CATEGORY]
    const result = readTagCategories(draftBlob({ tagCategories: source }))
    expect(result).toStrictEqual([CATEGORY])
    expect(result).not.toBe(source)
  })

  it("copies whatever shape is present, with no validation", () => {
    expect(readTagCategories(draftBlob({ tagCategories: "nope" }))).toBe("nope")
  })
})

describe("resolveTitle", () => {
  it("prefers Collection Resource.title over stale draft blob page.title", () => {
    expect(
      resolveTitle({
        resourceTitle: "Index title",
        parentTitle: "Current collection name",
        parentPermalink: "newsroom",
        draftContent: draftBlob({ title: "Stale blob title" }),
      }),
    ).toEqual({ title: "Current collection name", source: "parent" })
  })

  it("falls back to IndexPage Resource.title when parent.title is blank", () => {
    expect(
      resolveTitle({
        resourceTitle: "Index title",
        parentTitle: "   ",
        parentPermalink: "newsroom",
      }),
    ).toEqual({ title: "Index title", source: "resource" })
  })

  it("falls back to a permalink-derived title when both Resource titles are blank", () => {
    expect(
      resolveTitle({
        resourceTitle: "",
        parentTitle: " ",
        parentPermalink: "press-releases",
      }),
    ).toEqual({ title: "Press releases", source: "permalink" })
  })

  it("returns an empty title when nothing is available", () => {
    expect(
      resolveTitle({
        resourceTitle: "",
        parentTitle: "",
        parentPermalink: "",
      }),
    ).toEqual({ title: "", source: "parent" })
  })
})

describe("classifyRow", () => {
  it("carries over only title and tagCategories", () => {
    const outcome = expectPublish(
      classifyRow(
        row({
          draftContent: {
            ...draftBlob({
              subtitle: "Hand written summary",
              variant: "collection",
              sortOrder: "title-asc",
              showDate: false,
              image: { src: "/x.png", alt: "x" },
              defaultSortBy: "title",
              tags: [{ category: "Category", selected: ["Speeches"] }],
              category: "Feature Articles",
              somethingUnknown: true,
              tagCategories: [CATEGORY],
            }),
            meta: { description: "seo" },
            content: [{ type: "prose" }],
          },
        }),
      ),
    )

    expect(Object.keys(outcome.next.page).sort()).toEqual([
      "sortOrder",
      "subtitle",
      "tagCategories",
      "title",
    ])
    expect(outcome.next.page).toMatchObject({
      title: "Newsroom",
      subtitle:
        "Read up-to-date news articles, speeches, and press releases here.",
      sortOrder: "date-desc",
    })
    expect(outcome.next.content).toStrictEqual([])
    expect("meta" in outcome.next).toBe(false)
    expect(outcome.tagCategoryCount).toBe(1)
    expect(outcome.titleSource).toBe("parent")
  })

  it("still publishes when every title source is empty", () => {
    const outcome = expectPublish(
      classifyRow(
        row({
          resourceTitle: "",
          parentTitle: "",
          parentPermalink: "",
          draftContent: draftBlob({ title: "Ignored blob title" }),
        }),
      ),
    )
    expect(outcome.titleSource).toBe("parent")
    expect(outcome.next.page.title).toBe("")
  })

  it.each([
    ["draftContent is not an object", "just a string"],
    ["draftContent is null", null],
    ["page is absent", { layout: "collection", content: [] }],
  ])("still publishes a clean blob when %s", (_name, draftContent) => {
    const outcome = expectPublish(classifyRow(row({ draftContent })))
    expect(outcome.titleSource).toBe("parent")
    expect(outcome.next.page.title).toBe("Newsroom")
  })

  it.each([
    [
      "the draft blob variant",
      { draftContent: draftBlob({ variant: "blog" }) },
    ],
    ["the CollectionMeta variant", { collectionMetaVariant: "blog" }],
  ])("flags a variant flip from %s", (_name, overrides) => {
    expect(expectPublish(classifyRow(row(overrides))).variantFlip).toBe(true)
  })

  it("does not flag a variant flip for collection-variant rows", () => {
    expect(
      expectPublish(
        classifyRow(
          row({
            draftContent: draftBlob({ variant: "collection" }),
            collectionMetaVariant: "collection",
          }),
        ),
      ).variantFlip,
    ).toBe(false)
  })
})
