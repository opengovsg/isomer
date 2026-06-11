import { describe, expect, it } from "vitest"

import type { PageOnlySitemapEntry, Resource, SitemapEntry } from "../types"
import {
  buildPageSitemapEntry,
  DANGLING_DIRECTORY_PAGE_ID,
  generateSitemapTree,
  getConvertedPermalink,
  getDanglingDirectoryIndexPages,
  getFoldersAndCollections,
} from "../sitemap"

// Minimal Resource factory. The pure functions only read a handful of fields,
// so we cast through `unknown` to keep fixtures terse while preserving the
// runtime shape the code actually touches.
const resource = (r: Partial<Resource>): Resource =>
  ({
    id: "r",
    title: "Resource",
    permalink: "",
    type: "Page",
    parentId: null,
    fullPermalink: "",
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...r,
  }) as unknown as Resource

const pageEntry = (e: Partial<PageOnlySitemapEntry>): PageOnlySitemapEntry =>
  ({
    id: "p",
    title: "Page",
    type: "Page",
    permalink: "/page",
    lastModified: "2026-01-01T00:00:00.000Z",
    layout: "content",
    summary: "",
    ...e,
  }) as PageOnlySitemapEntry

describe("getConvertedPermalink", () => {
  it("strips a trailing _index segment", () => {
    expect(getConvertedPermalink("parent-folder/_index")).toBe("parent-folder")
  })

  it("strips a trailing _meta segment", () => {
    expect(getConvertedPermalink("parent-folder/_meta")).toBe("parent-folder")
  })

  it("strips the resulting trailing slash after removing _index", () => {
    // "_index" alone -> "" after slice, no trailing slash; a bare root index
    // collapses to empty string.
    expect(getConvertedPermalink("_index")).toBe("")
  })

  it("leaves a normal permalink untouched", () => {
    expect(getConvertedPermalink("parent-folder/about")).toBe(
      "parent-folder/about",
    )
  })

  it("matches _index as a suffix anywhere (current endsWith behavior)", () => {
    // Documents the current quirk: any permalink *ending* in the literal
    // "_index" is trimmed, even mid-segment text like "foo_index".
    expect(getConvertedPermalink("foo_index")).toBe("foo")
  })
})

describe("buildPageSitemapEntry", () => {
  const base = resource({
    id: "page-1",
    title: "About Page",
    type: "Page",
    fullPermalink: "parent-folder/about",
    content: {
      layout: "content",
      page: { contentPageHeader: { summary: "About summary" } },
    },
  })

  it("projects a page resource into a sitemap entry with a leading slash", () => {
    const entry = buildPageSitemapEntry([base], base)
    expect(entry).toMatchObject({
      id: "page-1",
      type: "Page",
      title: "About Page",
      permalink: "/parent-folder/about",
      layout: "content",
      summary: "About summary",
    })
  })

  it("joins an array summary with spaces (contentPageHeader.summary array)", () => {
    const arrayed = resource({
      ...base,
      content: {
        layout: "content",
        page: { contentPageHeader: { summary: ["a", "b", "c"] } },
      },
    })
    expect(buildPageSitemapEntry([arrayed], arrayed).summary).toBe("a b c")
  })

  it("falls back through the summary chain (article -> subtitle -> description)", () => {
    const articled = resource({
      ...base,
      content: {
        layout: "article",
        page: { articlePageHeader: { summary: "article summary" } },
      },
    })
    expect(buildPageSitemapEntry([articled], articled).summary).toBe(
      "article summary",
    )
  })

  it("remaps an _index page id to the matching folder's id", () => {
    const folder = resource({
      id: "folder-1",
      type: "Folder",
      fullPermalink: "parent-folder",
    })
    const indexPage = resource({
      id: "index-1",
      type: "IndexPage",
      fullPermalink: "parent-folder/_index",
      content: { layout: "index", page: {} },
    })
    const entry = buildPageSitemapEntry([folder, indexPage], indexPage)
    expect(entry.id).toBe("folder-1")
    expect(entry.permalink).toBe("/parent-folder")
  })

  it("does NOT remap a RootPage id even when it ends with _index logic", () => {
    const root = resource({
      id: "root-1",
      type: "RootPage",
      fullPermalink: "",
      content: { layout: "homepage", page: {} },
    })
    expect(buildPageSitemapEntry([root], root).id).toBe("root-1")
  })

  it("extracts the first image block via getResourceFirstImage", () => {
    const withImage = resource({
      ...base,
      content: {
        layout: "content",
        page: { contentPageHeader: { summary: "s" } },
        content: [{ type: "image", src: "/x.png", alt: "x" }],
      },
    })
    expect(buildPageSitemapEntry([withImage], withImage).firstImage).toEqual({
      src: "/x.png",
      alt: "x",
    })
  })
})

