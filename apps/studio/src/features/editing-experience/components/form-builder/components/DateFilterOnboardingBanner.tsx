import { Box, Flex, HStack, Icon, Image, Stack, Text } from "@chakra-ui/react"
import { Link } from "@opengovsg/design-system-react"
import NextLink from "next/link"
import { BiRightArrowAlt } from "react-icons/bi"
import { useLocalStorage } from "~/hooks/useLocalStorage"

export const DateFilterOnboardingBanner = (): JSX.Element | null => {
  const [hasSeenOnboardingBanner, setHasSeenOnboardingBanner] = useLocalStorage(
    "date-filter-onboarding-banner-seen",
    false,
  )

  if (hasSeenOnboardingBanner) {
    return null
  }

  return (
    <Flex
      bg="#E5ECF4"
      borderRadius="0.25rem"
      p="1.25rem"
      gap="1.25rem"
      w="full"
      mb="1.25rem"
      align="center"
    >
      <Stack flex={1} spacing="0.5rem">
        <Text textStyle="subhead-2" color="base.content.strong">
          With a date filter, you can automatically label items that are no
          longer relevant.
        </Text>
        <Link
          size="xs"
          variant="standalone"
          isExternal
          externalLinkIcon={<></>}
          p={0}
          as={NextLink}
          // TODO: Update to the date filters support article URL when available.
          href="https://support.isomer.gov.sg"
          color="interaction.links.default"
          onClick={() => setHasSeenOnboardingBanner(true)}
        >
          <HStack as="span" spacing="0.25rem">
            <Text as="span" textStyle="caption-1">
              Learn how to use date filters
            </Text>
            <Icon as={BiRightArrowAlt} fontSize="1rem" />
          </HStack>
        </Link>
      </Stack>
      <Box flex={1}>
        <Image
          src="/assets/onboarding-images/DateFilterBanner.png"
          alt=""
          flex={1}
          w="full"
          h="auto"
        />
      </Box>
    </Flex>
  )
}
