import { Box, useToken } from "@chakra-ui/react"
import Markdown from "react-markdown"
import rehypeExternalLinks from "rehype-external-links"

export const MarkdownLabel = ({ description }: { description?: string }) => {
  const [linkColor, linkHoverColor, linkActiveColor] = useToken("colors", [
    "interaction.links.default",
    "interaction.links.hover",
    "utility.focus-default",
  ])

  return (
    <Box
      sx={{
        "& a": {
          _active: {
            color: linkActiveColor,
            textDecoration: "none",
          },
          _hover: {
            color: linkHoverColor,
            textDecoration: "none",
          },
          color: linkColor,
          textDecoration: "underline",
        },
      }}
    >
      <Markdown rehypePlugins={[[rehypeExternalLinks, { target: "_blank" }]]}>
        {description}
      </Markdown>
    </Box>
  )
}
