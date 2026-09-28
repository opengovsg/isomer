import {
  Box,
  Flex,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Skeleton,
  Text,
} from "@chakra-ui/react"
import { Button, Link, useToast } from "@opengovsg/design-system-react"
import { useState } from "react"
import { ISOMER_SUPPORT_LINK } from "~/constants/misc"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { withSuspense } from "~/hocs/withSuspense"
import { generateAssetUrl } from "~/utils/generateAssetUrl"
import { type RouterOutput, trpc } from "~/utils/trpc"

const DEFAULT_ASSET_LOGO = "/assets/isomer-logo-color.svg"

type ExpiredSite = RouterOutput["site"]["listExpired"][number]

const ExpiredSiteCard = ({
  siteName,
  siteLogoUrl,
  onSelect,
}: {
  siteName: string
  siteLogoUrl: string
  onSelect: () => void
}) => {
  return (
    <Box role="group" width="100%">
      <Box
        as="button"
        type="button"
        width="100%"
        cursor="pointer"
        textAlign="left"
        aria-label={`Request access to ${siteName}`}
        onClick={onSelect}
      >
        <Flex flexDirection="column" gap="1rem" width="100%">
          <Box position="relative">
            <Image
              src={siteLogoUrl}
              alt=""
              borderRadius="0.5rem"
              border="1.5px solid"
              borderColor="base.divider.medium"
              width="100%"
              height="100%"
              objectFit="contain"
              aspectRatio="1/1"
              backgroundColor="white"
              fallbackSrc="/isomer-sites-placeholder.png"
              padding="1rem"
            />
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              backgroundColor="base.canvas.overlay"
              borderRadius="0.5rem"
              display="flex"
              justifyContent="center"
              alignItems="center"
              opacity="0"
              transition="opacity 0.2s"
              _groupHover={{ opacity: 1 }}
            >
              <Text
                textStyle="subhead-1"
                color="base.content.inverse"
                backgroundColor="interaction.main.default"
                px="1rem"
                py="0.5rem"
                borderRadius="0.25rem"
              >
                Request access
              </Text>
            </Box>
          </Box>
          <Text
            textStyle="subhead-2"
            noOfLines={2}
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {siteName}
          </Text>
        </Flex>
      </Box>
    </Box>
  )
}

const ExpiredSiteAccessModal = ({
  site,
  onClose,
}: {
  site: ExpiredSite | null
  onClose: () => void
}) => {
  const toast = useToast()

  const onCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email)
      toast({
        status: "success",
        title: "Email copied",
        ...BRIEF_TOAST_SETTINGS,
      })
    } catch {
      toast({
        status: "error",
        title: "Could not copy email",
        ...BRIEF_TOAST_SETTINGS,
      })
    }
  }

  return (
    <Modal isOpen={!!site} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">
          Request access to {site?.config.siteName}
        </ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody pb="1.5rem">
          {site && site.adminEmails.length > 0 ? (
            <Flex flexDirection="column" gap="1rem">
              <Text textStyle="body-1">
                Your access expired. Contact a site admin to be added back.
              </Text>
              {site.adminEmails.map((email) => (
                <Flex
                  key={email}
                  alignItems="center"
                  justifyContent="space-between"
                  gap="1rem"
                >
                  <Text textStyle="body-2" wordBreak="break-all">
                    {email}
                  </Text>
                  <Button
                    variant="outline"
                    size="sm"
                    flexShrink={0}
                    onClick={() => {
                      void onCopyEmail(email)
                    }}
                  >
                    Copy email
                  </Button>
                </Flex>
              ))}
            </Flex>
          ) : (
            <Text textStyle="body-1">
              There are no site admins for this site. Contact{" "}
              <Link variant="inline" href={ISOMER_SUPPORT_LINK}>
                Isomer Support
              </Link>
              .
            </Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

const ExpiredSiteAccessContent = () => {
  const [sites] = trpc.site.listExpired.useSuspenseQuery()
  const [selectedSite, setSelectedSite] = useState<ExpiredSite | null>(null)

  if (sites.length === 0) {
    return null
  }

  return (
    <Flex flexDirection="column" marginTop="3rem">
      <Text as="h3" size="lg" textStyle="h3">
        Sites you had access to
      </Text>
      <Text textStyle="body-2" marginTop="0.75rem">
        Your access to these sites expired. Ask a site admin to add you back.
      </Text>
      <SimpleGrid columns={3} gap="2.5rem" width="100%" marginTop="1.5rem">
        {sites.map((site) => (
          <ExpiredSiteCard
            key={site.id}
            siteName={site.config.siteName}
            siteLogoUrl={generateAssetUrl(
              site.config.logoUrl ?? DEFAULT_ASSET_LOGO,
            )}
            onSelect={() => setSelectedSite(site)}
          />
        ))}
      </SimpleGrid>
      <ExpiredSiteAccessModal
        site={selectedSite}
        onClose={() => setSelectedSite(null)}
      />
    </Flex>
  )
}

const ExpiredSiteAccessSkeleton = () => {
  return <Skeleton height="1.5rem" width="16rem" marginTop="3rem" />
}

export const ExpiredSiteAccess = withSuspense(
  ExpiredSiteAccessContent,
  <ExpiredSiteAccessSkeleton />,
)
