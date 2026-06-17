import type { IsomerSchema } from "@opengovsg/isomer-components"
import { mkdtempSync, readFileSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  ResourceState,
  type Transaction,
  type DB,
} from "~/server/modules/database"

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
  const chain = {} as ChainMock
  chain.where = vi.fn().mockReturnValue(chain)
  chain.select = vi.fn().mockReturnValue(chain)
  chain.selectAll = vi.fn().mockReturnValue(chain)
  chain.set = vi.fn().mockReturnValue(chain)
  chain.values = vi.fn().mockReturnValue(chain)
  chain.returningAll = vi.fn().mockReturnValue(chain)
  chain.returning = vi.fn().mockReturnValue(chain)
  chain.executeTakeFirstOrThrow = vi.fn()
  chain.executeTakeFirst = vi.fn()
  chain.execute = vi.fn()
  return chain
}

const makeConversionPlan = (): ConversionPlan => ({
  folder: {
    id: "159351",
    siteId: 1,
    title: "folder is cool",
    permalink: "folder-is-cool",
  },
  defaultCategory: "Feature Articles",
  indexPage: {
    resourceId: "159352",
    title: "folder is cool",
    permalink: "_index",
    currentBlobId: "158085",
    currentBlob: {
      layout: "index",
      version: "0.1.0",
      page: {
        title: "folder is cool",
        contentPageHeader: { summary: "Pages in folder is cool" },
      },
      content: [],
    } as unknown as IsomerSchema,
    nextBlob: {
      layout: "collection",
      version: "0.1.0",
      page: {
        title: "folder is cool",
        subtitle: "Pages in folder is cool",
        sortOrder: "date-desc",
      },
      content: [],
    } as unknown as IsomerSchema,
    disallowedBlocks: [],
  },
  pages: [
    {
      resourceId: "159536",
      title: "Page A",
      permalink: "page-a",
      currentBlobId: "158086",
      currentBlob: {
        layout: "content",
        version: "0.1.0",
        page: {
          title: "Page A",
          contentPageHeader: { summary: "Summary A" },
        },
        content: [{ type: "prose", content: [] }],
      } as unknown as IsomerSchema,
      nextBlob: {
        layout: "article",
        version: "0.1.0",
        page: {
          category: "Feature Articles",
          articlePageHeader: { summary: "Summary A" },
        },
        content: [{ type: "prose", content: [] }],
      } as unknown as IsomerSchema,
      disallowedBlocks: [],
    },
    {
      resourceId: "159537",
      title: "Page B",
      permalink: "page-b",
      currentBlobId: "158087",
      currentBlob: {
        layout: "content",
        version: "0.1.0",
        page: {
          title: "Page B",
          contentPageHeader: { summary: "Summary B" },
        },
        content: [{ type: "infobar", title: "CTA", description: "x" }],
      } as unknown as IsomerSchema,
      nextBlob: {
        layout: "article",
        version: "0.1.0",
        page: {
          category: "Feature Articles",
          articlePageHeader: { summary: "Summary B" },
        },
        content: [{ type: "infobar", title: "CTA", description: "x" }],
      } as unknown as IsomerSchema,
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
    if (tempDir) rmSync(tempDir, { recursive: true, force: true })
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
    const draftBlob = { id: "draft-1", content: { layout: "content" } }

    resourceChain.executeTakeFirstOrThrow.mockResolvedValue({
      draftBlobId: "draft-1",
      publishedVersionId: "pub-1",
    })
    blobChain.executeTakeFirstOrThrow.mockResolvedValue(draftBlob)

    const db = {
      selectFrom: vi.fn((table: string) =>
        table === "Resource" ? resourceChain : blobChain,
      ),
    } as unknown as Parameters<typeof getBlobOfResource>[0]["db"]

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
    const publishedBlob = { id: "pub-blob", content: { layout: "content" } }

    resourceChain.executeTakeFirstOrThrow.mockResolvedValue({
      draftBlobId: null,
      publishedVersionId: "pub-1",
    })
    blobChain.executeTakeFirstOrThrow.mockResolvedValue(publishedBlob)

    const db = {
      selectFrom: vi.fn((table: string) =>
        table === "Resource" ? resourceChain : blobChain,
      ),
    } as unknown as Parameters<typeof getBlobOfResource>[0]["db"]

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

    const db = {
      selectFrom: vi.fn(() => resourceChain),
    } as unknown as Parameters<typeof getBlobOfResource>[0]["db"]

    // Act + Assert
    await expect(getBlobOfResource({ db, resourceId: "42" })).rejects.toThrow(
      "Resource 42 has no draft blob and no published version",
    )
  })
})

