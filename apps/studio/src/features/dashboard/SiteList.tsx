import NextLink from "next/link"
import {
  Card,
  CardHeader,
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
import { trpc } from "~/utils/trpc"

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
  // TODO: Only return sites that the user has access to
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
        <LinkBox>
          <LinkOverlay href={`/sites/${site.id}`} as={NextLink} />
          <Flex key={site.id} flexDirection="column" gap="1rem" width="100%">
            <Image
              src={site.config.logoUrl}
              alt={site.name}
              borderRadius="0.5rem"
              border="1.5px solid"
              borderColor="base.divider.medium"
              width="100%"
              height="100%"
              objectFit="cover"
              aspectRatio="1/1"
              backgroundColor="white"
              fallbackSrc="/isomer-sites-placeholder.png"
            />
            <Text
              as="h6"
              textStyle="h6"
              noOfLines={1}
              overflow="hidden"
              textOverflow="ellipsis"
            >
              {site.name}
            </Text>
          </Flex>
        </LinkBox>
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
            <CardHeader>Loading...</CardHeader>
          </Skeleton>
        </Card>
      ))}
    </SiteListSection>
  )
}

export const SiteList = withSuspense(SuspendableSiteList, <SiteListSkeleton />)
