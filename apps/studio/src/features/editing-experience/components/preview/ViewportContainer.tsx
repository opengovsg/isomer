import type { FlexProps } from "@chakra-ui/react"
import type { IsomerSiteThemeProps } from "@opengovsg/isomer-components"
import type { PropsWithChildren } from "react"
import type { IframeCallbackFnProps } from "~/types/dom"
import { Flex, Portal } from "@chakra-ui/react"
import { useCallback, useMemo, useRef, useState } from "react"
import { useSiteThemeCssVars } from "~/features/preview/hooks/useSiteThemeCssVars"
import { convertThemeToCss } from "~/features/settings/utils"
import { trpc } from "~/utils/trpc"

import type { ViewportOptions } from "./IframeToolbar"
import { IframeToolbar } from "./IframeToolbar"
import { PreviewIframe } from "./PreviewIframe"
import { buildStandaloneHtml, downloadHtml } from "./standaloneHtml"

const PortalIfFullscreen = ({
  viewport,
  children,
}: PropsWithChildren<{ viewport: ViewportOptions }>) => {
  if (viewport === "fullscreen") {
    return <Portal>{children}</Portal>
  }

  return children
}

interface ViewportContainerProps {
  siteId: number
  callback?: (props: IframeCallbackFnProps) => void
  theme?: IsomerSiteThemeProps
  header?: React.ReactNode
  // When set, a Download button serialises the preview into this .html file.
  downloadFileName?: string
}
export const ViewportContainer = ({
  children,
  siteId,
  callback,
  theme,
  header,
  downloadFileName,
}: PropsWithChildren<ViewportContainerProps>) => {
  const themeCssVars = useSiteThemeCssVars({ siteId })
  const [siteConfig] = trpc.site.getConfig.useSuspenseQuery({ id: siteId })

  const iframeDocRef = useRef<Document | null>(null)
  const handleFrame = useCallback(
    (props: IframeCallbackFnProps) => {
      iframeDocRef.current = props.document ?? null
      callback?.(props)
    },
    [callback],
  )

  const handleDownload = useCallback(async () => {
    const doc = iframeDocRef.current
    if (!doc || !downloadFileName) return
    const html = await buildStandaloneHtml(doc, new URL(siteConfig.url).host)
    downloadHtml(html, downloadFileName)
  }, [downloadFileName, siteConfig.url])
  const mergedTheme = theme
    ? { ...themeCssVars, ...convertThemeToCss(theme) }
    : themeCssVars

  const [viewport, setViewport] = useState<ViewportOptions>("responsive")

  const containerProps: Partial<FlexProps> = useMemo(() => {
    if (viewport === "fullscreen") {
      return {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }
    }

    return {}
  }, [viewport])

  const innerContainerProps: Partial<FlexProps> = useMemo(() => {
    if (viewport === "fullscreen") {
      return {
        p: 0,
      }
    }

    return {}
  }, [viewport])

  return (
    <PortalIfFullscreen viewport={viewport}>
      <Flex
        shrink={0}
        bg="base.canvas.backdrop"
        height="100%"
        flexDirection="column"
        {...containerProps}
      >
        {!!header && viewport !== "fullscreen" && header}
        <IframeToolbar
          viewport={viewport}
          setViewport={setViewport}
          onDownload={downloadFileName ? handleDownload : undefined}
        />
        <Flex
          px="2rem"
          pb="2rem"
          pt="1rem"
          overflowX="auto"
          height="100%"
          width="100%"
          {...innerContainerProps}
        >
          <PreviewIframe
            style={mergedTheme}
            viewport={viewport}
            callback={handleFrame}
          >
            {children}
          </PreviewIframe>
        </Flex>
      </Flex>
    </PortalIfFullscreen>
  )
}
