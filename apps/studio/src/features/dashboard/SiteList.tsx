import NextLink from "next/link"
import {
  Box,
  Button,
  Card,
  Flex,
  Image,
  LinkBox,
  LinkOverlay,
  SimpleGrid,
  Skeleton,
  Text,
} from "@chakra-ui/react"
import { Link } from "@opengovsg/design-system-react"

import { NoResultIcon } from "~/components/Svg/NoResultIcon"
import { withSuspense } from "~/hocs/withSuspense"
import { generateAssetUrl } from "~/utils/generateAssetUrl"
import { trpc } from "~/utils/trpc"

const Site = ({
  siteId,
  siteName,
  siteLogoUrl,
}: {
  siteId?: number
  siteName?: string
  siteLogoUrl?: string
}): JSX.Element => {
  return (
    <LinkBox cursor="pointer" role="group">
      <LinkOverlay href={`/sites/${siteId}`} as={NextLink}>
        <Flex key={siteId} flexDirection="column" gap="1rem" width="100%">
          <Box position="relative">
            <Image
              src={siteLogoUrl}
              alt={siteName}
              borderRadius="0.5rem"
              border="1.5px solid"
              borderColor="base.divider.medium"
              width="100%"
              height="100%"
              objectFit="contain"
              aspectRatio="1/1"
              backgroundColor="white"
              fallbackSrc="/isomer-sites-placeholder.png"
              padding="1rem" // Leave some space so that logo won't be flush with the border
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
              <Button backgroundColor="interaction.main.default">
                <Text textStyle="subhead-1">Start editing site</Text>
              </Button>
            </Box>
          </Box>
          <Text
            textStyle="subhead-2"
            noOfLines={2}
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {siteName}
          </Text>
        </Flex>
      </LinkOverlay>
    </LinkBox>
  )
}

const SiteListSection = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => {
  return (
    <Flex flexDirection="column" gap="1.5rem" marginTop="0.75rem">
      <Text textStyle="body-2">
        Don't see a site that you're supposed to have access to?{" "}
        <Link variant="inline" href="mailto:support@isomer.gov.sg">
          Let us know
        </Link>
        .
      </Text>
      <SimpleGrid columns={3} gap="2.5rem" width="100%">
        {children}
      </SimpleGrid>
    </Flex>
  )
}

const SuspendableSiteList = (): JSX.Element => {
  const [sites] = trpc.site.list.useSuspenseQuery()

  if (sites.length === 0) {
    return (
      <Flex
        flexDirection="column"
        gap="1.5rem"
        alignItems="center"
        marginTop="6rem"
      >
        <NoResultIcon />
        <Flex flexDirection="column" gap="0.5rem" alignItems="center">
          <Text textStyle="h5" textAlign="center">
            You don't have access to any sites yet.
          </Text>
          <Text textStyle="body-2" textAlign="center">
            Speak to your System Owner to get access.<br></br>
            If you think there is an error,{" "}
            <Link variant="inline" href="mailto:support@isomer.gov.sg">
              let us know
            </Link>
            .
          </Text>
        </Flex>
      </Flex>
    )
  }

  return (
    <SiteListSection>
      {sites.map((site) => (
        <Site
          siteId={site.id}
          siteName={site.name}
          siteLogoUrl={generateAssetUrl(site.config.logoUrl)}
        />
      ))}
    </SiteListSection>
  )
}

const SiteListSkeleton = (): JSX.Element => {
  return (
    <SiteListSection>
      {[1, 2, 3].map((index) => (
        <Card key={index} width="100%">
          <Skeleton>
            <Site />
          </Skeleton>
        </Card>
      ))}
    </SiteListSection>
  )
}

export const SiteList = withSuspense(SuspendableSiteList, <SiteListSkeleton />)
