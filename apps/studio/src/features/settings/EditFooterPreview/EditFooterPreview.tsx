import merge from "lodash/merge"

import type { IframeCallbackFnProps } from "~/types/dom"
import Preview from "~/features/editing-experience/components/Preview"
import { ViewportContainer } from "~/features/editing-experience/components/ViewportContainer"
import { waitForElement } from "~/utils/dom"
import { trpc } from "~/utils/trpc"
import { FOOTER_QUERY_SELECTOR } from "../constants"

interface EditFooterPreviewProps {
  siteId: number
}

export const EditFooterPreview = ({ siteId }: EditFooterPreviewProps) => {
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

  const [{ id, title }] = trpc.page.getRootPage.useSuspenseQuery({
    siteId,
  })
  const pageId = Number(id)
  const [{ content, updatedAt }] = trpc.page.readPageAndBlob.useSuspenseQuery({
    pageId,
    siteId,
  })

  return (
    <ViewportContainer siteId={siteId} callback={handleIframeMount}>
      <Preview
        {...merge(content, { page: { title } })}
        siteId={siteId}
        resourceId={pageId}
        permalink="/"
        lastModified={updatedAt.toISOString()}
        version="0.1.0"
      />
    </ViewportContainer>
  )
}
