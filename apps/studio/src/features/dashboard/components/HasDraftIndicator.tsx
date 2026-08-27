import { Text } from "@chakra-ui/react"
import { Badge, BadgeLeftIcon } from "@opengovsg/design-system-react"
import { BiSolidCircle } from "react-icons/bi"

interface HasDraftIndicatorProps {
  draftBlobId: string | null
}

export const HasDraftIndicator = ({
  draftBlobId,
}: HasDraftIndicatorProps): JSX.Element | null => {
  if (!draftBlobId) {
    return null
  }

  return (
    <Badge size="xs" variant="clear" colorScheme="warning">
      <BadgeLeftIcon fontSize="0.5rem" as={BiSolidCircle} />
      <Text textStyle="legal">Has draft</Text>
    </Badge>
  )
}
