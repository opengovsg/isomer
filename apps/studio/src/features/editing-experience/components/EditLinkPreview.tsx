import type { IsomerSitemap } from "@opengovsg/isomer-components"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { useAtomValue } from "jotai"

import { useQueryParse } from "~/hooks/useQueryParse"
import { editLinkSchema } from "~/pages/sites/[siteId]/links/[linkId]"
import { trpc } from "~/utils/trpc"
import { linkAtom } from "../atoms"
import PreviewWithoutSitemap from "./PreviewWithoutSitemap"
import { ViewportContainer } from "./ViewportContainer"

export const EditCollectionLinkPreview = (): JSX.Element => {
  const {
    description: summary,
    date,
    title,
    category,
    ref,
  } = useAtomValue(linkAtom)
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
        children: [
          {
            id: "9999999",
            title,
            date,
            ref,
            summary: summary ?? "",
            layout: "link",
            permalink,
            lastModified: new Date().toString(),
            category,
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
