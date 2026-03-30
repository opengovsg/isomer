import type { CSSProperties, PropsWithChildren } from "react"
import { Flex } from "@chakra-ui/react"
import { useEffect, useMemo, useRef } from "react"
import { useEffect, useMemo } from "react"
import Frame, { useFrame } from "react-frame-component"

import type { ViewportOptions } from "./IframeToolbar"

interface PreviewIframeProps {
  preventPointerEvents?: boolean
  keyForRerender?: string
  style?: CSSProperties
  viewport?: ViewportOptions
  callback?: (props: IframeCallbackFnProps) => void
}

export const PreviewIframe = ({
  children,
  preventPointerEvents,
  keyForRerender,
  style,
  viewport,
  callback,
}: PropsWithChildren<PreviewIframeProps>): JSX.Element => {
  const extraProps = preventPointerEvents
    ? {
        initialContent: `<!DOCTYPE html><html><head></head><body><div id="frame-root" style="pointer-events: none;"></div></body></html>`,
        mountTarget: "#frame-root",
      }
    : {}

  const containerStyles = useMemo(() => {
    if (!viewport)
      return {
        width: "100%",
      }
    switch (viewport) {
      case "tablet":
        return {
          width: "768px",
          borderRadius: "8px",
        }
      case "mobile":
        return {
          width: "480px",
          borderRadius: "8px",
        }
      case "responsive":
        return {
          width: "100%",
          borderRadius: "8px",
        }
      case "fullscreen": {
        return {
          width: "100%",
          borderRadius: 0,
        }
      }
    }
  }, [viewport])

  return (
    <Flex
      bg="white"
      shadow="md"
      justify="center"
      h="100%"
      mx="auto"
      userSelect="none"
      {...containerStyles}
    >
      <Frame
        style={containerStyles}
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
        <IframeInnerComponent
          key={keyForRerender}
          style={style}
          callback={callback}
        >
          {children}
        </IframeInnerComponent>
      </Frame>
    </Flex>
  )
}

const IframeInnerComponent = ({
  children,
  style,
  callback,
}: PropsWithChildren<Pick<PreviewIframeProps, "callback" | "style">>) => {
  const { document: iframeDocument, window: iframeWindow } = useFrame()
  const containerRef = useRef<HTMLDivElement>(null)

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

    const portalObserver = new MutationObserver(() => {
      const portalRoot = document.getElementById("headlessui-portal-root")

      if (
        portalRoot &&
        !containerRef.current?.querySelector("#headlessui-portal-root")
      ) {
        containerRef.current?.appendChild(portalRoot)
      }
    })

    portalObserver.observe(document.body, {
      childList: true,
    })

    if (callback) {
      callback({ document: iframeDocument, window: iframeWindow })
    }

    return () => {
      observer.disconnect()
      portalObserver.disconnect()
    }
  }, [callback, iframeDocument, iframeDocument?.documentElement, iframeWindow])

  return (
    <div ref={containerRef} style={style}>
      {children}
    </div>
  )
}
