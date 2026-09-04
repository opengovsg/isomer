import { Box, Text, Tooltip } from "@chakra-ui/react"
import { Badge, BadgeLeftIcon } from "@opengovsg/design-system-react"
import { BiSolidCircle } from "react-icons/bi"

interface DraftIndicatorProps {
  draftBlobId: string | null
}

export const DraftIndicator = ({
  draftBlobId,
}: DraftIndicatorProps): JSX.Element | null => {
  if (!draftBlobId) {
    return null
  }

  return (
    <Tooltip label="There are unpublished changes." placement="bottom" hasArrow>
      {/* Badge (design-system-react) doesn't forward its ref, so Tooltip
      can't measure it for positioning without this wrapper — without it the
      tooltip renders pinned to the viewport's top-left. */}
      <Box as="span" display="inline-block">
        <Badge size="xs" variant="clear" colorScheme="warning">
          <BadgeLeftIcon fontSize="0.5rem" as={BiSolidCircle} />
          <Text textStyle="legal">Has draft</Text>
        </Badge>
      </Box>
    </Tooltip>
  )
}
