import { HStack, Icon, Text } from "@chakra-ui/react"
import { Link } from "@opengovsg/design-system-react"
import { BiLinkExternal } from "react-icons/bi"

interface FileIdCellProps {
  fileId: string
  fileUrl: string | null
}

export const FileIdCell = ({
  fileId,
  fileUrl,
}: FileIdCellProps): JSX.Element => {
  if (fileUrl) {
    return (
      <HStack spacing="0.25rem" align="center">
        <Link
          href={fileUrl}
          isExternal
          textStyle="body-2"
          color="interaction.links.default"
          textDecoration="underline"
          noOfLines={1}
          p="0"
        >
          {fileId}
        </Link>
        <Icon
          as={BiLinkExternal}
          boxSize="1rem"
          color="interaction.links.default"
        />
      </HStack>
    )
  }

  return (
    <Text textStyle="body-2" color="base.content.strong" noOfLines={1}>
      {fileId}
    </Text>
  )
}
