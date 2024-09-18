import { useState } from "react"
import { Flex } from "@chakra-ui/react"
import merge from "lodash/merge"

import type { ViewportOptions } from "./IframeToolbar"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useSiteThemeCssVars } from "~/features/preview/hooks/useSiteThemeCssVars"
import { IframeToolbar } from "./IframeToolbar"
import Preview from "./Preview"
import { PreviewIframe } from "./PreviewIframe"

export const EditPagePreview = (): JSX.Element => {
  const { previewPageState, pageId, updatedAt, siteId, permalink, title } =
    useEditorDrawerContext()
  const themeCssVars = useSiteThemeCssVars({ siteId })

  const [viewport, setViewport] = useState<ViewportOptions>("responsive")

  return (
    <Flex
      shrink={0}
      bg="base.canvas.backdrop"
      height="100%"
      flexDirection="column"
    >
      <IframeToolbar viewport={viewport} setViewport={setViewport} />
      <Flex
        px="2rem"
        pb="2rem"
        pt="1rem"
        overflowX="auto"
        height="100%"
        justify="flex-start"
      >
        <PreviewIframe style={themeCssVars} viewport={viewport}>
          <Preview
            {...merge(previewPageState, { page: { title } })}
            siteId={siteId}
            resourceId={pageId}
            permalink={permalink}
            lastModified={updatedAt}
            version="0.1.0"
          />
        </PreviewIframe>
      </Flex>
    </Flex>
  )
}
