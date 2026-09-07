import type { IsomerSchema } from "@opengovsg/isomer-components"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ResourceState } from '~/server/modules/database/types';
import type { Transaction, DB } from '~/server/modules/database/types';

import type { ConversionPlan } from "./helpers"
import {
  findPlanForFolder,
  folderPlanFileName,
  getBlobOfResource,
  incrementVersion,
  loadConversionPlan,
  loadConversionPlanFromPath,
  resourcePlanFileName,
  updateBlobById,
  validateNumericId,
  writePlanFiles,
  writeReportFile,
} from "./shared"

interface TestBlobFixture {
  layout: string
  version: string
  page: Record<string, string | { summary: string } | undefined>
  content: {
    type: string
    content?: unknown[]
    title?: string
    description?: string
  }[]
}

const asTestIsomerSchema = (blob: TestBlobFixture): IsomerSchema => 
  // SAFETY: fixture matches conversion-plan blob layout shapes under test.
  blob as IsomerSchema


type GetBlobDb = Parameters<typeof getBlobOfResource>[0]["db"]

const asGetBlobDb = (db: {
  selectFrom: ReturnType<typeof vi.fn>
}): GetBlobDb => 
  // SAFETY: test double implements only the selectFrom chain used by getBlobOfResource.
  db as GetBlobDb


interface TransactionTestDouble {
  selectFrom: ReturnType<typeof vi.fn>
  insertInto?: ReturnType<typeof vi.fn>
  updateTable?: ReturnType<typeof vi.fn>
}

const asTransaction = (tx: TransactionTestDouble): Transaction<DB> =>
  // @ts-expect-error test double implements only the Kysely calls exercised in these tests
  tx

interface ChainMock {
  where: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  selectAll: ReturnType<typeof vi.fn>
  set: ReturnType<typeof vi.fn>
  values: ReturnType<typeof vi.fn>
  returningAll: ReturnType<typeof vi.fn>
  returning: ReturnType<typeof vi.fn>
  executeTakeFirstOrThrow: ReturnType<typeof vi.fn>
  executeTakeFirst: ReturnType<typeof vi.fn>
  execute: ReturnType<typeof vi.fn>
}

const createChain = (): ChainMock => {
  const chain: ChainMock = {
    execute: vi.fn(),
    executeTakeFirst: vi.fn(),
    executeTakeFirstOrThrow: vi.fn(),
    returning: vi.fn(),
    returningAll: vi.fn(),
    select: vi.fn(),
    selectAll: vi.fn(),
    set: vi.fn(),
    values: vi.fn(),
    where: vi.fn(),
  }
  chain.where.mockReturnValue(chain)
  chain.select.mockReturnValue(chain)
  chain.selectAll.mockReturnValue(chain)
  chain.set.mockReturnValue(chain)
  chain.values.mockReturnValue(chain)
  chain.returningAll.mockReturnValue(chain)
  chain.returning.mockReturnValue(chain)
  return chain
}

const makeConversionPlan = (): ConversionPlan => ({
  defaultCategory: "Feature Articles",
  folder: {
    id: "159351",
    permalink: "folder-is-cool",
    siteId: 1,
    title: "folder is cool",
  },
  indexPage: {
    currentBlob: asTestIsomerSchema({
      layout: "index",
      version: "0.1.0",
      page: {
        title: "folder is cool",
        contentPageHeader: { summary: "Pages in folder is cool" },
      },
      content: [],
    }),
    currentBlobId: "158085",
    disallowedBlocks: [],
    nextBlob: asTestIsomerSchema({
      layout: "collection",
      version: "0.1.0",
      page: {
        title: "folder is cool",
        subtitle: "Pages in folder is cool",
        sortOrder: "date-desc",
      },
      content: [],
    }),
    permalink: "_index",
    resourceId: "159352",
    title: "folder is cool",
  },
  pages: [
    {
      resourceId: "159536",
      title: "Page A",
      permalink: "page-a",
      currentBlobId: "158086",
      currentBlob: asTestIsomerSchema({
        layout: "content",
        version: "0.1.0",
        page: {
          title: "Page A",
          contentPageHeader: { summary: "Summary A" },
        },
        content: [{ type: "prose", content: [] }],
      }),
      nextBlob: asTestIsomerSchema({
        layout: "article",
        version: "0.1.0",
        page: {
          category: "Feature Articles",
          articlePageHeader: { summary: "Summary A" },
        },
        content: [{ type: "prose", content: [] }],
      }),
      disallowedBlocks: [],
    },
    {
      resourceId: "159537",
      title: "Page B",
      permalink: "page-b",
      currentBlobId: "158087",
      currentBlob: asTestIsomerSchema({
        layout: "content",
        version: "0.1.0",
        page: {
          title: "Page B",
          contentPageHeader: { summary: "Summary B" },
        },
        content: [{ type: "infobar", title: "CTA", description: "x" }],
      }),
      nextBlob: asTestIsomerSchema({
        layout: "article",
        version: "0.1.0",
        page: {
          category: "Feature Articles",
          articlePageHeader: { summary: "Summary B" },
        },
        content: [{ type: "infobar", title: "CTA", description: "x" }],
      }),
      disallowedBlocks: [{ index: 0, type: "infobar" }],
    },
  ],
})

