import type { CSSProperties, PropsWithChildren } from "react"
import { useEffect, useMemo } from "react"
import { Flex } from "@chakra-ui/react"
import Frame, { useFrame } from "react-frame-component"

import type { ViewportOptions } from "./IframeToolbar"

interface PreviewIframeProps extends PropsWithChildren {
  preventPointerEvents?: boolean
  keyForRerender?: string
  style?: CSSProperties
  viewport?: ViewportOptions
}

export const PreviewIframe = ({
  children,
  preventPointerEvents,
  keyForRerender,
  style,
  viewport,
}: PreviewIframeProps): JSX.Element => {
  const extraProps = preventPointerEvents
    ? {
        initialContent: `<!DOCTYPE html><html><head></head><body><div id="frame-root" style="pointer-events: none;"></div></body></html>`,
        mountTarget: "#frame-root",
      }
    : {}

  const viewportWidth = useMemo(() => {
    if (!viewport) return "100%"
    switch (viewport) {
      case "desktop":
        return "1440px"
      case "tablet":
        return "768px"
      case "mobile":
        return "480px"
      default:
        return "100%"
    }
  }, [viewport])

  return (
    <Flex
      bg="white"
      shadow="md"
      justify="center"
      w={viewportWidth}
      h="100%"
      borderRadius="8px"
      userSelect="none"
    >
      <Frame
        style={{
          width: viewportWidth,
          borderRadius: "8px",
        }}
        {...extraProps}
        head={
          // eslint-disable-next-line @next/next/no-css-tags
          <link
            rel="stylesheet"
            type="text/css"
            href="/assets/css/preview-tw.css"
          />
        }
      >
        <div style={style}>
          <IframeInnerComponent key={keyForRerender}>
            {children}
          </IframeInnerComponent>
        </div>
      </Frame>
    </Flex>
  )
}

const IframeInnerComponent = ({ children }: PropsWithChildren) => {
  const { document: iframeDocument } = useFrame()

  // !! This effect might break usages of scroll lock if scroll lock is not triggered by inside the iframe.
  useEffect(() => {
    // Since iframes are sandboxed, we need to manually apply the styles to the iframe's body
    // when the styles are changed in the parent document.
    const observer = new MutationObserver((mutationList) => {
      mutationList.forEach((mutation) => {
        if (mutation.attributeName === "style") {
          const mutationTarget = mutation.target as Element
          const newStyles = mutationTarget.getAttribute("style")
          if (newStyles) {
            if (!String(newStyles).includes("overflow: auto")) {
              // Hint to make iframe ignore when manually removing root styles when synchronising iframe
              mutationTarget.setAttribute("style", "overflow: auto;")
              iframeDocument?.documentElement.setAttribute("style", newStyles)
            }
          } else {
            iframeDocument?.documentElement.removeAttribute("style")
          }
        }
      })
    })
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    })

    return () => observer.disconnect()
  }, [iframeDocument?.documentElement])

  return children
}