describe("generateSitemapTree", () => {
  it("returns undefined for a leaf with no descendant entries", () => {
    const entries = [pageEntry({ permalink: "/about" })]
    expect(generateSitemapTree([], entries, "/about")).toBeUndefined()
  })

  it("builds immediate children of the root", () => {
    const entries = [
      pageEntry({ id: "a", title: "Alpha", permalink: "/alpha" }),
      pageEntry({ id: "b", title: "Beta", permalink: "/beta" }),
    ]
    const tree = generateSitemapTree([], entries, "/")
    expect(tree?.map((c) => c.permalink)).toEqual(["/alpha", "/beta"])
  })

  it("sorts children alphabetically (numeric-aware) by title when no ordering", () => {
    const entries = [
      pageEntry({ id: "10", title: "Item 10", permalink: "/item-10" }),
      pageEntry({ id: "2", title: "Item 2", permalink: "/item-2" }),
    ]
    const tree = generateSitemapTree([], entries, "/")
    // numeric: true means "Item 2" sorts before "Item 10"
    expect(tree?.map((c) => c.permalink)).toEqual(["/item-2", "/item-10"])
  })

  it("respects childrenPagesOrdering from an IndexPage resource", () => {
    const entries = [
      pageEntry({ id: "about", title: "About", permalink: "/f/about" }),
      pageEntry({ id: "contact", title: "Contact", permalink: "/f/contact" }),
    ]
    const resources = [
      resource({
        type: "IndexPage",
        fullPermalink: "f/_index",
        content: {
          content: [
            {
              type: "childrenpages",
              // contact ordered before about (reverse of alphabetical)
              childrenPagesOrdering: ["contact", "about"],
            },
          ],
        },
      }),
    ]
    const tree = generateSitemapTree(resources, entries, "/f")
    expect(tree?.map((c) => c.permalink)).toEqual(["/f/contact", "/f/about"])
  })

  it("falls back to deprecated FolderMeta order when no IndexPage ordering", () => {
    const entries = [
      pageEntry({ id: "alpha", title: "Alpha", permalink: "/f/alpha" }),
      pageEntry({ id: "beta", title: "Beta", permalink: "/f/beta" }),
    ]
    const resources = [
      resource({
        type: "FolderMeta",
        fullPermalink: "f/_meta",
        content: { order: ["beta", "alpha"] },
      }),
    ]
    const tree = generateSitemapTree(resources, entries, "/f")
    expect(tree?.map((c) => c.permalink)).toEqual(["/f/beta", "/f/alpha"])
  })

  it("synthesises a dangling-directory entry for a folder with children but no own page", () => {
    // There is an entry under /f/sub/ but none exactly at /f/sub, so /f/sub is
    // dangling. The matching Folder resource supplies its title + id.
    const entries = [pageEntry({ id: "deep", permalink: "/f/sub/deep" })]
    const resources = [
      resource({
        id: "sub-folder",
        type: "Folder",
        title: "Sub Folder",
        fullPermalink: "f/sub",
      }),
    ]
    const tree = generateSitemapTree(resources, entries, "/f")
    expect(tree).toHaveLength(1)
    expect(tree?.[0]).toMatchObject({
      id: "sub-folder",
      title: "Sub Folder",
      permalink: "/f/sub",
      layout: "index",
      type: "Folder",
    })
    // and it recurses into the dangling directory's children
    expect(tree?.[0]?.children?.[0]?.permalink).toBe("/f/sub/deep")
  })

  it("uses a generated title + sentinel id when no folder resource matches", () => {
    const entries = [pageEntry({ id: "deep", permalink: "/f/my-sub/deep" })]
    const tree = generateSitemapTree([], entries, "/f")
    expect(tree?.[0]).toMatchObject({
      id: DANGLING_DIRECTORY_PAGE_ID,
      title: "My sub",
      type: "Folder",
    })
  })

  it("labels a dangling Collection directory with collection layout", () => {
    const entries = [pageEntry({ id: "art", permalink: "/news/art" })]
    const resources = [
      resource({
        id: "news",
        type: "Collection",
        title: "News",
        fullPermalink: "news",
      }),
    ]
    const tree = generateSitemapTree(resources, entries, "/")
    expect(tree?.[0]).toMatchObject({
      id: "news",
      layout: "collection",
      type: "Collection",
    })
  })
})

