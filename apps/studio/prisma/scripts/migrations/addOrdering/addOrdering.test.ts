import { ISOMER_USABLE_PAGE_LAYOUTS } from "@opengovsg/isomer-components"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { resetTables } from "tests/integration/helpers/db"
import {
  setupCollection,
  setupFolder,
  setupPageResource,
  setupSite,
} from "tests/integration/helpers/seed"

import { db, jsonb } from "~/server/modules/database"
import {
  createDefaultPage,
  createFolderIndexPage,
} from "~/server/modules/page/page.service"
import {
  getBlobOfResource,
  getPageById,
} from "~/server/modules/resource/resource.service"
import { up as addOrdering } from "./addOrdering"

const getCustomIndexPage = (title: string, layout: "content" | "index") => {
  return {
    page: {
      title,
      permalink: "/get-help",
      lastModified: "2025-02-25T03:49:00.242Z",
      contentPageHeader: {
        summary: `Pages in ${title}`,
      },
    },
    layout,
    content: [
      {
        type: "infocards",
        cards: [
          {
            url: "https://www.zakat.sg/how-to-apply-zakat/",
            title: "Zakat assistance",
            imageFit: "cover",
            description: "Helping the poor and needy.",
          },
          {
            url: "[resource:48:36774]",
            title: "Islamic Legacy Planning",
            imageFit: "cover",
            description:
              "Helping individuals plan and manage their assets in accordance with Islamic guidelines.",
          },
          {
            url: "[resource:48:36785]",
            title: "MUIS Special Needs Trust Scheme",
            imageFit: "cover",
            description:
              "Supporting individuals with special needs within the Muslim community.",
          },
          {
            url: "[resource:48:36784]",
            title: "Appeal Board",
            imageFit: "cover",
            description:
              "The board serves as an independent body to ensure fairness and justice in resolving disputes, offering a formal avenue for appeals.",
          },
          {
            url: "https://ask.gov.sg/muis",
            title: "FAQs",
            imageFit: "cover",
            description: "Frequently Asked Questions.",
          },
        ],
        title: "",
        variant: "cardsWithoutImages",
        subtitle: "",
        maxColumns: "1",
      },
    ],
    version: "0.1.0",
  } as any
}

const getEmptyIndexPage = (title: string) => {
  return {
    version: "0.1.0",
    layout: ISOMER_USABLE_PAGE_LAYOUTS.Index,
    // NOTE: cannot use placeholder values here
    // because this are used for generation of breadcrumbs
    // and the page title
    page: {
      title,
      lastModified: new Date().toISOString(),
      contentPageHeader: {
        summary: `Pages in ${title}`,
      },
    },
    content: [],
  } as any
}

describe("addOrdering", () => {
  beforeEach(async () => {
    await resetTables("Blob", "Resource")
  })

  it("should not affect any index pages with ordering", async () => {
    // Arrange
    const { site, folder } = await setupFolder()
    const blob = await db
      .insertInto("Blob")
      .values({ content: jsonb(createFolderIndexPage(folder.title)) })
      .returningAll()
      .executeTakeFirstOrThrow()

    const { page } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: folder.id,
      blobId: blob.id,
    })

    // Act
    await addOrdering()

    // Assert
    const actual = await getBlobOfResource({ db, resourceId: page.id })
    expect(actual.content).toEqual(blob.content)
  })
  it("should not affect non index pages", async () => {
    // Arrange
    const { site } = await setupSite()
    const { page } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
    })
    const expected = await getBlobOfResource({ db, resourceId: page.id })

    // Act
    await addOrdering()

    // Assert
    const actual = await getBlobOfResource({ db, resourceId: page.id })
    expect(actual).toEqual(expected)
  })
  it("should not update other properties in the `childrenpages` block", async () => {
    // Arrange
    const { folder, site } = await setupFolder()
    const blobContent = createFolderIndexPage(folder.title)
    blobContent.version = "1.2.3"

    const blob = await db
      .insertInto("Blob")
      .values({ content: jsonb(blobContent) })
      .returningAll()
      .executeTakeFirstOrThrow()
    const { page } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: folder.id,
      blobId: blob.id,
    })

    // Act
    await addOrdering()

    // Assert
    const actual = await getBlobOfResource({ db, resourceId: page.id })
    expect(actual).toEqual(blob)
  })

  it("should not publish the page")
})
