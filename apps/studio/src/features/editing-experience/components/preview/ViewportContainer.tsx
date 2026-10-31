import type { FlexProps } from "@chakra-ui/react"
import type { IsomerSiteThemeProps } from "@opengovsg/isomer-components"
import type { PropsWithChildren } from "react"
import type { IframeCallbackFnProps } from "~/types/dom"
import { Flex, Portal } from "@chakra-ui/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useSiteThemeCssVars } from "~/features/preview/hooks/useSiteThemeCssVars"
import { convertThemeToCss } from "~/features/settings/utils"

import type { ViewportOptions } from "./IframeToolbar"
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
  callback?: (props: IframeCallbackFnProps) => void
  theme?: IsomerSiteThemeProps
  header?: React.ReactNode
}
export const ViewportContainer = ({
  children,
  siteId,
  callback,
  theme,
  header,
}: PropsWithChildren<ViewportContainerProps>) => {
  const themeCssVars = useSiteThemeCssVars({ siteId })
  const mergedTheme = theme
    ? { ...themeCssVars, ...convertThemeToCss(theme) }
    : themeCssVars

  const [viewport, setViewport] = useState<ViewportOptions>("responsive")

  // Measure the preview area's content width so the toolbar's "Fit to screen"
  // label can report which device bucket the responsive pane is simulating —
  // in responsive mode the iframe fills 100% of this box.
  const previewAreaRef = useRef<HTMLDivElement>(null)
  const [previewAreaWidth, setPreviewAreaWidth] = useState(0)
  useEffect(() => {
    const el = previewAreaRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setPreviewAreaWidth(w)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

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
          responsiveWidthPx={previewAreaWidth}
        />
        <Flex
          ref={previewAreaRef}
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
            callback={callback}
          >
            {children}
          </PreviewIframe>
        </Flex>
      </Flex>
    </PortalIfFullscreen>
  )
}
