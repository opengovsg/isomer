import type { NodeViewProps } from "@tiptap/react"
import { Box, Image } from "@chakra-ui/react"
import { NodeViewWrapper } from "@tiptap/react"

import { useEnv } from "~/hooks/useEnv"
import { useGetImageFileFromUrl } from "~/hooks/useGetImageFileFromUrl"

export const ImageView = ({ node }: NodeViewProps) => {
  const {
    env: { NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME },
  } = useEnv()
  const { isSuccess } = useGetImageFileFromUrl(
    node.attrs.src,
    NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME,
  )
  const imageUrl =
    node.attrs.src.startsWith("/") && NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME
      ? `https://${NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME}${node.attrs.src}`
      : node.attrs.src

  const imgSrc = isSuccess ? imageUrl : "/placeholder_no_image.png"

  return (
    <Box as={NodeViewWrapper}>
      <Image src={imgSrc} />
    </Box>
  )
}
