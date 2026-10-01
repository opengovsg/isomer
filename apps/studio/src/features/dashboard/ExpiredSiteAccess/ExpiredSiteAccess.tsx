import { Skeleton } from "@chakra-ui/react"
import { useMe } from "~/features/me/api"
import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"

import { ExpiredSiteAccessSection } from "./ExpiredSiteAccessSection"

const ExpiredSiteAccessSkeleton = () => {
  return <Skeleton height="1.5rem" width="16rem" marginTop="3rem" />
}

const SuspendableExpiredSiteAccess = () => {
  const [sites] = trpc.site.listExpired.useSuspenseQuery()
  const { me } = useMe()

  return <ExpiredSiteAccessSection sites={sites} loginEmail={me.email} />
}

export const ExpiredSiteAccess = withSuspense(
  SuspendableExpiredSiteAccess,
  <ExpiredSiteAccessSkeleton />,
)
