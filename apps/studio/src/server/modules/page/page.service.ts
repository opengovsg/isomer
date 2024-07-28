import { format } from "date-fns"

import { db } from "../database"
import { getPageById, updatePageById } from "../resource/resource.service"
import { createVersion, getVersionById } from "../version/version.service"

export const createDefaultPage = ({
  title,
  layout,
}: {
  layout: "content" | "article"
  title: string
}) => {
  switch (layout) {
    case "content": {
      const contentDefaultPage = {
        layout: "content",
        page: {
          title,
          contentPageHeader: {
            summary: "",
          },
        },
        content: [],
        version: "0.1.0",
      } satisfies PrismaJson.BlobJsonContent
      return contentDefaultPage
    }

    case "article": {
      const articleDefaultPage = {
        layout: "article",
        page: {
          title,
          date: format(new Date(), "dd-MM-yyyy"),
          category: "Feature Articles",
          articlePageHeader: {
            summary: [],
          },
        },
        content: [],
        version: "0.1.0",
      } satisfies PrismaJson.BlobJsonContent

      return articleDefaultPage
    }
  }
}

export const addNewVersion = async (siteId: number, pageId: number) => {
  return await db.transaction().execute(async (tx) => {
    const page = await getPageById({ siteId, resourceId: pageId })

    if (!page.draftBlobId) {
      return { error: "No drafts to publish for this page" }
    }

    let newVersionNum = 1
    if (page.versionId) {
      const currentVersion = await getVersionById({
        versionId: page.versionId,
      })
      newVersionNum = Number(currentVersion.versionNum) + 1
    }

    // Create the new version
    // TODO: To pass in the tx object
    const newVersion = await createVersion(
      {
        versionNum: newVersionNum,
        resourceId: pageId,
        blobId: Number(page.draftBlobId),
      },
      tx,
    )

    // Update resource with new versionId and draft to be null
    await updatePageById({
      props: {
        page: {
          ...page,
          id: page.id,
          versionId: newVersion.versionId,
          draftBlobId: null,
          state: "Published",
        },
        siteId,
      },
      tx,
    })

    return { versionId: newVersion }
  })
}
