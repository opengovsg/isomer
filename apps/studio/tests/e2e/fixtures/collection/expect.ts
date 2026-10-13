import { expect } from "@playwright/test"

import { getCollectionItemTitles, getDraftIndexPage } from "./db"

export const expectDraftIndexPage = (indexPageId: string) =>
  expect.poll(() => getDraftIndexPage(indexPageId))

export const expectCollectionItemTitlesSorted = (collectionId: string) =>
  expect.poll(async () =>
    (await getCollectionItemTitles(collectionId))
      .map((item) => item.title)
      .sort(),
  )
