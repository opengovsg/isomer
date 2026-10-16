import { Flex, HStack, Image, Text } from "@chakra-ui/react"
import { IconButton } from "@opengovsg/design-system-react"
import { BiPencil, BiTrash } from "react-icons/bi"

interface AttachmentDataProps {
  data: string
  onClick: () => void
  // When provided, renders a pencil button beside the remove button — the
  // image-adjustment entry point. Omitted for non-adjustable attachments.
  onEdit?: () => void
  // When provided, renders a small thumbnail at the start of the row. Must be a
  // loadable URL (resolve managed "/..." paths via generateAssetUrl first).
  imageSrc?: string
}
export const AttachmentData = ({
  data,
  onClick,
  onEdit,
  imageSrc,
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
      <HStack spacing="0.75rem" minW={0}>
        {imageSrc && (
          <Image
            src={imageSrc}
            alt=""
            boxSize="2.5rem"
            objectFit="cover"
            borderRadius="0.25rem"
            flexShrink={0}
          />
        )}
        <Text overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
          {data.split("/").pop()}
        </Text>
      </HStack>
      <HStack spacing={0} flexShrink={0}>
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
