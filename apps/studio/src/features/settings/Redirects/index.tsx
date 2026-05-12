import { Stack, Text } from "@chakra-ui/react"

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
    <RedirectsHeader siteId={siteId} />

    <Stack spacing="1.25rem">
      <AddRedirectCard siteId={siteId} />

      <Stack spacing="1.25rem">
        <Stack spacing="0.5rem">
          <Text textStyle="h6">Redirects</Text>
          <Text textStyle="body-2" color="base.content.medium">
            Any changes made to this table will take effect when you publish.
          </Text>
        </Stack>

        <RedirectsTable siteId={siteId} />
      </Stack>
    </Stack>
  </Stack>
)
