import type { IsomerSitemap } from "@opengovsg/isomer-components"
import { ResourceType } from "~prisma/generated/generatedEnums"

import { useQueryParse } from "~/hooks/useQueryParse"
import { editLinkSchema } from "~/pages/sites/[siteId]/links/[linkId]"
import { trpc } from "~/utils/trpc"
import { CollectionLinkProps } from "../atoms"
import PreviewWithoutSitemap from "./PreviewWithoutSitemap"
import { ViewportContainer } from "./ViewportContainer"

export const EditCollectionLinkPreview = ({
  link,
}: {
  link: CollectionLinkProps
}): JSX.Element => {
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

  const parentPermalink = permalink.split("/").slice(0, -1).join("/")
  const parentTitle = parent?.title || ResourceType.Collection

  const siteMap = {
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
            summary: link.description ?? "",
            layout: "link",
            permalink,
            lastModified: new Date().toString(),
            ...link,
          },
        ],
      },
    ],
  } satisfies IsomerSitemap

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
