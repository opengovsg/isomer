import { expect } from "@playwright/test"

import {
  getResourceByTitle,
  getResourceDraftBlobContent,
  getResourceDraftBlobId,
  getResourceId,
  getResourceParentId,
  getResourcePermalink,
  getResourceScheduledAt,
  getResourceScheduledBy,
  getResourceState,
  getResourceTitle,
} from "./db"

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
