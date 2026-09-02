import type { CollectionPagePageProps } from "@opengovsg/isomer-components"
import type { CollectionLinkProps } from "~/schemas/collection"
import { useMemo } from "react"
import { useSuspenseCollectionTags } from "~/features/editing-experience/hooks/useCollectionTags"
import {
  buildCollectionLinkPreviewSitemap,
  getCollectionPermalink,
} from "~/features/editing-experience/utils/buildCollectionLinkPreviewSitemap"
import { useQueryParse } from "~/hooks/useQueryParse"
import { editLinkSchema } from "~/pages/sites/[siteId]/links/[linkId]"
import { trpc } from "~/utils/trpc"
import { ResourceType } from "~prisma/generated/generatedEnums"

import PreviewWithCustomSitemap from "./PreviewWithCustomSitemap"
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

  const [tagCategories] = useSuspenseCollectionTags({
    resourceId: linkId,
    siteId,
  })

  const [indexPage] = trpc.folder.getIndexpage.useSuspenseQuery({
    resourceId: parent?.id ?? "",
    siteId,
  })

  const [{ content: collectionIndexContent }] =
    trpc.page.readPageAndBlob.useSuspenseQuery({
      pageId: Number(indexPage.id),
      siteId,
    })

  const { showThumbnail, showDate } =
    collectionIndexContent.page as CollectionPagePageProps

  // Ends at the parent collection, so drop it — the collection node is built below.
  const [ancestry] = trpc.resource.getAncestryStack.useSuspenseQuery({
    resourceId: String(linkId),
    siteId: String(siteId),
    includeSelf: false,
  })

  const parentPermalink = useMemo(
    () => getCollectionPermalink(permalink),
    [permalink],
  )
  const parentTitle = useMemo(
    () => parent?.title || ResourceType.Collection,
    [parent?.title],
  )
  const ancestorTitles = useMemo(
    () => ancestry.slice(0, -1).map(({ title }) => title),
    [ancestry],
  )

  const siteMap = useMemo(
    () =>
      buildCollectionLinkPreviewSitemap({
        permalink,
        title,
        link,
        collectionTitle: parentTitle,
        ancestorTitles,
        tagCategories,
        lastModified: currentDate,
      }),
    [permalink, title, link, parentTitle, ancestorTitles, tagCategories],
  )

  return (
    <ViewportContainer siteId={siteId}>
      <PreviewWithCustomSitemap
        content={[]}
        page={{ title: parentTitle, tagCategories, showThumbnail, showDate }}
        layout={"collection"}
        siteId={siteId}
        siteMap={siteMap}
        permalink={parentPermalink}
        version="0.1.0"
      />
    </ViewportContainer>
  )
}