describe("getFoldersAndCollections", () => {
  it("returns folder + collection children recursively, by resource type", () => {
    const resources = [
      resource({ id: "folder", type: "Folder" }),
      resource({ id: "coll", type: "Collection" }),
      resource({ id: "page", type: "Page" }),
    ]
    const tree: SitemapEntry = {
      id: "root",
      title: "Home",
      permalink: "/",
      type: "RootPage",
      lastModified: "",
      layout: "homepage",
      summary: "",
      children: [
        { ...pageEntry({ id: "folder", permalink: "/folder" }), children: [] },
        { ...pageEntry({ id: "coll", permalink: "/coll" }), children: [] },
        { ...pageEntry({ id: "page", permalink: "/page" }), children: [] },
      ],
    }
    const result = getFoldersAndCollections(resources, tree)
    expect(result.map((r) => r.id).sort()).toEqual(["coll", "folder"])
  })
})

describe("getDanglingDirectoryIndexPages", () => {
  const folderContents = (title: string) => ({ kind: "folder", title })
  const collectionContents = (title: string, variant?: unknown) => ({
    kind: "collection",
    title,
    variant,
  })

  it("emits a folder index page (with /_index suffix) for each dangling folder", () => {
    const resources = [resource({ id: "folder", type: "Folder" })]
    const tree: SitemapEntry = {
      id: "root",
      title: "Home",
      permalink: "/",
      type: "RootPage",
      lastModified: "",
      layout: "homepage",
      summary: "",
      children: [
        {
          ...pageEntry({ id: "folder", title: "Folder", permalink: "/folder" }),
          // A dangling-directory entry carries the folder's resource type;
          // getDanglingDirectoryIndexPages filters on the sitemap entry type.
          type: "Folder" as PageOnlySitemapEntry["type"],
          children: [],
        },
      ],
    }
    const pages = getDanglingDirectoryIndexPages(
      resources,
      tree,
      folderContents,
      collectionContents,
    )
    expect(pages).toEqual([
      {
        permalink: "/folder/_index",
        content: { kind: "folder", title: "Folder" },
      },
    ])
  })

  it("looks up CollectionMeta variant via the current parentId === Number(id) quirk", () => {
    // Resource ids are strings; `Number(id)` is NaN for a non-numeric id, so the
    // CollectionMeta lookup never matches and variant stays undefined. This
    // locks in the known latent bug (plan decision 6) — do NOT 'fix' it here.
    const resources = [
      resource({ id: "coll", type: "Collection" }),
      resource({
        id: "meta",
        type: "CollectionMeta",
        parentId: "coll" as unknown as number,
        content: { variant: "fullpage" },
      }),
    ]
    const tree: SitemapEntry = {
      id: "root",
      title: "Home",
      permalink: "/",
      type: "RootPage",
      lastModified: "",
      layout: "homepage",
      summary: "",
      children: [
        {
          ...pageEntry({ id: "coll", title: "News", permalink: "/news" }),
          type: "Collection" as PageOnlySitemapEntry["type"],
          children: [],
        },
      ],
    }
    const pages = getDanglingDirectoryIndexPages(
      resources,
      tree,
      folderContents,
      collectionContents,
    )
    expect(pages).toEqual([
      {
        permalink: "/news/_index",
        content: { kind: "collection", title: "News", variant: undefined },
      },
    ])
  })

  it("returns nothing for a leaf with no children", () => {
    const leaf: SitemapEntry = {
      id: "leaf",
      title: "Leaf",
      permalink: "/leaf",
      type: "Page",
      lastModified: "",
      layout: "content",
      summary: "",
    }
    expect(
      getDanglingDirectoryIndexPages(
        [],
        leaf,
        folderContents,
        collectionContents,
      ),
    ).toEqual([])
  })
})
