import { Box, useToken } from "@chakra-ui/react"
import Markdown from "react-markdown"

export const MarkdownLabel = ({ description }: { description?: string }) => {
  const [linkColor, linkHoverColor, linkActiveColor] = useToken("colors", [
    "interaction.links.default",
    "interaction.links.hover",
    "utility.focus-default",
  ])
  console.log(description)

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
      <Markdown>{description}</Markdown>
    </Box>
  )
}