describe("validateNumericId", () => {
  const validate = validateNumericId("Site ID")

  it("accepts numeric strings with optional surrounding whitespace", () => {
    // Act + Assert
    expect(validate("123")).toBe(true)
    expect(validate(" 456 ")).toBe(true)
  })

  it("rejects empty, non-numeric, and mixed values", () => {
    // Act + Assert
    expect(validate("")).toBe("Site ID must be a numeric string")
    expect(validate("abc")).toBe("Site ID must be a numeric string")
    expect(validate("12a3")).toBe("Site ID must be a numeric string")
    expect(validate("-1")).toBe("Site ID must be a numeric string")
  })
})

describe("plan file naming", () => {
  it("uses stable convert-folder and convert-resource prefixes", () => {
    // Act + Assert
    expect(folderPlanFileName("159351")).toBe("convert-folder-159351.json")
    expect(resourcePlanFileName("159352")).toBe("convert-resource-159352.json")
  })
})

describe("plan file I/O", () => {
  let tempDir: string

  afterEach(() => {
    if (tempDir) {rmSync(tempDir, { recursive: true, force: true })}
  })

  it("round-trips a conversion plan through write and load helpers", () => {
    // Arrange
    tempDir = mkdtempSync(join(tmpdir(), "convert-plan-"))
    const plan = makeConversionPlan()

    // Act
    writePlanFiles(plan, tempDir)
    const loaded = loadConversionPlan(plan.folder.id, tempDir)

    // Assert
    expect(loaded).toEqual(plan)
  })

  it("loads a plan when given the folder plan path directly", () => {
    // Arrange
    tempDir = mkdtempSync(join(tmpdir(), "convert-plan-"))
    const plan = makeConversionPlan()
    const paths = writePlanFiles(plan, tempDir)
    const folderPath = paths[0]
    expect(folderPath).toBeDefined()

    // Act
    const loaded = loadConversionPlanFromPath(folderPath!, tempDir)

    // Assert
    expect(loaded).toEqual(plan)
  })

  it("findPlanForFolder returns the folder plan path when it exists", () => {
    // Arrange
    tempDir = mkdtempSync(join(tmpdir(), "convert-plan-"))
    const plan = makeConversionPlan()
    writePlanFiles(plan, tempDir)

    // Act
    const found = findPlanForFolder(plan.folder.id, tempDir)

    // Assert
    expect(found).toBe(join(tempDir, folderPlanFileName(plan.folder.id)))
  })

  it("findPlanForFolder returns undefined when no plan exists", () => {
    // Arrange
    tempDir = mkdtempSync(join(tmpdir(), "convert-plan-"))

    // Act + Assert
    expect(findPlanForFolder("missing", tempDir)).toBeUndefined()
  })

  it("writeReportFile emits flagged pages only", () => {
    // Arrange
    tempDir = mkdtempSync(join(tmpdir(), "convert-plan-"))
    const plan = makeConversionPlan()

    // Act
    const reportPath = writeReportFile(plan, tempDir)
    const report = JSON.parse(readFileSync(reportPath, "utf-8"))

    // Assert
    expect(report).toEqual([
      {
        id: "159537",
        reason: "disallowed-in-article blocks: infobar@0",
      },
    ])
  })
})

