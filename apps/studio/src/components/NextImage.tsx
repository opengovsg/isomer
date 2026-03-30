import { chakra } from "@chakra-ui/react"
import Image from "next/image"

/**
 * Use NextJS Image component with chakra-ui
 * Need to forward the props NextJS Image expects to the Image component instead of
 * chakra's props.
 */
export const NextImage = chakra(Image, {
  shouldForwardProp: (prop) =>
    ["height", "width", "quality", "src", "alt"].includes(prop),
})
