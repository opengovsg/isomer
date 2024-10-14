import type { IsomerGeneratedSiteProps } from "@opengovsg/isomer-components"
import { useMemo } from "react"
import { Box, Flex, Stack } from "@chakra-ui/react"
import { useIsMobile } from "@opengovsg/design-system-react"
import { format } from "date-fns"

import collectionSitemap from "~/features/editing-experience/data/collectionSitemap.json"
import { PreviewIframe } from "../PreviewIframe"
import PreviewWithoutSitemap from "../PreviewWithoutSitemap"
import { useCreateCollectionPageWizard } from "./CreateCollectionPageWizardContext"

const generatePreviewSitemap = (
  sitemap: typeof collectionSitemap,
  title = "Your filename",
) => {
  return {
    ...sitemap,
    children: sitemap.children.map(({ children, ...rest }) => ({
      ...rest,
      children: children.map((props) => ({ ...props, title })),
    })),
  } as IsomerGeneratedSiteProps["siteMap"]
}

export const PreviewLayout = (): JSX.Element => {
  const isMobile = useIsMobile()
  const {
    pagePreviewJson,
    currentType,
    siteId,
    formMethods: { watch },
  } = useCreateCollectionPageWizard()

  const currentPermalink = watch("permalink", "/")
  const title = watch("title")

  const previewOverrides = useMemo(() => {
    switch (currentType) {
      case "pdf": {
        return {
          page: {
            date: format(new Date(), "dd MMM yyyy"),
          },
        }
      }
      case "page": {
        return {}
      }
    }
  }, [currentType])

  return (
    <Stack
      flex={1}
      overflow="hidden"
      px="2.5rem"
      pt="2rem"
      bg="base.canvas.alt"
    >
      {!isMobile && (
        <Box shadow="md" borderTopRadius="8px" height="100%">
          <Flex
            borderTopRadius="8px"
            width="100%"
            bg="slate.200"
            textStyle="caption-2"
            color="white"
            py="0.5rem"
            px="1rem"
            justify="center"
            whiteSpace="pre"
          >
            {`You're previewing a ${currentType === "pdf" ? "PDF " : ""}collection page`}
          </Flex>
          <Box bg="white" overflow="auto" height="100%">
            <PreviewIframe preventPointerEvents keyForRerender={currentType}>
              <PreviewWithoutSitemap
                overrides={previewOverrides}
                siteId={siteId}
                siteMap={generatePreviewSitemap(collectionSitemap, title)}
                permalink={currentPermalink}
                {...pagePreviewJson}
              />
            </PreviewIframe>
          </Box>
        </Box>
      )}
    </Stack>
  )
}