describe("getBlobOfResource", () => {
  it("returns the draft blob when draftBlobId is set", async () => {
    // Arrange
    const resourceChain = createChain()
    const blobChain = createChain()
    const draftBlob = { content: { layout: "content" }, id: "draft-1" }

    resourceChain.executeTakeFirstOrThrow.mockResolvedValue({
      draftBlobId: "draft-1",
      publishedVersionId: "pub-1",
    })
    blobChain.executeTakeFirstOrThrow.mockResolvedValue(draftBlob)

    const db = asGetBlobDb({
      selectFrom: vi.fn((table: string) =>
        table === "Resource" ? resourceChain : blobChain,
      ),
    })

    // Act
    const result = await getBlobOfResource({ db, resourceId: "42" })

    // Assert
    expect(result).toBe(draftBlob)
    expect(db.selectFrom).toHaveBeenCalledWith("Resource")
    expect(db.selectFrom).toHaveBeenCalledWith("Blob")
  })

  it("falls back to the published version blob when there is no draft", async () => {
    // Arrange
    const resourceChain = createChain()
    const blobChain = createChain()
    const publishedBlob = { content: { layout: "content" }, id: "pub-blob" }

    resourceChain.executeTakeFirstOrThrow.mockResolvedValue({
      draftBlobId: null,
      publishedVersionId: "pub-1",
    })
    blobChain.executeTakeFirstOrThrow.mockResolvedValue(publishedBlob)

    const db = asGetBlobDb({
      selectFrom: vi.fn((table: string) =>
        table === "Resource" ? resourceChain : blobChain,
      ),
    })

    // Act
    const result = await getBlobOfResource({ db, resourceId: "42" })

    // Assert
    expect(result).toBe(publishedBlob)
  })

  it("throws when the resource has no draft and no published version", async () => {
    // Arrange
    const resourceChain = createChain()
    resourceChain.executeTakeFirstOrThrow.mockResolvedValue({
      draftBlobId: null,
      publishedVersionId: null,
    })

    const db = asGetBlobDb({
      selectFrom: vi.fn(() => resourceChain),
    })

    // Act + Assert
    await expect(getBlobOfResource({ db, resourceId: "42" })).rejects.toThrow(
      "Resource 42 has no draft blob and no published version",
    )
  })
})

describe("updateBlobById", () => {
  const nextContent = asTestIsomerSchema({
    content: [],
    layout: "article",
    page: { articlePageHeader: { summary: "x" }, category: "News" },
    version: "0.1.0",
  })

  it("creates a draft blob and links it when the resource has no draft", async () => {
    // Arrange
    const selectChain = createChain()
    const insertChain = createChain()
    const updateChain = createChain()
    const newBlob = { content: nextContent, id: "new-blob" }

    selectChain.executeTakeFirst.mockResolvedValue({ draftBlobId: null })
    insertChain.executeTakeFirstOrThrow.mockResolvedValue(newBlob)
    updateChain.execute.mockResolvedValue()

    const tx = asTransaction({
      insertInto: vi.fn(() => insertChain),
      selectFrom: vi.fn(() => selectChain),
      updateTable: vi.fn(() => updateChain),
    })

    // Act
    const result = await updateBlobById(tx, {
      content: nextContent,
      pageId: 159536,
      siteId: 1,
    })

    // Assert
    expect(result).toBe(newBlob)
    expect(tx.insertInto).toHaveBeenCalledWith("Blob")
    expect(tx.updateTable).toHaveBeenCalledWith("Resource")
    expect(updateChain.set).toHaveBeenCalledWith({ draftBlobId: "new-blob" })
  })

  it("updates the existing draft blob when draftBlobId is present", async () => {
    // Arrange
    const selectChain = createChain()
    const updateChain = createChain()
    const updatedBlob = { content: nextContent, id: "existing-blob" }

    selectChain.executeTakeFirst.mockResolvedValue({
      draftBlobId: "existing-blob",
    })
    updateChain.executeTakeFirstOrThrow.mockResolvedValue(updatedBlob)

    const tx = asTransaction({
      insertInto: vi.fn(),
      selectFrom: vi.fn(() => selectChain),
      updateTable: vi.fn(() => updateChain),
    })

    // Act
    const result = await updateBlobById(tx, {
      content: nextContent,
      pageId: 159536,
      siteId: 1,
    })

    // Assert
    expect(result).toBe(updatedBlob)
    expect(tx.insertInto).not.toHaveBeenCalled()
    expect(updateChain.where).toHaveBeenCalledWith(
      "Blob.id",
      "=",
      "existing-blob",
    )
  })

  it("throws when the resource is not found on the site", async () => {
    // Arrange
    const selectChain = createChain()
    selectChain.executeTakeFirst.mockResolvedValue()

    const tx = asTransaction({
      selectFrom: vi.fn(() => selectChain),
    })

    // Act + Assert
    await expect(
      updateBlobById(tx, {
        content: nextContent,
        pageId: 999,
        siteId: 1,
      }),
    ).rejects.toThrow("Resource 999 not found")
  })
})

