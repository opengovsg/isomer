import { expect } from "@playwright/test"
import { ResourceType } from "~prisma/generated/generatedEnums"

import {
  getResource,
  getResourceByTitle,
  getResourceDraftBlobContent,
  getResourceDraftBlobId,
  getResourceDraftTagged,
  getResourceId,
  getResourceParentId,
  getResourcePermalink,
  getResourceScheduledAt,
  getResourceScheduledBy,
  getResourceState,
  getResourceTitle,
  listResourcesByParent,
} from "./db"

export const expectResource = (resourceId: string) =>
  expect.poll(() => getResource(resourceId))

export const expectResourceDraftTagged = (resourceId: string) =>
  expect.poll(() => getResourceDraftTagged(resourceId))

export const expectResourcesByParentCount = (opts: {
  siteId: number
  parentId: string
  type: ResourceType
}) => expect.poll(async () => (await listResourcesByParent(opts)).length)

export const expectResourceByTitle = (opts: {
  siteId: number
  title: string
}) => expect.poll(() => getResourceByTitle(opts))

export const expectResourceId = (resourceId: string) =>
  expect.poll(() => getResourceId(resourceId))

export const expectResourceParentId = (resourceId: string) =>
  expect.poll(() => getResourceParentId(resourceId))

export const expectResourceTitle = (resourceId: string) =>
  expect.poll(() => getResourceTitle(resourceId))

export const expectResourceState = (resourceId: string) =>
  expect.poll(() => getResourceState(resourceId))

export const expectResourceDraftBlobId = (resourceId: string) =>
  expect.poll(() => getResourceDraftBlobId(resourceId))

export const expectResourceDraftBlobContains = (
  resourceId: string,
  text: string,
) => expect.poll(() => getResourceDraftBlobContent(resourceId)).toContain(text)

export const expectResourcePermalink = (resourceId: string) =>
  expect.poll(() => getResourcePermalink(resourceId))

export const expectResourceScheduledAt = (resourceId: string) =>
  expect.poll(() => getResourceScheduledAt(resourceId))

export const expectResourceScheduledBy = (resourceId: string) =>
  expect.poll(() => getResourceScheduledBy(resourceId))

/** Capture scheduledAt after it is set, run `action`, then assert it changed. */
export const expectResourceScheduledAtChangesAfter = async (
  resourceId: string,
  action: () => Promise<void>,
) => {
  await expectResourceScheduledAt(resourceId).not.toBeNull()
  const before = await getResourceScheduledAt(resourceId)
  await action()
  await expectResourceScheduledAt(resourceId).not.toBeNull()
  await expectResourceScheduledAt(resourceId).not.toEqual(before)
}
