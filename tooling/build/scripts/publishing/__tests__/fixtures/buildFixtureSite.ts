import type { createDb } from "@isomer/db"
import { ResourceState, ResourceType } from "@isomer/db"

import { jsonb } from "../helpers/jsonb"
import {
  articlePage,
  contentPage,
  contentPageWithImage,
  indexPage,
} from "./page-content"

type Db = ReturnType<typeof createDb>

const MOCK_DATE = new Date("2026-01-01T00:00:00.000Z")

const setupUser = async (db: Db) =>
  db
    .insertInto("User")
    .values({
      id: "fixture-user",
      name: "Fixture Publisher",
      email: "publisher@fixture.test",
      phone: "",
    })
    .onConflict((oc) => oc.column("id").doNothing())
    .returningAll()
    .executeTakeFirstOrThrow()

interface SetupSiteResult {
  siteId: number
}

const setupSite = async (
  db: Db,
  siteId: number,
  name: string,
): Promise<SetupSiteResult> => {
  await db
    .insertInto("Site")
    .values({
      // @ts-expect-error id is GeneratedAlways but we override it for fixtures
      id: siteId,
      name,
      config: jsonb({
        theme: "isomer-next",
        logoUrl: "",
        siteName: name,
        isGovernment: true,
        url: "https://fixture.test",
      }),
      theme: jsonb({ colors: { brand: { canvas: { default: "#ffffff" } } } }),
      codeBuildId: null,
    })
    .execute()

  await db
    .insertInto("Navbar")
    .values({
      siteId,
      content: jsonb({
        items: [{ url: "/parent-folder", name: "Parent Folder" }],
      }),
    })
    .execute()

  await db
    .insertInto("Footer")
    .values({
      siteId,
      content: jsonb({
        siteNavItems: [{ url: "/parent-folder", title: "Parent Folder" }],
        contactUsLink: "/contact-us",
      }),
    })
    .execute()

  return { siteId }
}

// Insert a Blob + a Version, returning the version id so the resource can be
// marked published (publishedVersionId). Mirrors how studio publishes a page.
const publishBlob = async (
  db: Db,
  resourceId: string,
  content: object,
): Promise<string> => {
  const blob = await db
    .insertInto("Blob")
    .values({ content: jsonb(content) })
    .returning("id")
    .executeTakeFirstOrThrow()

  const version = await db
    .insertInto("Version")
    .values({
      versionNum: 1,
      resourceId,
      blobId: blob.id,
      publishedBy: "fixture-user",
    })
    .returning("id")
    .executeTakeFirstOrThrow()

  await db
    .updateTable("Resource")
    .where("id", "=", resourceId)
    .set({ publishedVersionId: version.id })
    .execute()

  return version.id
}

interface InsertResourceArgs {
  siteId: number
  type: ResourceType
  title: string
  permalink: string
  parentId?: string | null
  state?: ResourceState
}

