import { Box, Flex, Text } from "@chakra-ui/react"

interface PreviewChromeProps {
  pageTitle: string
  expiresAt: string
}

const SGT_TIMEZONE = "Asia/Singapore"

const formatSgtExpiry = (isoString: string): string => {
  const formatter = new Intl.DateTimeFormat("en-SG", {
    timeZone: SGT_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  return `${formatter.format(new Date(isoString))} SGT`
}

export const PreviewChrome = ({
  pageTitle,
  expiresAt,
}: PreviewChromeProps): JSX.Element => {
  return (
    <Box
      bg="#FFF7E6"
      borderBottomWidth="1px"
      borderColor="#F0B400"
      px="1rem"
      py="0.5rem"
    >
      <Flex align="center" justify="space-between" gap="1rem" flexWrap="wrap">
        <Text fontSize="sm" fontWeight="600" color="#5C4400">
          Isomer Preview: «{pageTitle}»
        </Text>
        <Text fontSize="xs" color="#5C4400">
          Expires {formatSgtExpiry(expiresAt)}
        </Text>
      </Flex>
      <Text fontSize="xs" color="#5C4400" mt="0.25rem">
        Confidential — please do not forward this link.
      </Text>
    </Box>
  )
}
