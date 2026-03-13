import { useState } from "react"
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
import { Link, Searchbar as OgpSearchBar } from "@opengovsg/design-system-react"

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
        <Flex
          key={siteId}
          flexDirection="row"
          border="1.5px solid"
          align="center"
          borderColor="base.divider.medium"
          borderRadius="0.5rem"
          gap="1rem"
          width="100%"
          _groupHover={{
            borderColor: "base.divider.brand",
            backgroundColor: "interaction.muted.main.hover",
          }}
        >
          <Box position="relative" flexShrink={0}>
            <Image
              src={siteLogoUrl}
              alt={siteName}
              width="6rem"
              height="6rem"
              objectFit="contain"
              aspectRatio="1/1"
              fallbackSrc="/isomer-sites-placeholder.png"
              padding="0.5rem" // Leave some space so that logo won't be flush with the border
            />
          </Box>
          <Text
            textStyle="subhead-2"
            noOfLines={3}
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
  onChange = () => {},
}: {
  children: React.ReactNode
  onChange?: (value: string) => void
}): JSX.Element => {
  return (
    <Flex flexDirection="column" gap="2rem">
      <Flex flexDirection="row" gap="1.5rem" marginTop="0.75rem">
        <Text textStyle="body-2">
          These are sites you’ve been added to. If you don't see a site you're
          supposed to have access to, speak to your System Owner for access.
        </Text>
        <OgpSearchBar
          defaultIsExpanded
          onChange={({ target }) => onChange(target.value)}
          width="16rem"
          placeholder={`Search sites by name`}
        />
      </Flex>
      <SimpleGrid columns={2} gap="2rem" width="100%">
        {children}
      </SimpleGrid>
    </Flex>
  )
}

const SuspendableSiteList = (): JSX.Element => {
  const [sites] = trpc.site.list.useSuspenseQuery()
  const [query, setQuery] = useState("")
  const filteredSites = sites.filter((site) =>
    site.config.siteName.toLowerCase().includes(query.toLowerCase()),
  )

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
            If you don't see a site you're supposed to have access to, speak to
            your System Owner for access.
          </Text>
        </Flex>
      </Flex>
    )
  }

  if (filteredSites.length === 0) {
    return (
      <SiteListSection onChange={setQuery}>
        <Flex
          flexDirection="column"
          gap="0.5rem"
          style={{ gridColumn: "1 / -1" }}
          alignItems="center"
          marginTop="6rem"
        >
          <Text textStyle="h5" textAlign="center">
            No sites found for "{query}".
          </Text>
          <Text textStyle="body-2" textAlign="center">
            Try searching for a something else, or check your spelling.
          </Text>
        </Flex>
      </SiteListSection>
    )
  }

  return (
    <SiteListSection onChange={(value) => setQuery(value)}>
      {filteredSites.map((site) => (
        <Site
          siteId={site.id}
          siteName={site.config.siteName}
          siteLogoUrl={generateAssetUrl(site.config.logoUrl)}
        />
      ))}
    </SiteListSection>
  )
}

const SiteListSkeleton = (): JSX.Element => {
  return (
    <SiteListSection>
      {[1, 2].map((index) => (
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
