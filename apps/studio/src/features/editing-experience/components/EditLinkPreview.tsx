import type { IsomerSitemap } from "@opengovsg/isomer-components"
import { useAtomValue } from "jotai"

import { useQueryParse } from "~/hooks/useQueryParse"
import { editLinkSchema } from "~/pages/sites/[siteId]/links/[linkId]"
import { trpc } from "~/utils/trpc"
import { linkAtom } from "../atoms"
import PreviewWithoutSitemap from "./PreviewWithoutSitemap"
import { ViewportContainer } from "./ViewportContainer"

export const EditLinkPreview = (): JSX.Element => {
  const { summary } = useAtomValue(linkAtom)
  const { linkId, siteId } = useQueryParse(editLinkSchema)
  const [permalink] = trpc.page.getFullPermalink.useSuspenseQuery(
    {
      pageId: linkId,
      siteId,
    },
    { refetchOnWindowFocus: false },
  )

  const [parentResource] = trpc.resource.getParentOf.useSuspenseQuery({
    resourceId: String(linkId),
    siteId,
  })

  const [children] = trpc.collection.getSiblingsOf.useSuspenseQuery({
    siteId,
    resourceId: linkId,
  })

  const parentPermalink = permalink.split("/").slice(0, -1).join("/")
  const linkSuffix = permalink.split("/").slice(-1).join("/")

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
        title: parentResource.title,
        summary: "Learn more about PREPARE here.",
        children: children.map((props) => ({
          ...props,
          date: "12 May 2023",
          ref: "Test",
          summary:
            linkSuffix === props.permalink
              ? summary || ""
              : "This is the summary of your page",
          layout: "link",
          permalink: `${parentPermalink}/${props.permalink}`,
          lastModified: new Date().toString(),
        })),
      },
    ],
  } satisfies IsomerSitemap

  return (
    <ViewportContainer siteId={siteId}>
      <PreviewWithoutSitemap
        content={[]}
        page={{ title: parentResource.title }}
        layout={"collection"}
        siteId={siteId}
        siteMap={siteMap}
        permalink={parentPermalink}
        version="0.1.0"
      />
    </ViewportContainer>
  )
}
