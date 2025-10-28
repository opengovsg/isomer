import type {
  IsomerSiteConfigProps,
  IsomerSiteProps,
  IsomerSiteThemeProps,
} from "@opengovsg/isomer-components"

import { AskgovWidget } from "~/components/Askgov"
import { VicaWidget } from "~/components/Vica"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { siteSchema } from "../schema"
import Preview from "./Preview"
import { ViewportContainer } from "./ViewportContainer"

// NOTE: the theme in site config refers to the site-wide theme of
// either `isomer-next` or `isomer-classic`
type EditSettingsPreviewProps = Partial<Omit<IsomerSiteConfigProps, "theme">> &
  Pick<IsomerSiteProps, "siteName"> & { theme?: IsomerSiteThemeProps }

export const EditSettingsPreview = ({
  siteName,
  theme,
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
    <ViewportContainer siteId={siteId} theme={theme}>
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
