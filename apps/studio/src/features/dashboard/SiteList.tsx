import NextLink from "next/link"
import {
  Card,
  CardHeader,
  Flex,
  SimpleGrid,
  Skeleton,
  Text,
} from "@chakra-ui/react"
import { Link } from "@opengovsg/design-system-react"

import { NoResultIcon } from "~/components/Svg/NoResultIcon"
import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"

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
    <Flex flexDirection="column" gap="1.5rem" marginTop="0.75rem">
      <Text textStyle="body-2">
        Don't see a site that you're supposed to have access to?{" "}
        <Link variant="inline" href="mailto:support@isomer.gov.sg">
          Let us know
        </Link>
        .
      </Text>
      <Flex flexDirection="column" gap="2rem">
        <SimpleGrid columns={3} gap="2.5rem" width="100%">
          {sites.map((site) => (
            <Card key={site.id} width="100%">
              <CardHeader>
                <Link href={`/sites/${site.id}`} as={NextLink}>
                  {site.name}
                </Link>
              </CardHeader>
            </Card>
          ))}
        </SimpleGrid>
      </Flex>
    </Flex>
  )
}

const SiteListSkeleton = (): JSX.Element => {
  return (
    <SimpleGrid columns={3} gap="2.5rem">
      {[1, 2, 3].map((index) => (
        <Card key={index} width="100%">
          <Skeleton>
            <CardHeader>Loading...</CardHeader>
          </Skeleton>
        </Card>
      ))}
    </SimpleGrid>
  )
}

export const SiteList = withSuspense(SuspendableSiteList, <SiteListSkeleton />)
