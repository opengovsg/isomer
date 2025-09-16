import { randomUUID } from "crypto"
import { CollectionPagePageProps } from "@opengovsg/isomer-components"
import { resetTables } from "tests/integration/helpers/db"
import {
  setupCollection,
  setupFolder,
  setupPageResource,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"
import { UnwrapTagged } from "type-fest"

import {
  db,
  jsonb,
  ResourceState,
  ResourceType,
} from "~/server/modules/database"
import { up } from "./index"

describe("sortTagCategories migration", async () => {
  const user = await setupUser({})
  beforeEach(async () => {
    await resetTables("Resource", "Blob", "Version", "Site")
  })

  const createTagCategoriesContent = (
    sorted = false,
  ): UnwrapTagged<PrismaJson.BlobJsonContent> => {
    const categories = sorted
      ? [
          {
            label: "Category A",
            id: randomUUID(),
            value: "cat-a",
            options: [
              { id: randomUUID(), label: "Option 1", value: "opt-1" },
              { id: randomUUID(), label: "Option 2", value: "opt-2" },
            ],
          },
          {
            label: "Category B",
            value: "cat-b",
            id: randomUUID(),
            options: [
              {
                id: randomUUID(),
                label: "Option X",
                value: "opt-x",
              },
              {
                id: randomUUID(),
                label: "Option Y",
                value: "opt-y",
              },
            ],
          },
        ]
      : [
          {
            label: "Category B",
            value: "cat-b",
            id: randomUUID(),
            options: [
              {
                id: randomUUID(),
                label: "Option Y",
                value: "opt-y",
              },
              {
                id: randomUUID(),
                label: "Option X",
                value: "opt-x",
              },
            ],
          },
          {
            label: "Category A",
            id: randomUUID(),
            value: "cat-a",
            options: [
              {
                id: randomUUID(),
                label: "Option 2",
                value: "opt-2",
              },
              {
                id: randomUUID(),
                label: "Option 1",
                value: "opt-1",
              },
            ],
          },
        ]

    return {
      layout: "collection",
      page: {
        tagCategories: categories,
        title: "Test Collection",
        subtitle: "Test subtitle",
      },
      content: [],
      version: "1.0.0",
    }
  }

  const getBlobContent = async (blobId: string) => {
    const blob = await db
      .selectFrom("Blob")
      .select("content")
      .where("id", "=", blobId)
      .executeTakeFirst()
    return blob?.content
  }

  it("should sort tag categories and options on the published index page if the published index page has tag categories", async () => {
    // Arrange
    const { site } = await setupSite()
    const { collection } = await setupCollection({
      siteId: site.id,
    })
    const unsortedContent = createTagCategoriesContent(false)
    const { id: publishedBlobId } = await db
      .insertInto("Blob")
      .values({ content: jsonb(unsortedContent) })
      .returningAll()
      .executeTakeFirstOrThrow()

    // NOTE: This is a page
    // without a `draftBlobId`
    await setupPageResource({
      siteId: site.id,
      blobId: publishedBlobId,
      state: ResourceState.Published,
      resourceType: ResourceType.IndexPage,
      userId: user.id,
      parentId: collection.id,
    })

    // Act
    await up()

    // Assert
    const updatedContent = await getBlobContent(publishedBlobId)
    const page = updatedContent?.page as CollectionPagePageProps

    expect(page.tagCategories).toHaveLength(2)
    expect(page.tagCategories![0]?.label).toBe("Category A")
    expect(page.tagCategories![1]?.label).toBe("Category B")
    expect(page.tagCategories![0]?.options[0]?.label).toBe("Option 1")
    expect(page.tagCategories![0]?.options[1]?.label).toBe("Option 2")
  })

  it("should not affect published collection index pages that do not have any tag categories", async () => {
    // Arrange
    const { site } = await setupSite()
    const { collection } = await setupCollection({ siteId: site.id })
    const contentWithoutTags = {
      page: {
        title: "Test Collection",
        layout: "collection" as const,
      },
      content: [],
      version: "1.0.0",
      layout: "collection",
    } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>
    const { id: blobId } = await db
      .insertInto("Blob")
      .values({ content: jsonb(contentWithoutTags) })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site.id,
      blobId,
      state: ResourceState.Published,
      resourceType: ResourceType.IndexPage,
      userId: user.id,
      parentId: collection.id,
    })

    // Act
    await up()

    // Assert
    const updatedContent = await getBlobContent(blobId)
    expect(updatedContent).toEqual(contentWithoutTags)
  })

  it("should not affect folder index pages even if they have tag categories", async () => {
    // Arrange
    const { site } = await setupSite()
    const { folder } = await setupFolder({ siteId: site.id })
    const content = createTagCategoriesContent(false)
    const { id: blobId } = await db
      .insertInto("Blob")
      .values({ content: jsonb(content) })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site.id,
      blobId,
      state: ResourceState.Published,
      resourceType: ResourceType.IndexPage,
      userId: user.id,
      parentId: folder.id,
    })

    // Act
    await up()

    // Assert
    const updatedContent = await getBlobContent(blobId)
    expect(updatedContent).toEqual(content)
  })

  it("should sort the tag categories and options on the draft blob of the collection index page if the draft blob has tag categories", async () => {
    // Arrange
    const { site } = await setupSite()
    const { collection } = await setupCollection({
      siteId: site.id,
    })
    const unsortedContent = createTagCategoriesContent(false)
    const { id: blobId } = await db
      .insertInto("Blob")
      .values({ content: jsonb(unsortedContent) })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site.id,
      blobId,
      resourceType: ResourceType.IndexPage,
      parentId: collection.id,
    })

    // Act
    await up()

    // Assert
    const updatedContent = await getBlobContent(blobId)
    const page = updatedContent?.page as CollectionPagePageProps

    expect(page.tagCategories).toHaveLength(2)
    expect(page.tagCategories![0]?.label).toBe("Category A")
    expect(page.tagCategories![1]?.label).toBe("Category B")
    expect(page.tagCategories![0]?.options[0]?.label).toBe("Option 1")
    expect(page.tagCategories![0]?.options[1]?.label).toBe("Option 2")
  })

  it("should sort the tag categories and options on the draft and published blob if both the draft and published blob have tag categories", async () => {
    // Arrange
    const { site } = await setupSite()
    const { collection } = await setupCollection({
      siteId: site.id,
    })
    const unsortedContent = createTagCategoriesContent(false)
    const { id: publishedBlobId } = await db
      .insertInto("Blob")
      .values({ content: jsonb(unsortedContent) })
      .returningAll()
      .executeTakeFirstOrThrow()
    const { id: draftBlobId } = await db
      .insertInto("Blob")
      .values({ content: jsonb(unsortedContent) })
      .returningAll()
      .executeTakeFirstOrThrow()

    // NOTE: This is a page
    // without a `draftBlobId`
    const { page: pageResource } = await setupPageResource({
      siteId: site.id,
      blobId: publishedBlobId,
      state: ResourceState.Published,
      resourceType: ResourceType.IndexPage,
      userId: user.id,
      parentId: collection.id,
    })
    await db
      .updateTable("Resource")
      .set({ draftBlobId })
      .where("id", "=", pageResource.id)
      .execute()

    // Act
    await up()

    // Assert
    const updatedPublishedContent = await getBlobContent(publishedBlobId)
    const publishedPageProp =
      updatedPublishedContent?.page as CollectionPagePageProps

    expect(publishedPageProp.tagCategories).toHaveLength(2)
    expect(publishedPageProp.tagCategories![0]?.label).toBe("Category A")
    expect(publishedPageProp.tagCategories![1]?.label).toBe("Category B")
    expect(publishedPageProp.tagCategories![0]?.options[0]?.label).toBe(
      "Option 1",
    )
    expect(publishedPageProp.tagCategories![0]?.options[1]?.label).toBe(
      "Option 2",
    )

    const updatedDraftContent = await getBlobContent(draftBlobId)
    const draftPageProp = updatedDraftContent?.page as CollectionPagePageProps

    expect(draftPageProp.tagCategories).toHaveLength(2)
    expect(draftPageProp.tagCategories![0]?.label).toBe("Category A")
    expect(draftPageProp.tagCategories![1]?.label).toBe("Category B")
    expect(draftPageProp.tagCategories![0]?.options[0]?.label).toBe("Option 1")
    expect(draftPageProp.tagCategories![0]?.options[1]?.label).toBe("Option 2")
  })

  it("should not override any other properties on the blob content", async () => {
    // Arrange
    const { site } = await setupSite()
    const { collection } = await setupCollection({
      siteId: site.id,
    })
    const unsortedContent = createTagCategoriesContent(false)
    const fakeProseBlock = {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [{ text: "Test block", type: "text" }],
        },
      ],
    }
    const { id: publishedBlobId } = await db
      .insertInto("Blob")
      .values({
        content: jsonb({
          ...unsortedContent,
          page: { ...unsortedContent.page, foo: "bar" },
          content: [fakeProseBlock],
          // NOTE: need the cast because we have additional property `foo`
          // that is not in schema
        }) as unknown as PrismaJson.BlobJsonContent,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site.id,
      blobId: publishedBlobId,
      state: ResourceState.Published,
      resourceType: ResourceType.IndexPage,
      userId: user.id,
      parentId: collection.id,
    })

    // Act
    await up()

    // Assert
    const updatedContent = await getBlobContent(publishedBlobId)
    const page = updatedContent?.page as CollectionPagePageProps

    expect((page as unknown as { foo: string }).foo).toBe("bar")
    expect(page.tagCategories).toHaveLength(2)
    expect(page.tagCategories![0]?.label).toBe("Category A")
    expect(page.tagCategories![1]?.label).toBe("Category B")
    expect(page.tagCategories![0]?.options[0]?.label).toBe("Option 1")
    expect(page.tagCategories![0]?.options[1]?.label).toBe("Option 2")
    expect(updatedContent?.content).toHaveLength(1)
    expect(updatedContent?.content[0]).toEqual(fakeProseBlock)
  })

  it("should not impact any pages that do not have the `tagCategories` property even if they have `tagged` or `tags` property", async () => {
    // Arrange
    const { site } = await setupSite()
    const { collection } = await setupCollection({
      siteId: site.id,
    })

    const contentWithOtherTags = {
      page: {
        title: "Test Collection",
        tagged: ["tag1", "tag2"],
        tags: [{ label: "hello", value: "world" }],
      },
      content: [],
      version: "1.0.0" as const,
      layout: "collection",
    } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>
    const { id: blobId } = await db
      .insertInto("Blob")
      .values({
        content: jsonb(contentWithOtherTags),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site.id,
      blobId,
      resourceType: ResourceType.IndexPage,
      userId: user.id,
      parentId: collection.id,
    })

    // Act
    await up()

    // Assert
    const updatedContent = await getBlobContent(blobId)
    expect(updatedContent).toEqual(contentWithOtherTags)
  })

  it("should handle empty tagCategories array", async () => {
    // Arrange
    const { site } = await setupSite()
    const { collection } = await setupCollection({
      siteId: site.id,
    })
    const { id: publishedBlobId } = await db
      .insertInto("Blob")
      .values({
        content: jsonb({
          layout: "collection",
          page: {
            tagCategories: [],
            title: "Test Collection",
            subtitle: "Test subtitle",
          },
          content: [],
          version: "1.0.0",
        }),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    // NOTE: This is a page
    // without a `draftBlobId`
    await setupPageResource({
      siteId: site.id,
      blobId: publishedBlobId,
      state: ResourceState.Published,
      resourceType: ResourceType.IndexPage,
      userId: user.id,
      parentId: collection.id,
    })

    // Act
    await up()

    // Assert
    const updatedContent = await getBlobContent(publishedBlobId)
    const page = updatedContent?.page as CollectionPagePageProps

    expect(page.tagCategories).toHaveLength(0)
  })

  it("should sort categories and options with numeric labels correctly", async () => {
    // Arrange
    const { site } = await setupSite()
    const { collection } = await setupCollection({
      siteId: site.id,
    })

    const contentWithNumericLabels = {
      page: {
        title: "Test Collection",
        tagCategories: [
          {
            label: "Priority 10",
            value: "pri-10",
            options: [
              { label: "Item 20", value: "item-20" },
              { label: "Item 2", value: "item-2" },
              { label: "Item 10", value: "item-10" },
            ],
          },
          {
            label: "Priority 2",
            value: "pri-2",
            options: [],
          },
        ],
      },
      layout: "collection" as const,
      version: "1.0.0" as const,
      content: [],
    } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>

    const { id: blobId } = await db
      .insertInto("Blob")
      .values({
        content: jsonb(contentWithNumericLabels),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site.id,
      blobId,
      resourceType: ResourceType.IndexPage,
      userId: user.id,
      parentId: collection.id,
    })

    // Act
    await up()

    // Assert
    const updatedContent = await getBlobContent(blobId)
    const page = updatedContent?.page as CollectionPagePageProps

    // Categories should be sorted numerically
    expect(page.tagCategories![0]?.label).toBe("Priority 2")
    expect(page.tagCategories![1]?.label).toBe("Priority 10")

    // Options should be sorted numerically
    expect(page.tagCategories![1]?.options[0]?.label).toBe("Item 2")
    expect(page.tagCategories![1]?.options[1]?.label).toBe("Item 10")
    expect(page.tagCategories![1]?.options[2]?.label).toBe("Item 20")
  })
})
