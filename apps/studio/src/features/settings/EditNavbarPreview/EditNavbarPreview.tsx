import merge from "lodash/merge"

import type { IframeCallbackFnProps } from "~/types/dom"
import Preview from "~/features/editing-experience/components/Preview"
import { ViewportContainer } from "~/features/editing-experience/components/ViewportContainer"
import { waitForElement } from "~/utils/dom"
import { trpc } from "~/utils/trpc"
import { MOBILE_NAVIGATION_MENU_QUERY_SELECTOR } from "../constants"

interface EditNavbarPreviewProps {
  siteId: number
}

export const EditNavbarPreview = ({ siteId }: EditNavbarPreviewProps) => {
  const handleIframeMount = async ({ document }: IframeCallbackFnProps) => {
    if (document) {
      await waitForElement(document, MOBILE_NAVIGATION_MENU_QUERY_SELECTOR)
      const navbarButton = document.querySelector(
        MOBILE_NAVIGATION_MENU_QUERY_SELECTOR,
      )

      // Click the navbar button to open the navbar menu
      if (navbarButton) {
        navbarButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
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
