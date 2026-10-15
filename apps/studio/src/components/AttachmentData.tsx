import { Flex, HStack, Text } from "@chakra-ui/react"
import { IconButton } from "@opengovsg/design-system-react"
import { BiPencil, BiTrash } from "react-icons/bi"

interface AttachmentDataProps {
  data: string
  onClick: () => void
  // When provided, renders a pencil button beside the remove button — the
  // image-adjustment entry point. Omitted for non-adjustable attachments.
  onEdit?: () => void
}
export const AttachmentData = ({
  data,
  onClick,
  onEdit,
}: AttachmentDataProps) => {
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
      <HStack spacing={0}>
        {onEdit && (
          <IconButton
            size="xs"
            variant="clear"
            colorScheme="neutral"
            aria-label="Edit image"
            icon={<BiPencil />}
            onClick={onEdit}
          />
        )}
        <IconButton
          size="xs"
          variant="clear"
          colorScheme="critical"
          aria-label="Remove file"
          icon={<BiTrash />}
          onClick={onClick}
        />
      </HStack>
    </Flex>
  )
}
