import { Flex } from "@chakra-ui/react"
import merge from "lodash/merge"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useSiteThemeCssVars } from "~/features/preview/hooks/useSiteThemeCssVars"
import Preview from "./Preview"
import { PreviewIframe } from "./PreviewIframe"

export const EditPagePreview = (): JSX.Element => {
  const { previewPageState, pageId, updatedAt, siteId, permalink, title } =
    useEditorDrawerContext()
  const themeCssVars = useSiteThemeCssVars({ siteId })

  return (
    <Flex
      shrink={0}
      justify="flex-start"
      px="2rem"
      pb="2rem"
      pt="1rem"
      bg="base.canvas.backdrop"
      h="100%"
      overflowX="auto"
    >
      <PreviewIframe style={themeCssVars}>
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
  )
}
