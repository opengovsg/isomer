import type { PropsWithChildren } from "react"
import { useEffect, useState } from "react"
import { Flex } from "@chakra-ui/react"
import Frame, { useFrame } from "react-frame-component"

export const PreviewIframe = ({ children }: PropsWithChildren): JSX.Element => {
  // TODO: Add toolbar for users to adjust the width of the iframe
  const [width, _setWidth] = useState("100%")
  return (
    <Flex
      bg="white"
      shadow="md"
      justify="center"
      w={width}
      h="100%"
      borderRadius="8px"
    >
      <Frame
        style={{
          // TODO: Inject CSS variables for site theme here.
          width,
          borderRadius: "8px",
        }}
        head={
          // eslint-disable-next-line @next/next/no-css-tags
          <link
            rel="stylesheet"
            type="text/css"
            href="/assets/css/preview-tw.css"
          />
        }
      >
        <IframeInnerComponent>{children}</IframeInnerComponent>
      </Frame>
    </Flex>
  )
}

const IframeInnerComponent = ({ children }: PropsWithChildren) => {
  const { document: iframeDocument } = useFrame()

  // !! This effect might break usages of scroll lock if scroll lock is not triggered by inside the iframe.
  useEffect(() => {
    // Frustratingly, rendering react in an iframe still applies the styles to the parent document instead of the iframe
    // This effect synchronise any changes to the document's styles with the iframe.
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
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    })

    return () => observer.disconnect()
  }, [iframeDocument?.documentElement])

  return children
}
