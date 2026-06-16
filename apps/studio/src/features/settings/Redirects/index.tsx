import { Stack } from "@chakra-ui/react"

import { AddRedirectCard } from "./components/AddRedirectCard"
import { RedirectsHeader } from "./components/RedirectsHeader"
import { RedirectsTable } from "./components/RedirectsTable"

interface RedirectsSettingsProps {
  siteId: number
}

export const RedirectsSettings = ({
  siteId,
}: RedirectsSettingsProps): JSX.Element => (
  <Stack spacing="1.5rem" px="2rem" py="1.5rem" w="full">
    <RedirectsHeader />

    <Stack spacing="1.25rem">
      <AddRedirectCard siteId={siteId} />

      <RedirectsTable siteId={siteId} />
    </Stack>
  </Stack>
)
