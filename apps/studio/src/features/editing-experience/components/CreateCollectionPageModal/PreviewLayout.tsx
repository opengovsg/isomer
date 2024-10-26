import { Suspense, useMemo } from "react"
import { Box, Flex, Skeleton, Stack } from "@chakra-ui/react"
import { useIsMobile } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { format } from "date-fns"

import collectionSitemap from "~/features/editing-experience/data/collectionSitemap.json"
import { useSiteThemeCssVars } from "~/features/preview/hooks/useSiteThemeCssVars"
import { PreviewIframe } from "../PreviewIframe"
import PreviewWithoutSitemap from "../PreviewWithoutSitemap"
import { generatePreviewSitemap } from "../utils"
import { useCreateCollectionPageWizard } from "./CreateCollectionPageWizardContext"

export const PreviewLayout = (): JSX.Element => {
  const isMobile = useIsMobile()
  const { currentType } = useCreateCollectionPageWizard()

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
            {`You're previewing a collection ${currentType === ResourceType.CollectionLink ? "link" : "page"}`}
          </Flex>
          <Box bg="white" overflow="auto" height="100%">
            <Suspense fallback={<Skeleton height="100%" />}>
              <SuspendableLayoutPreview />
            </Suspense>
          </Box>
        </Box>
      )}
    </Stack>
  )
}

const SuspendableLayoutPreview = () => {
  const {
    pagePreviewJson,
    currentType,
    siteId,
    formMethods: { watch },
  } = useCreateCollectionPageWizard()
  const themeCssVars = useSiteThemeCssVars({ siteId })
  const currentPermalink = watch("permalink", "/")
  const title = watch("title")

  const previewOverrides = useMemo(() => {
    switch (currentType) {
      case ResourceType.CollectionLink: {
        return {
          page: {
            title: "Newsroom",
            date: format(new Date(), "dd MMM yyyy"),
          },
        }
      }
      case ResourceType.CollectionPage: {
        return {}
      }
    }
  }, [currentType])

  return (
    <PreviewIframe
      preventPointerEvents
      keyForRerender={currentType}
      style={themeCssVars}
    >
      <PreviewWithoutSitemap
        overrides={previewOverrides}
        siteId={siteId}
        siteMap={generatePreviewSitemap(collectionSitemap, title)}
        permalink={currentPermalink}
        {...pagePreviewJson}
      />
    </PreviewIframe>
  )
}
