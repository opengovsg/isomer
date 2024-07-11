import NextLink from "next/link"
import { Card, CardHeader, SimpleGrid } from "@chakra-ui/react"
import { Link } from "@opengovsg/design-system-react"

import { trpc } from "~/utils/trpc"

export const SiteList = (): JSX.Element => {
  // TODO: Only return sites that the user has access to
  const [sites] = trpc.site.list.useSuspenseQuery()
  return (
    <SimpleGrid columns={3}>
      {sites.map((site) => (
        <Card key={site.id}>
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