const insertResource = async (
  db: Db,
  {
    siteId,
    type,
    title,
    permalink,
    parentId = null,
    state,
  }: InsertResourceArgs,
): Promise<string> => {
  const row = await db
    .insertInto("Resource")
    .values({
      siteId,
      type,
      title,
      permalink,
      parentId,
      state: state ?? null,
      publishedVersionId: null,
      draftBlobId: null,
      createdAt: MOCK_DATE,
      updatedAt: MOCK_DATE,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  return row.id
}

export interface FixtureSite {
  siteId: number
  ids: Record<string, string>
}

/**
 * Builds the rich main fixture site (plan decision 10). The tree exercises:
 * - a multi-level resource tree (root → folder → nested page) for recursive
 *   permalink building;
 * - a published page (Version→Blob content) vs a Folder (null content) vs an
 *   UNPUBLISHED resource (publishedVersionId null → null content);
 * - a dangling directory (a Folder with a child page but no IndexPage);
 * - an IndexPage with `childrenPagesOrdering`;
 * - a Collection + CollectionMeta + CollectionPages;
 * - a FolderMeta (deprecated ordering);
 * - Site/Navbar/Footer rows, and Redirect rows incl. one soft-deleted.
 */
export const buildFixtureSite = async (
  db: Db,
  siteId = 1,
): Promise<FixtureSite> => {
  await setupUser(db)
  await setupSite(db, siteId, "Fixture Ministry")

  const ids: Record<string, string> = {}

  // Root page (published, has content)
  ids.rootPage = await insertResource(db, {
    siteId,
    type: ResourceType.RootPage,
    title: "Home",
    permalink: "",
    state: ResourceState.Published,
  })
  await publishBlob(db, ids.rootPage, contentPage("Welcome to the home page"))

  // Top-level folder "parent-folder"
  ids.parentFolder = await insertResource(db, {
    siteId,
    type: ResourceType.Folder,
    title: "Parent Folder",
    permalink: "parent-folder",
  })

  // Two published pages under parent-folder (b-page sorts before a-page
  // alphabetically by title; ordering overrides this via the IndexPage).
  ids.aboutPage = await insertResource(db, {
    siteId,
    type: ResourceType.Page,
    title: "About Page",
    permalink: "about",
    parentId: ids.parentFolder,
    state: ResourceState.Published,
  })
  await publishBlob(
    db,
    ids.aboutPage,
    contentPageWithImage("About us summary", "/img/about.png"),
  )

  ids.contactPage = await insertResource(db, {
    siteId,
    type: ResourceType.Page,
    title: "Contact Page",
    permalink: "contact",
    parentId: ids.parentFolder,
    state: ResourceState.Published,
  })
  await publishBlob(db, ids.contactPage, contentPage("Contact us summary"))

  // IndexPage for parent-folder, ordering contact BEFORE about (reverse of
  // alphabetical) to prove the ordering is respected. childrenPagesOrdering
  // references child resource ids.
  ids.parentIndex = await insertResource(db, {
    siteId,
    type: ResourceType.IndexPage,
    title: "Parent Folder",
    permalink: "_index",
    parentId: ids.parentFolder,
    state: ResourceState.Published,
  })
  await publishBlob(
    db,
    ids.parentIndex,
    indexPage([ids.contactPage, ids.aboutPage]),
  )

  // Dangling directory: a Folder with a child page but NO IndexPage.
  ids.danglingFolder = await insertResource(db, {
    siteId,
    type: ResourceType.Folder,
    title: "Dangling Folder",
    permalink: "dangling-folder",
    parentId: ids.parentFolder,
  })
  ids.danglingChild = await insertResource(db, {
    siteId,
    type: ResourceType.Page,
    title: "Buried Page",
    permalink: "buried",
    parentId: ids.danglingFolder,
    state: ResourceState.Published,
  })
  await publishBlob(db, ids.danglingChild, contentPage("Buried page summary"))

  // A second top-level folder using the deprecated FolderMeta ordering.
  ids.metaFolder = await insertResource(db, {
    siteId,
    type: ResourceType.Folder,
    title: "Meta Folder",
    permalink: "meta-folder",
  })
  ids.metaAlpha = await insertResource(db, {
    siteId,
    type: ResourceType.Page,
    title: "Alpha",
    permalink: "alpha",
    parentId: ids.metaFolder,
    state: ResourceState.Published,
  })
  await publishBlob(db, ids.metaAlpha, contentPage("Alpha summary"))
  ids.metaBeta = await insertResource(db, {
    siteId,
    type: ResourceType.Page,
    title: "Beta",
    permalink: "beta",
    parentId: ids.metaFolder,
    state: ResourceState.Published,
  })
  await publishBlob(db, ids.metaBeta, contentPage("Beta summary"))
  // FolderMeta orders beta before alpha (reverse alphabetical).
  ids.folderMeta = await insertResource(db, {
    siteId,
    type: ResourceType.FolderMeta,
    title: "Meta Folder Meta",
    permalink: "_meta",
    parentId: ids.metaFolder,
    state: ResourceState.Published,
  })
  await publishBlob(db, ids.folderMeta, { order: ["beta", "alpha"] })

  // Collection + CollectionMeta + CollectionPages
  ids.collection = await insertResource(db, {
    siteId,
    type: ResourceType.Collection,
    title: "News",
    permalink: "news",
  })
  ids.collectionMeta = await insertResource(db, {
    siteId,
    type: ResourceType.CollectionMeta,
    title: "News Meta",
    permalink: "_meta",
    parentId: ids.collection,
    state: ResourceState.Published,
  })
  await publishBlob(db, ids.collectionMeta, { variant: "collection" })
  ids.articleOne = await insertResource(db, {
    siteId,
    type: ResourceType.CollectionPage,
    title: "Article One",
    permalink: "article-one",
    parentId: ids.collection,
    state: ResourceState.Published,
  })
  await publishBlob(
    db,
    ids.articleOne,
    articlePage("First article", "Feature Articles"),
  )
  ids.articleTwo = await insertResource(db, {
    siteId,
    type: ResourceType.CollectionPage,
    title: "Article Two",
    permalink: "article-two",
    parentId: ids.collection,
    state: ResourceState.Published,
  })
  await publishBlob(
    db,
    ids.articleTwo,
    articlePage("Second article", "Feature Articles"),
  )

  // An UNPUBLISHED top-level page: publishedVersionId stays null, so the
  // content CASE in the recursive query yields null content for it.
  ids.unpublishedPage = await insertResource(db, {
    siteId,
    type: ResourceType.Page,
    title: "Draft Page",
    permalink: "draft-page",
    state: ResourceState.Draft,
  })

  // Redirects: one live, one soft-deleted (deletedAt set).
  await db
    .insertInto("Redirect")
    .values({
      siteId,
      source: "/old-home",
      destination: "/",
      deletedAt: null,
    })
    .execute()
  await db
    .insertInto("Redirect")
    .values({
      siteId,
      source: "/deleted-redirect",
      destination: "/gone",
      deletedAt: MOCK_DATE,
    })
    .execute()

  return { siteId, ids }
}
