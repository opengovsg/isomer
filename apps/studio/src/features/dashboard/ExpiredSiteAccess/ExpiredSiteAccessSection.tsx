import { Flex, SimpleGrid, Text } from "@chakra-ui/react"
import { Infobox } from "@opengovsg/design-system-react"
import { useState } from "react"
import { generateAssetUrl } from "~/utils/generateAssetUrl"

import {
  ExpiredSiteAccessModal,
  type ExpiredSite,
} from "./ExpiredSiteAccessModal"
import { ExpiredSiteCard } from "./ExpiredSiteCard"

export const ExpiredSiteAccessSection = ({
  sites,
  loginEmail,
}: {
  sites: ExpiredSite[]
  loginEmail: string
}) => {
  const [selectedSite, setSelectedSite] = useState<ExpiredSite | null>(null)

  if (sites.length === 0) {
    return null
  }

  return (
    <Flex flexDirection="column" marginTop="3rem">
      <Text as="h3" size="lg" textStyle="h3">
        Sites you had access to
      </Text>
      <Infobox variant="info" size="sm" marginTop="0.75rem">
        Your access to{" "}
        {sites.length === 1 ? "this site" : `all ${sites.length} sites`} has
        expired because you haven&apos;t logged in for 90 days. Select a site to
        see who can add you back.
      </Infobox>
      <SimpleGrid columns={3} gap="2.5rem" width="100%" marginTop="1.5rem">
        {sites.map((site) => (
          <ExpiredSiteCard
            key={site.id}
            siteName={site.config.siteName}
            siteLogoUrl={generateAssetUrl(
              site.config.logoUrl ?? "/assets/isomer-logo-color.svg",
            )}
            onSelect={() => setSelectedSite(site)}
          />
        ))}
      </SimpleGrid>
      <ExpiredSiteAccessModal
        site={selectedSite}
        loginEmail={loginEmail}
        onClose={() => setSelectedSite(null)}
      />
    </Flex>
  )
}
