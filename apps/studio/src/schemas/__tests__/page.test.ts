import { describe, expect, it } from "vitest"
import {
  ResourceState,
  ResourceType,
  ScheduledAction,
} from "~prisma/generated/generatedEnums"

import { readPageOutputSchema, reorderBlobSchema } from "../page"

describe("reorderBlobSchema", () => {
  it("preserves unknown keys on block objects", () => {
    // Arrange
    const blockWithExtraFields = {
      type: "prose",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Hi" }] }],
    }

    // Act
    const result = reorderBlobSchema.parse({
      pageId: 1,
      siteId: 1,
      from: 0,
      to: 1,
      blocks: [blockWithExtraFields],
    })

    // Assert
    expect(result.blocks[0]).toEqual(blockWithExtraFields)
  })
})

describe("readPageOutputSchema", () => {
  it("parses Prisma enum fields via z.enum", () => {
    // Arrange
    const now = new Date()

    // Act
    const result = readPageOutputSchema.parse({
      id: "1",
      title: "Test page",
      permalink: "test-page",
      siteId: 1,
      parentId: null,
      publishedVersionId: null,
      draftBlobId: "draft-1",
      state: ResourceState.Published,
      type: ResourceType.Page,
      scheduledAt: null,
      scheduledBy: null,
      scheduledAction: ScheduledAction.Publish,
      lastPublishedAt: now,
      createdAt: now,
      updatedAt: now,
    })

    // Assert
    expect(result.type).toBe(ResourceType.Page)
    expect(result.state).toBe(ResourceState.Published)
    expect(result.scheduledAction).toBe(ScheduledAction.Publish)
  })
})
