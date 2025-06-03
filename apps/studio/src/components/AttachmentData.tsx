import { Flex, IconButton, Text } from "@chakra-ui/react"
import { BiTrash } from "react-icons/bi"

interface AttachmentDataProps {
  data: string
  onClick: () => void
}
export const AttachmentData = ({ data, onClick }: AttachmentDataProps) => {
  return (
    <Flex
      px="1rem"
      py="0.75rem"
      flexDir="row"
      background="brand.primary.100"
      justifyContent="space-between"
      alignItems="center"
    >
      <Text overflow="auto">{data.split("/").pop()}</Text>
      <IconButton
        size="xs"
        variant="clear"
        colorScheme="critical"
        aria-label="Remove file"
        icon={<BiTrash />}
        onClick={onClick}
      />
    </Flex>
  )
}
