import type {
  IsomerSiteConfigProps,
  IsomerSiteProps,
  IsomerSiteThemeProps,
} from "@opengovsg/isomer-components"
import type { UnwrapTagged } from "type-fest"
import { useState } from "react"
import { Box, TabList, Text } from "@chakra-ui/react"
import { Tab, Tabs } from "@opengovsg/design-system-react"

import type { IframeCallbackFnProps } from "~/types/dom"
import { AskgovWidget } from "~/components/Askgov"
import { VicaWidget } from "~/components/Vica"
import contentLayoutPreview from "~/features/editing-experience/data/contentLayoutPreview.json"
import { FOOTER_QUERY_SELECTOR } from "~/features/settings/constants"
import { useQueryParse } from "~/hooks/useQueryParse"
import { waitForElement } from "~/utils/dom"
import { trpc } from "~/utils/trpc"
import { siteSchema } from "../schema"
import Preview from "./Preview"
import { ViewportContainer } from "./ViewportContainer"

const SHARED_TAB_STYLES = {
  border: "1px solid",
  borderColor: "base.divider.strong",
  px: "1rem",
  py: "0.5rem",
  w: "50%",
  textAlign: "center",
  bgColor: "utility.ui",
  justifyContent: "center",
  display: "flex",
  m: 0,
  textTransform: "none",
  textColor: "base.content.default",
  _hover: { bgColor: "interaction.muted.main.hover" },
  _selected: {
    textTransform: "none",
    borderColor: "interaction.main.default",
    bgColor: "muted.main.active",
    textColor: "interaction.main.default",
  },
} as const

// NOTE: the theme in site config refers to the site-wide theme of
// either `isomer-next` or `isomer-classic`
type EditSettingsPreviewProps = Partial<Omit<IsomerSiteConfigProps, "theme">> &
  Pick<IsomerSiteProps, "siteName"> & {
    theme?: IsomerSiteThemeProps
    previewMockContentPage?: boolean
    jumpToFooter?: boolean
  }

export const EditSettingsPreview = ({
  siteName,
  theme,
  previewMockContentPage = false,
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
  const [tabIndex, setTabIndex] = useState(0)
  const previewProps =
    tabIndex === 1
      ? (contentLayoutPreview as UnwrapTagged<PrismaJson.BlobJsonContent>)
      : content

  return (
    <Box bg="base.canvas.backdrop" h="full">
      <ViewportContainer
        siteId={siteId}
        theme={theme}
        callback={jumpToFooter ? handleIframeMount : undefined}
        header={
          previewMockContentPage && (
            <Tabs
              pt="1.5rem"
              px="2rem"
              w="full"
              display="flex"
              onChange={(index) => setTabIndex(index)}
            >
              <TabList w="full" gap={0} textTransform="none">
                <Tab borderLeftRadius="4px" {...SHARED_TAB_STYLES}>
                  <Text textStyle="subhead-2">Homepage</Text>
                </Tab>
                <Tab {...SHARED_TAB_STYLES} borderRightRadius="4px">
                  <Text textStyle="subhead-2">Content page</Text>
                </Tab>
              </TabList>
            </Tabs>
          )
        }
      >
        <Preview
          siteId={siteId}
          resourceId={Number(id)}
          permalink={"/"}
          lastModified={new Date().toISOString()}
          {...previewProps}
          overrides={{ site: { siteName, ...rest } }}
        />
        {!!rest.askgov && <AskgovWidget />}
        {!!rest.vica && <VicaWidget />}
      </ViewportContainer>
    </Box>
  )
}
