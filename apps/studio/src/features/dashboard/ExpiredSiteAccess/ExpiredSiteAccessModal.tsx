import {
  Flex,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { useState } from "react"
import { BiCopy, BiEnvelopeOpen } from "react-icons/bi"
import { useTimeout } from "usehooks-ts"
import { type RouterOutput } from "~/utils/trpc"

import {
  buildExpiredSiteSupportMailto,
  formatAdminDisplayName,
  getAdminInitials,
} from "./utils"

export type ExpiredSite = RouterOutput["site"]["listExpired"][number]

const COPY_FEEDBACK_MS = 3000

const AdminInitialsBadge = ({ email }: { email: string }) => (
  <Flex
    aria-hidden
    alignItems="center"
    justifyContent="center"
    flexShrink={0}
    width="2rem"
    height="2rem"
    borderRadius="full"
    backgroundColor="base.canvas.brand-subtle"
    color="interaction.main.default"
    textStyle="caption-1"
    fontWeight="semibold"
    lineHeight="1"
  >
    {getAdminInitials(email)}
  </Flex>
)

const CopyEmailButton = ({ email }: { email: string }) => {
  const [isCopied, setIsCopied] = useState(false)

  useTimeout(() => setIsCopied(false), isCopied ? COPY_FEEDBACK_MS : null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setIsCopied(true)
    } catch {
      setIsCopied(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      flexShrink={0}
      leftIcon={<Icon as={BiCopy} fontSize="1rem" />}
      onClick={() => {
        void handleCopy()
      }}
    >
      {isCopied ? "Copied" : "Copy email"}
    </Button>
  )
}

export const ExpiredSiteAccessModal = ({
  site,
  loginEmail,
  onClose,
}: {
  site: ExpiredSite | null
  loginEmail: string
  onClose: () => void
}) => {
  if (!site) {
    return null
  }

  const siteName = site.config.siteName
  const hasAdmins = site.adminEmails.length > 0

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">
          {hasAdmins
            ? `Get access back to ${siteName}`
            : "Contact Isomer support to get access back"}
        </ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody pb={hasAdmins ? "1rem" : "0.5rem"}>
          {hasAdmins ? (
            <Flex flexDirection="column" gap="1.25rem">
              <Text textStyle="body-1">
                Your access to {siteName} expired because you haven&apos;t
                logged in for 90 days. Contact a site admin to be added back.
              </Text>
              <Text textStyle="subhead-1">
                Site admins for {siteName} ({site.adminEmails.length})
              </Text>
              <Flex flexDirection="column" gap="0.75rem">
                {site.adminEmails.map((email) => (
                  <Flex
                    key={email}
                    alignItems="center"
                    justifyContent="space-between"
                    gap="1rem"
                    border="1px solid"
                    borderColor="base.divider.medium"
                    borderRadius="0.5rem"
                    padding="0.75rem 1rem"
                  >
                    <HStack spacing="0.75rem" minWidth={0}>
                      <AdminInitialsBadge email={email} />
                      <Flex flexDirection="column" minWidth={0}>
                        <Text textStyle="subhead-2" noOfLines={1}>
                          {formatAdminDisplayName(email)}
                        </Text>
                        <Text
                          textStyle="body-2"
                          color="base.content.medium"
                          wordBreak="break-all"
                        >
                          {email}
                        </Text>
                      </Flex>
                    </HStack>
                    <CopyEmailButton email={email} />
                  </Flex>
                ))}
              </Flex>
              <Text textStyle="body-2" color="base.content.medium">
                When you contact them, share the email you log in with:{" "}
                <Text
                  as="span"
                  textStyle="subhead-2"
                  color="base.content.default"
                >
                  {loginEmail}
                </Text>
              </Text>
            </Flex>
          ) : (
            <Flex flexDirection="column" gap="1rem">
              <Text textStyle="body-1">
                Your access to {siteName} expired because you haven&apos;t
                logged in for 90 days. This site has no active site admins who
                can add you back, so the Isomer team will help you instead.
              </Text>
              <Text textStyle="body-1">
                Include the site name and the email you log in with (
                {loginEmail}) in your message.
              </Text>
            </Flex>
          )}
        </ModalBody>
        <ModalFooter gap="0.75rem">
          {hasAdmins ? (
            <Button onClick={onClose}>Done</Button>
          ) : (
            <>
              <Button variant="clear" onClick={onClose}>
                Close
              </Button>
              <Button
                as="a"
                href={buildExpiredSiteSupportMailto({
                  siteName: site.config.siteName,
                  loginEmail,
                })}
                leftIcon={<Icon as={BiEnvelopeOpen} fontSize="1rem" />}
              >
                Contact Isomer support
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
