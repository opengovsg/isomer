import type { IsomerSiteProps } from "@opengovsg/isomer-components"

import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { siteSchema } from "../schema"
import Preview from "./Preview"
import { ViewportContainer } from "./ViewportContainer"

type EditSettingsPreviewProps = Pick<
  IsomerSiteProps,
  "siteName" | "notification"
>

export const EditSettingsPreview = ({
  siteName,
  notification,
}: EditSettingsPreviewProps): JSX.Element => {
  const { siteId: rawSiteId } = useQueryParse(siteSchema)
  const siteId = Number(rawSiteId)
  const [{ id }] = trpc.page.getRootPage.useSuspenseQuery({
    siteId,
  })
  const [{ content }] = trpc.page.readPageAndBlob.useSuspenseQuery({
    pageId: Number(id),
    siteId,
  })

  return (
    <ViewportContainer siteId={siteId}>
      <Preview
        siteId={siteId}
        resourceId={Number(id)}
        permalink={"/"}
        lastModified={new Date().toISOString()}
        version="0.1.0"
        content={content.content}
        layout="homepage"
        page={content.page}
        overrides={{ site: { siteName, notification } }}
      />
    </ViewportContainer>
  )
}
