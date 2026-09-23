import { Box, Flex, HStack, Icon, Stack, Text } from "@chakra-ui/react"
import { Link } from "@opengovsg/design-system-react"
import NextLink from "next/link"
import { BiRightArrowAlt } from "react-icons/bi"
import { NextImage } from "~/components/NextImage"
import { useLocalStorage } from "~/hooks/useLocalStorage"
import { captureDateFilterOnboardingBannerSupportLinkClicked } from "~/lib/analytics/dateFilters"

interface DateFilterOnboardingBannerProps {
  siteId: number
}

export const DateFilterOnboardingBanner = ({
  siteId,
}: DateFilterOnboardingBannerProps): JSX.Element | null => {
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
          href="https://support.isomer.gov.sg/en/articles/15461505-how-to-manage-collection-filters"
          color="interaction.links.default"
          onClick={() => {
            setHasSeenOnboardingBanner(true)
            captureDateFilterOnboardingBannerSupportLinkClicked({ siteId })
          }}
        >
          <HStack as="span" spacing="0.25rem">
            <Text as="span" textStyle="caption-1">
              Learn how to use date filters
            </Text>
            <Icon as={BiRightArrowAlt} fontSize="1rem" />
          </HStack>
        </Link>
      </Stack>
      <Box flex={1} minW={0}>
        <NextImage
          src="/assets/onboarding-images/DateFilterBanner.png"
          alt=""
          width={640}
          height={360}
          w="full"
          h="auto"
          borderRadius="4px"
          boxShadow="0 0 10px 0 rgba(191, 191, 191, 0.50)"
        />
      </Box>
    </Flex>
  )
}
