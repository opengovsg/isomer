import { Stack } from "@chakra-ui/react"
import { useContext } from "react"
import { UserManagementContext } from "~/features/users"

import { AddRedirectCard } from "./components/AddRedirectCard"
import { RedirectsHeader } from "./components/RedirectsHeader"
import { RedirectsTable } from "./components/RedirectsTable"

interface RedirectsSettingsProps {
  siteId: number
}

export const RedirectsSettings = ({
  siteId,
}: RedirectsSettingsProps): JSX.Element => {
  // Adding and removing redirects are site-wide actions the server grants only
  // to site admins (`create`/`delete` on Site). Mirror that here off the same
  // admin ability the sidenav uses, so a non-admin never gets inputs, a .csv
  // template, or a delete button whose submit can only come back FORBIDDEN.
  // Read-only access still sees the table.
  const ability = useContext(UserManagementContext)
  const canManageRedirects = ability.can("manage", "UserManagement")

  return (
    <Stack spacing="1.5rem" px="2rem" py="1.5rem" w="full">
      <RedirectsHeader />

      <Stack spacing="1.25rem">
        {canManageRedirects && <AddRedirectCard siteId={siteId} />}

        <RedirectsTable siteId={siteId} />
      </Stack>
    </Stack>
  )
}
