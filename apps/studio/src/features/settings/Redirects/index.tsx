import { Skeleton, Stack } from "@chakra-ui/react"
import { Infobox } from "@opengovsg/design-system-react"

import { AddRedirectCard } from "./components/AddRedirectCard"
import { RedirectsHeader } from "./components/RedirectsHeader"
import { RedirectsTable } from "./components/RedirectsTable"
import {
  RedirectManagementProvider,
  useRedirectManagement,
} from "./RedirectManagementContext"

interface RedirectsSettingsProps {
  siteId: number
}

// Roughly the height of the add-redirect card, so the table doesn't jump when
// the roles land and the real card takes its place.
const ADD_CARD_SKELETON_HEIGHT = "13rem"

// The add-redirect card only appears once we know the user may use it. Until
// then the answer is unknown, not "no" — showing the read-only page straight
// away would tell an admin they lack access and then contradict itself.
const AddRedirectSection = ({
  siteId,
}: RedirectsSettingsProps): JSX.Element => {
  const { canManageRedirects, isPending, isError } = useRedirectManagement()

  if (isPending) {
    return <Skeleton height={ADD_CARD_SKELETON_HEIGHT} borderRadius="0.5rem" />
  }

  if (isError) {
    return (
      <Infobox variant="warning" size="sm">
        We couldn't check your permissions, so adding and removing redirects is
        unavailable. Refresh the page to try again.
      </Infobox>
    )
  }

  return canManageRedirects ? <AddRedirectCard siteId={siteId} /> : <></>
}

const RedirectsSettingsContent = ({
  siteId,
}: RedirectsSettingsProps): JSX.Element => (
  <Stack spacing="1.5rem" px="2rem" py="1.5rem" w="full">
    <RedirectsHeader />

    <Stack spacing="1.25rem">
      <AddRedirectSection siteId={siteId} />

      <RedirectsTable siteId={siteId} />
    </Stack>
  </Stack>
)

export const RedirectsSettings = ({
  siteId,
}: RedirectsSettingsProps): JSX.Element => (
  <RedirectManagementProvider siteId={siteId}>
    <RedirectsSettingsContent siteId={siteId} />
  </RedirectManagementProvider>
)
