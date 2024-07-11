import NextLink from "next/link"
import { Card, CardHeader, SimpleGrid, Skeleton } from "@chakra-ui/react"
import { Link } from "@opengovsg/design-system-react"

import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"

const SuspendableSiteList = (): JSX.Element => {
  // TODO: Only return sites that the user has access to
  const [sites] = trpc.site.list.useSuspenseQuery()
  return (
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
