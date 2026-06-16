import type { NextPageWithLayout } from "~/lib/types"
import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { BiShareAlt } from "react-icons/bi"
import { z } from "zod"
import { PermissionsBoundary } from "~/components/AuthWrappers"
import { SitePreviewLinksTable } from "~/features/previewLink/components/SitePreviewLinksTable"
import { useQueryParse } from "~/hooks/useQueryParse"
import { SiteBasicLayout } from "~/templates/layouts/SiteBasicLayout"
import { ResourceType } from "~prisma/generated/generatedEnums"

const sitePreviewLinksSchema = z.object({
  siteId: z.coerce.number(),
})

const SitePreviewLinksPage: NextPageWithLayout = () => {
  const { siteId } = useQueryParse(sitePreviewLinksSchema)

  return (
    <VStack
      w="100%"
      p="1.75rem"
      gap="1rem"
      height="0"
      overflow="auto"
      minH="100%"
      alignItems="start"
    >
      <VStack w="100%" align="start" spacing="0.25rem">
        <HStack mr="1.25rem" gap="0.75rem">
          <Box
            aria-hidden
            bg="brand.secondary.100"
            p="0.5rem"
            borderRadius="6px"
          >
            <BiShareAlt />
          </Box>
          <Text as="h3" textStyle="h3">
            Preview links
          </Text>
        </HStack>
        <Text color="base.content.medium" fontSize="sm">
          Short-lived URLs shared for review. Editors see their own; Site Admins
          see all.
        </Text>
      </VStack>

      <SitePreviewLinksTable siteId={siteId} />
    </VStack>
  )
}

SitePreviewLinksPage.getLayout = (page: React.ReactNode) => (
  <PermissionsBoundary
    resourceType={ResourceType.RootPage}
    page={SiteBasicLayout(page)}
  />
)

export default SitePreviewLinksPage
