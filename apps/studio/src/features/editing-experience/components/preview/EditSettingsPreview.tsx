import type {
  IsomerSiteConfigProps,
  IsomerSiteProps,
  IsomerSiteThemeProps,
} from "@opengovsg/isomer-components"
import type { CSSProperties, PropsWithChildren } from "react"
import type { UnwrapTagged } from "type-fest"
import type { IframeCallbackFnProps } from "~/types/dom"
import { Box, Icon, TabList, Text, useTheme, useToken } from "@chakra-ui/react"
import { Tab, Tabs } from "@opengovsg/design-system-react"
import Image from "next/image"
import { useState } from "react"
import {
  BiChevronLeft,
  BiChevronRight,
  BiGlobe,
  BiRevision,
  BiX,
} from "react-icons/bi"
import { AskgovWidget } from "~/components/Askgov"
import { VicaWidget } from "~/components/Vica"
import { env } from "~/env.mjs"
import contentLayoutPreview from "~/features/editing-experience/data/contentLayoutPreview.json"
import { FOOTER_QUERY_SELECTOR } from "~/features/settings/constants"
import { useQueryParse } from "~/hooks/useQueryParse"
import { waitForElement } from "~/utils/dom"
import { trpc } from "~/utils/trpc"

import { siteSchema } from "../../schema"
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
    bgColor: "muted.main.active",
    borderColor: "interaction.main.default",
    textColor: "interaction.main.default",
    textTransform: "none",
  },
  // SAFETY: caller invariant is checked immediately before this narrowing assertion
} as const

const BUTTON_COLOURS = ["#ff5f56", "#ffbd2e", "#27c93f"]

const WindowButtons = () => (
  <Box
    style={{
      alignItems: "center",
      display: "flex",
      gap: "8px",
      paddingBottom: "0.75rem",
      paddingRight: "12px",
      paddingTop: "0.75rem",
    }}
  >
    {BUTTON_COLOURS.map((color) => (
      <Box
        key={color}
        style={{
          background: color,
          borderRadius: "50%",
          height: "16px",
          width: "16px",
        }}
      />
    ))}
  </Box>
)

const CHROME_TAB_BASE_STYLE = {
  display: "flex",
  paddingTop: "8px",
  paddingBottom: "8px",
  paddingLeft: "16px",
  paddingRight: "16px",
  gap: "12px",
  borderRadius: "10px 10px 0 0",
  alignItems: "center",
  // SAFETY: caller invariant is checked immediately before this narrowing assertion
} as const

// SAFETY: caller invariant is checked immediately before this narrowing assertion
const CHROME_TAB_FAVICON_STYLE = { height: "16px", width: "16px" } as const
// SAFETY: caller invariant is checked immediately before this narrowing assertion
const CHROME_TAB_CLOSE_ICON_STYLE = { marginLeft: "2rem" } as const

const ADDRESS_BAR_BASE_STYLE = {
  display: "flex",
  paddingTop: "8px",
  paddingBottom: "8px",
  paddingLeft: "12px",
  paddingRight: "12px",
  gap: "12px",
  borderRadius: "10px 10px 0 0",
  alignItems: "center",
  width: "100%",
  // SAFETY: caller invariant is checked immediately before this narrowing assertion
} as const

// SAFETY: caller invariant is checked immediately before this narrowing assertion
const ADDRESS_BAR_NAV_ICONS_STYLE = { display: "flex", gap: "4px" } as const
// SAFETY: caller invariant is checked immediately before this narrowing assertion
const ADDRESS_BAR_NAV_ICON_STYLE = { margin: "8px" } as const

const ADDRESS_BAR_INPUT_STYLE = {
  borderRadius: "16777200px",
  border: "1px solid rgba(0, 0, 0, 0.00)",
  background: " #F1F3F4",
  padding: "8px 16px",
  width: "100%",
  // SAFETY: caller invariant is checked immediately before this narrowing assertion
} as const

