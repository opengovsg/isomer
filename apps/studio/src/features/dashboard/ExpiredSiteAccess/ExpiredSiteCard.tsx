import { Box, Flex, Image, Text } from "@chakra-ui/react"
import { Badge, BadgeLeftIcon, Button } from "@opengovsg/design-system-react"
import { BiLockAlt } from "react-icons/bi"

export const ExpiredSiteCard = ({
  siteName,
  siteLogoUrl,
  onSelect,
}: {
  siteName: string
  siteLogoUrl: string
  onSelect: () => void
}) => {
  return (
    <Box role="group" width="100%">
      <Box
        as="button"
        type="button"
        width="100%"
        cursor="pointer"
        textAlign="left"
        aria-label={`Get access back to ${siteName}`}
        onClick={onSelect}
      >
        <Flex flexDirection="column" gap="1rem" width="100%">
          <Box position="relative">
            <Image
              src={siteLogoUrl}
              alt=""
              borderRadius="0.5rem"
              border="1.5px solid"
              borderColor="base.divider.medium"
              width="100%"
              height="100%"
              objectFit="contain"
              aspectRatio="1/1"
              backgroundColor="white"
              fallbackSrc="/isomer-sites-placeholder.png"
              padding="1rem"
              transition="border-color 0.2s"
              _groupHover={{ borderColor: "interaction.main.default" }}
            />
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              backgroundColor="base.canvas.overlay"
              borderRadius="0.5rem"
              display="flex"
              justifyContent="center"
              alignItems="center"
              opacity="0"
              transition="opacity 0.2s"
              _groupHover={{ opacity: 1 }}
            >
              <Button backgroundColor="interaction.main.default" size="sm">
                <Text textStyle="subhead-1" color="base.content.inverse">
                  Get access back
                </Text>
              </Button>
            </Box>
          </Box>
          <Flex flexDirection="column" gap="0.5rem" alignItems="flex-start">
            <Text
              textStyle="subhead-2"
              noOfLines={2}
              overflow="hidden"
              textOverflow="ellipsis"
              width="100%"
            >
              {siteName}
            </Text>
            <Badge variant="subtle" size="xs" colorScheme="neutral">
              <BadgeLeftIcon fontSize="0.75rem" as={BiLockAlt} />
              <Text textStyle="legal">Access expired</Text>
            </Badge>
            <Text textStyle="body-2" color="base.content.medium">
              Inactive for &gt;90 days
            </Text>
          </Flex>
        </Flex>
      </Box>
    </Box>
  )
}