describe("incrementVersion", () => {
  it("returns null when the resource has no draft blob", async () => {
    // Arrange
    const selectChain = createChain()
    selectChain.executeTakeFirst.mockResolvedValue({
      draftBlobId: null,
      publishedVersionId: "pub-1",
    })

    const tx = asTransaction({
      selectFrom: vi.fn(() => selectChain),
    })

    // Act
    const result = await incrementVersion({
      resourceId: "159536",
      siteId: 1,
      tx,
      userId: "user-1",
    })

    // Assert
    expect(result).toBeNull()
  })

  it("creates version 1 when publishing a draft with no prior published version", async () => {
    // Arrange
    const selectChain = createChain()
    const insertChain = createChain()
    const updateChain = createChain()
    const newVersion = { id: "v1", versionNum: 1 }

    selectChain.executeTakeFirst.mockResolvedValue({
      draftBlobId: "draft-1",
      publishedVersionId: null,
    })
    insertChain.executeTakeFirstOrThrow.mockResolvedValue(newVersion)
    updateChain.execute.mockResolvedValue()

    const tx = asTransaction({
      insertInto: vi.fn(() => insertChain),
      selectFrom: vi.fn(() => selectChain),
      updateTable: vi.fn(() => updateChain),
    })

    // Act
    const result = await incrementVersion({
      resourceId: "159536",
      siteId: 1,
      tx,
      userId: "user-1",
    })

    // Assert
    expect(result).toEqual({
      newVersion,
      previousVersion: null,
    })
    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        blobId: "draft-1",
        publishedBy: "user-1",
        resourceId: "159536",
        versionNum: 1,
      }),
    )
    expect(updateChain.set).toHaveBeenCalledWith({
      draftBlobId: null,
      publishedVersionId: "v1",
      state: ResourceState.Published,
    })
  })

  it("increments the version number from the current published version", async () => {
    // Arrange
    const selectChain = createChain()
    const versionChain = createChain()
    const insertChain = createChain()
    const updateChain = createChain()
    const previousVersion = { id: "v2", versionNum: 2 }
    const newVersion = { id: "v3", versionNum: 3 }

    selectChain.executeTakeFirst.mockResolvedValue({
      draftBlobId: "draft-1",
      publishedVersionId: "v2",
    })
    versionChain.executeTakeFirstOrThrow.mockResolvedValue(previousVersion)
    insertChain.executeTakeFirstOrThrow.mockResolvedValue(newVersion)
    updateChain.execute.mockResolvedValue()

    const tx = asTransaction({
      insertInto: vi.fn(() => insertChain),
      selectFrom: vi.fn((table: string) =>
        table === "Resource" ? selectChain : versionChain,
      ),
      updateTable: vi.fn(() => updateChain),
    })

    // Act
    const result = await incrementVersion({
      resourceId: "159536",
      siteId: 1,
      tx,
      userId: "user-1",
    })

    // Assert
    expect(result).toEqual({
      newVersion,
      previousVersion,
    })
    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({ versionNum: 3 }),
    )
  })
})