const ChromeTab = ({
  children,
  style,
  favicon,
}: PropsWithChildren<{ style?: CSSProperties; favicon?: string }>) => {
  const bgColor = useToken("colors", "utility.ui")
  const s3Domain = env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME

  return (
    <Box
      style={{
        ...CHROME_TAB_BASE_STYLE,
        background: bgColor,
        ...style,
      }}
    >
      {favicon ? (
        <Image
          style={CHROME_TAB_FAVICON_STYLE}
          src={`https://${s3Domain}${favicon}`}
          alt="Site favicon"
          width="16"
          height="16"
        />
      ) : (
        <Icon as={BiGlobe} />
      )}
      {children}
      <Icon as={BiX} style={CHROME_TAB_CLOSE_ICON_STYLE} />
    </Box>
  )
}

const AddressBar = ({
  children,
  style,
}: PropsWithChildren<{ style?: CSSProperties }>) => {
  const bgColor = useToken("colors", "utility.ui")
  const iconColor = useToken("colors", "base.content.default")

  return (
    <Box
      style={{
        ...ADDRESS_BAR_BASE_STYLE,
        background: bgColor,
        ...style,
      }}
    >
      <Box style={ADDRESS_BAR_NAV_ICONS_STYLE}>
        {[BiChevronLeft, BiChevronRight, BiRevision].map((icon) => (
          <Icon
            key={icon.name}
            as={icon}
            style={{ ...ADDRESS_BAR_NAV_ICON_STYLE, fill: iconColor }}
          />
        ))}
      </Box>
      <Box style={ADDRESS_BAR_INPUT_STYLE}>{children}</Box>
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

const handleSettingsPreviewIframeMount = async ({
  document,
}: IframeCallbackFnProps) => {
  if (document) {
    await waitForElement(document, FOOTER_QUERY_SELECTOR)
    const footer = document.querySelector(FOOTER_QUERY_SELECTOR)

    // Jump to the footer section
    if (footer) {
      footer.scrollIntoView()
    }
  }
}

export const EditSettingsPreview = ({
  siteName,
  theme,
  previewMockContentPage = false,
  jumpToFooter,
  showChromeTab = false,
  ...rest
}: EditSettingsPreviewProps): React.ReactNode => {
  const { siteId: rawSiteId } = useQueryParse(siteSchema)
  const siteId = Number(rawSiteId)
  const [{ id }] = trpc.page.getRootPage.useSuspenseQuery({
    siteId,
  })
  const [{ content, updatedAt }] = trpc.page.readPageAndBlob.useSuspenseQuery({
    pageId: Number(id),
    siteId,
  })
  const [tabIndex, setTabIndex] = useState(0)
  // SAFETY: content layout preview blob matches the Prisma page content shape
  const previewProps =
    tabIndex === 1
      ? (contentLayoutPreview as UnwrapTagged<PrismaJson.BlobJsonContent>)
      : content

  const isomerTheme = useTheme()
  // SAFETY: Chakra text style tokens are keyed by the Isomer theme style names
  const bodyTextStyle = (
    isomerTheme.textStyles as Record<string, Record<string, string>>
  )["body-2"]

  return (
    <Box bg="base.canvas.backdrop" h="full">
      <ViewportContainer
        siteId={siteId}
        theme={theme}
        callback={jumpToFooter ? handleSettingsPreviewIframeMount : undefined}
        header={
          previewMockContentPage && (
            <Tabs
              pt="1.5rem"
              px="2rem"
              w="full"
              display="flex"
              onChange={(index) => {
                setTabIndex(index)
              }}
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
          <>
            <Box
              style={{
                background: "#e8eaed",
                display: "flex",
                paddingLeft: "12px",
                paddingRight: "12px",
                paddingTop: "8px",
              }}
            >
              <WindowButtons />
              <ChromeTab favicon={rest.favicon}>
                <Text style={{ ...bodyTextStyle, fontFamily: "inherit" }}>
                  {siteName}
                </Text>
              </ChromeTab>
            </Box>
            <AddressBar>
              <Text style={{ ...bodyTextStyle, fontFamily: "inherit" }}>
                {rest.url ?? "example.isomer.gov.sg"}
              </Text>
            </AddressBar>
          </>
        )}
        <Preview
          siteId={siteId}
          resourceId={Number(id)}
          permalink="/"
          lastModified={updatedAt.toISOString()}
          {...previewProps}
          overrides={{ site: { siteName, ...rest } }}
        />
        {!!rest.askgov && <AskgovWidget />}
        {!!rest.vica && <VicaWidget />}
      </ViewportContainer>
    </Box>
  )
}
