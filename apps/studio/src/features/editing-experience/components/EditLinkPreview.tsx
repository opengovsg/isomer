import type { IsomerSitemap } from "@opengovsg/isomer-components"
import { useMemo } from "react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import { useQueryParse } from "~/hooks/useQueryParse"
import { editLinkSchema } from "~/pages/sites/[siteId]/links/[linkId]"
import { CollectionLinkProps } from "~/schemas/collection"
import { trpc } from "~/utils/trpc"
import PreviewWithoutSitemap from "./PreviewWithoutSitemap"
import { ViewportContainer } from "./ViewportContainer"

const currentDate = new Date().toString()

interface EditCollectionLinkPreviewProps {
  link: CollectionLinkProps
  title: string
}
export const EditCollectionLinkPreview = ({
  link,
  title,
}: EditCollectionLinkPreviewProps): JSX.Element => {
  const { linkId, siteId } = useQueryParse(editLinkSchema)
  const [permalink] = trpc.page.getFullPermalink.useSuspenseQuery(
    {
      pageId: linkId,
      siteId,
    },
    { refetchOnWindowFocus: false },
  )

  const [{ parent }] = trpc.resource.getParentOf.useSuspenseQuery({
    resourceId: String(linkId),
    siteId,
  })

  const [tagCategories] = trpc.collection.getCollectionTags.useSuspenseQuery({
    resourceId: linkId,
    siteId,
  })

  const parentPermalink = useMemo(
    () => permalink.split("/").slice(0, -1).join("/"),
    [permalink],
  )
  const parentTitle = useMemo(
    () => parent?.title || ResourceType.Collection,
    [parent?.title],
  )

  const siteMap = useMemo(
    () =>
      ({
        id: "root",
        permalink: "/",
        lastModified: "2024-10-14T07:05:08.803Z",
        layout: "homepage",
        title: "An Isomer Site",
        summary: "",
        children: [
          {
            id: "collection",
            permalink: parentPermalink,
            lastModified: "02 May 2023",
            layout: "collection",
            title: parentTitle,
            summary: "",
            collectionPagePageProps: { tagCategories },
            children: [
              {
                id: "9999999",
                title,
                summary: link.description ?? "",
                layout: "link",
                permalink,
                lastModified: currentDate,
                ...link,
              },
            ],
          },
        ],
      }) satisfies IsomerSitemap,
    [parentPermalink, parentTitle, tagCategories, link, permalink, title],
  )

  return (
    <ViewportContainer siteId={siteId}>
      <PreviewWithoutSitemap
        content={[]}
        page={{ title: parentTitle }}
        layout={"collection"}
        siteId={siteId}
        siteMap={siteMap}
        permalink={parentPermalink}
        version="0.1.0"
      />
    </ViewportContainer>
  )
}
