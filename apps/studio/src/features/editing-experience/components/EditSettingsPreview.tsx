import type {
  IsomerSiteConfigProps,
  IsomerSiteProps,
} from "@opengovsg/isomer-components"

import { AskgovWidget } from "~/components/Askgov"
import { VicaWidget } from "~/components/Vica"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { siteSchema } from "../schema"
import Preview from "./Preview"
import { ViewportContainer } from "./ViewportContainer"

type EditSettingsPreviewProps = Partial<IsomerSiteConfigProps> &
  Pick<IsomerSiteProps, "siteName">

export const EditSettingsPreview = ({
  siteName,
  ...rest
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
        overrides={{ site: { siteName, ...rest } }}
      />
      {!!rest.askgov && <AskgovWidget />}
      {!!rest.vica && <VicaWidget />}
    </ViewportContainer>
  )
}
