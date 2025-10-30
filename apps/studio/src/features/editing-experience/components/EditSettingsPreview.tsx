import type {
  IsomerSiteConfigProps,
  IsomerSiteProps,
  IsomerSiteThemeProps,
} from "@opengovsg/isomer-components"
import type { UnwrapTagged } from "type-fest"
import { CSSProperties, PropsWithChildren, useState } from "react"
import { Box, TabList, Text } from "@chakra-ui/react"
import { Tab, Tabs } from "@opengovsg/design-system-react"

import type { IframeCallbackFnProps } from "~/types/dom"
import { AskgovWidget } from "~/components/Askgov"
import { VicaWidget } from "~/components/Vica"
import { env } from "~/env.mjs"
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

const BUTTON_COLOURS = ["red", "yellow", "green"]

const WindowButtons = () => {
  return (
    <Box
      style={{
        background: "white",
        display: "flex",
        gap: "8px",
        paddingLeft: "1rem",
        paddingRight: "1rem",
        paddingTop: "0.75rem",
        paddingBottom: "0.75rem",
        alignItems: "center",
      }}
    >
      {BUTTON_COLOURS.map((color) => (
        <Box
          style={{
            borderRadius: "50%",
            background: color,
            width: "16px",
            height: "16px",
          }}
        />
      ))}
    </Box>
  )
}

const ChromeTab = ({
  children,
  style,
}: PropsWithChildren<{ style?: CSSProperties }>) => {
  return (
    <Box style={{ display: "flex", ...style }}>
      <Box
        style={{
          height: "40px",
          width: "40px",
          borderRadius: "50%",
          zIndex: -1,
          boxShadow: "20px 20px aqua",
        }}
      />
      <Box
        style={{
          borderTopLeftRadius: "8px",
          borderTopRightRadius: "8px",
          background: "aqua",
          padding: "8px",
          width: "fit-content",
        }}
      >
        {children}
      </Box>
      <Box
        style={{
          height: "40px",
          width: "40px",
          borderRadius: "50%",
          zIndex: -1,
          boxShadow: "-20px 20px aqua",
        }}
      />
    </Box>
  )
}

// NOTE: the theme in site config refers to the site-wide theme of
// either `isomer-next` or `isomer-classic`
type EditSettingsPreviewProps = Partial<Omit<IsomerSiteConfigProps, "theme">> &
  Pick<IsomerSiteProps, "siteName"> & {
    theme?: IsomerSiteThemeProps
    previewMockContentPage?: boolean
    jumpToFooter?: boolean
    showChromeTab?: boolean
  }

export const EditSettingsPreview = ({
  siteName,
  theme,
  previewMockContentPage = false,
  jumpToFooter,
  showChromeTab = false,
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

  const s3Domain = env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME

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
        {showChromeTab && (
          <Box
            style={{
              display: "flex",
            }}
          >
            <WindowButtons />
            <ChromeTab
              style={{
                marginLeft: "-24px",
                marginTop: "8px",
              }}
            >
              <Box
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <img
                  style={{ width: "16px", height: "16px" }}
                  src={`https://${s3Domain}${rest.favicon}`}
                />
                <Text
                  style={{
                    lineHeight: "1.25rem",
                    fontSize: "0.875rem",
                    fontWeight: 400,
                    letterSpacing: 0,
                  }}
                >
                  {siteName}
                </Text>
              </Box>
            </ChromeTab>
          </Box>
        )}
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