describe("updateBlobById", () => {
  const nextContent = {
    layout: "article",
    version: "0.1.0",
    page: { category: "News", articlePageHeader: { summary: "x" } },
    content: [],
  } as unknown as IsomerSchema

  it("creates a draft blob and links it when the resource has no draft", async () => {
    // Arrange
    const selectChain = createChain()
    const insertChain = createChain()
    const updateChain = createChain()
    const newBlob = { id: "new-blob", content: nextContent }

    selectChain.executeTakeFirst.mockResolvedValue({ draftBlobId: null })
    insertChain.executeTakeFirstOrThrow.mockResolvedValue(newBlob)
    updateChain.execute.mockResolvedValue(undefined)

    const tx = {
      selectFrom: vi.fn(() => selectChain),
      insertInto: vi.fn(() => insertChain),
      updateTable: vi.fn(() => updateChain),
    } as unknown as Transaction<DB>

    // Act
    const result = await updateBlobById(tx, {
      pageId: 159536,
      siteId: 1,
      content: nextContent,
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
    const updatedBlob = { id: "existing-blob", content: nextContent }

    selectChain.executeTakeFirst.mockResolvedValue({
      draftBlobId: "existing-blob",
    })
    updateChain.executeTakeFirstOrThrow.mockResolvedValue(updatedBlob)

    const tx = {
      selectFrom: vi.fn(() => selectChain),
      insertInto: vi.fn(),
      updateTable: vi.fn(() => updateChain),
    } as unknown as Transaction<DB>

    // Act
    const result = await updateBlobById(tx, {
      pageId: 159536,
      siteId: 1,
      content: nextContent,
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
    selectChain.executeTakeFirst.mockResolvedValue(undefined)

    const tx = {
      selectFrom: vi.fn(() => selectChain),
    } as unknown as Transaction<DB>

    // Act + Assert
    await expect(
      updateBlobById(tx, {
        pageId: 999,
        siteId: 1,
        content: nextContent,
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

    const tx = {
      selectFrom: vi.fn(() => selectChain),
    } as unknown as Transaction<DB>

    // Act
    const result = await incrementVersion({
      tx,
      siteId: 1,
      resourceId: "159536",
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
    updateChain.execute.mockResolvedValue(undefined)

    const tx = {
      selectFrom: vi.fn(() => selectChain),
      insertInto: vi.fn(() => insertChain),
      updateTable: vi.fn(() => updateChain),
    } as unknown as Transaction<DB>

    // Act
    const result = await incrementVersion({
      tx,
      siteId: 1,
      resourceId: "159536",
      userId: "user-1",
    })

    // Assert
    expect(result).toEqual({
      previousVersion: null,
      newVersion,
    })
    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        versionNum: 1,
        resourceId: "159536",
        blobId: "draft-1",
        publishedBy: "user-1",
      }),
    )
    expect(updateChain.set).toHaveBeenCalledWith({
      publishedVersionId: "v1",
      draftBlobId: null,
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
    updateChain.execute.mockResolvedValue(undefined)

    const tx = {
      selectFrom: vi.fn((table: string) =>
        table === "Resource" ? selectChain : versionChain,
      ),
      insertInto: vi.fn(() => insertChain),
      updateTable: vi.fn(() => updateChain),
    } as unknown as Transaction<DB>

    // Act
    const result = await incrementVersion({
      tx,
      siteId: 1,
      resourceId: "159536",
      userId: "user-1",
    })

    // Assert
    expect(result).toEqual({
      previousVersion,
      newVersion,
    })
    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({ versionNum: 3 }),
    )
  })
})
