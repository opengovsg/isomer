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
          color: linkColor,
          textDecoration: "underline",
          _hover: {
            color: linkHoverColor,
            textDecoration: "none",
          },
          _active: {
            color: linkActiveColor,
            textDecoration: "none",
          },
        },
      }}
    >
      <Markdown rehypePlugins={[[rehypeExternalLinks, { target: "_blank" }]]}>
        {description}
      </Markdown>
    </Box>
  )
}
