import type {
  IsomerSiteConfigProps,
  IsomerSiteProps,
} from "@opengovsg/isomer-components"

import { AskgovWidget } from "~/components/Askgov"
import { VicaWidget } from "~/components/Vica"
import { FOOTER_QUERY_SELECTOR } from "~/features/settings/constants"
import { useQueryParse } from "~/hooks/useQueryParse"
import { IframeCallbackFnProps } from "~/types/dom"
import { waitForElement } from "~/utils/dom"
import { trpc } from "~/utils/trpc"
import { siteSchema } from "../schema"
import Preview from "./Preview"
import { ViewportContainer } from "./ViewportContainer"

type EditSettingsPreviewProps = Partial<IsomerSiteConfigProps> &
  Pick<IsomerSiteProps, "siteName"> & {
    jumpToFooter?: boolean
  }

export const EditSettingsPreview = ({
  siteName,
  jumpToFooter,
  ...rest
}: EditSettingsPreviewProps): JSX.Element => {
  const handleIframeMount = async ({ document }: IframeCallbackFnProps) => {
    if (document) {
      await waitForElement(document, FOOTER_QUERY_SELECTOR)
      const footer = document.querySelector(FOOTER_QUERY_SELECTOR)

      // Jump to the footer section
      if (footer) {
        footer.scrollIntoView()
      }
    }
  }

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
    <ViewportContainer
      siteId={siteId}
      callback={jumpToFooter ? handleIframeMount : undefined}
    >
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
