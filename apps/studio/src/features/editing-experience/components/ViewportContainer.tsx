import type { FlexProps } from "@chakra-ui/react"
import type { PropsWithChildren } from "react"
import { useMemo, useState } from "react"
import { Flex, Portal } from "@chakra-ui/react"

import type { ViewportOptions } from "./IframeToolbar"
import { useSiteThemeCssVars } from "~/features/preview/hooks/useSiteThemeCssVars"
import { IframeToolbar } from "./IframeToolbar"
import { PreviewIframe } from "./PreviewIframe"

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
}
export const ViewportContainer = ({
  children,
  siteId,
}: PropsWithChildren<ViewportContainerProps>) => {
  const themeCssVars = useSiteThemeCssVars({ siteId })

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
        <IframeToolbar viewport={viewport} setViewport={setViewport} />
        <Flex
          px="2rem"
          pb="2rem"
          pt="1rem"
          overflowX="auto"
          height="100%"
          width="100%"
          {...innerContainerProps}
        >
          <PreviewIframe style={themeCssVars} viewport={viewport}>
            {children}
          </PreviewIframe>
        </Flex>
      </Flex>
    </PortalIfFullscreen>
  )
}
