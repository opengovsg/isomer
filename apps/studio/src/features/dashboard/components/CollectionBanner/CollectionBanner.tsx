import { Icon, Stack, Text } from "@chakra-ui/react"
import { IconButton, Link } from "@opengovsg/design-system-react"
import NextLink from "next/link"
import { BiRightArrowAlt, BiX } from "react-icons/bi"
import { useLocalStorage } from "~/hooks/useLocalStorage"

import { BannerSvgr } from "./BannerSvgr"

export const CollectionBanner = (): JSX.Element | null => {
  const [isBannerDismissed, setIsBannerDismissed] = useLocalStorage(
    "collection-banner-dismissed",
    false,
  )

  if (isBannerDismissed) {
    return null
  }

  return (
    <Stack
      width="100%"
      justify="space-between"
      flexDir="row"
      bg="interaction.success-subtle.default"
      pos="relative"
    >
      <IconButton
        size="xs"
        aria-label="Dismiss banner"
        variant="clear"
        colorScheme="sub"
        icon={<BiX />}
        pos="absolute"
        right="0.75rem"
        top="0.5rem"
        onClick={() => setIsBannerDismissed(true)}
      />
      <Stack p="1.5rem" justify="space-between">
        <Stack gap="0.75rem" flexDir="column">
          <Text as="h4" textStyle="h4" color="green.700">
            This is a collection
          </Text>
          <Text textStyle="body-2">
            Collections help you create and manage database of pages and files.
            Collections are perfect for your press releases, speeches, and
            publications.
          </Text>
          <Link
            size="xs"
            variant="standalone"
            isExternal
            externalLinkIcon={<></>}
            p={0}
            as={NextLink}
            href="https://support.isomer.gov.sg/en/articles/11693839-introducing-collections"
          >
            Learn about collections on the Isomer Guide{" "}
            <Icon as={BiRightArrowAlt} fontSize="1rem" />
          </Link>
        </Stack>
      </Stack>
      <BannerSvgr display={{ base: "none", md: "block" }} mr="4rem" />
    </Stack>
  )
}
