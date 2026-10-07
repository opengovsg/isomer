import type { GetServerSideProps } from "next"
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import {
  ModalCloseButton,
  Textarea,
  useToast,
} from "@opengovsg/design-system-react"
import NextLink from "next/link"
import { useState } from "react"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { requireGodModeAdmin } from "~/features/godmode/serverSideProps"
import { type NextPageWithLayout } from "~/lib/types"
import { AuthenticatedLayout } from "~/templates/layouts/AuthenticatedLayout"
import { trpc } from "~/utils/trpc"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

export const getServerSideProps: GetServerSideProps = (context) =>
  requireGodModeAdmin(context, [IsomerAdminRole.Core])

const GodModeDeleteAssetsPage: NextPageWithLayout = () => {
  const toast = useToast()
  const [urlsText, setUrlsText] = useState("")

  const {
    isOpen: isConfirmModalOpen,
    onOpen: onConfirmModalOpen,
    onClose: onConfirmModalClose,
  } = useDisclosure()

  const parsedUrls = Array.from(
    new Set(
      urlsText
        .split(/\r?\n/)
        .map((url) => url.trim())
        .filter((url) => url.length > 0),
    ),
  )

  const deleteMutation = trpc.asset.deleteAssetsByUrl.useMutation({
    onSuccess: (data) => {
      onConfirmModalClose()
      const failedCount = data.results.filter((r) => !r.success).length
      toast({
        title: `Soft-deleted ${data.results.length - failedCount} of ${
          data.results.length
        } asset(s)`,
        status: failedCount > 0 ? "warning" : "success",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
    onError: (error) => {
      toast({
        title: error.message,
        status: "error",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  return (
    <Flex flexDir="column" py="2rem" maxW="57rem" mx="auto" width="100%">
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" as={NextLink}>
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="/godmode" as={NextLink}>
            👁️ God Mode 👁️
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Text as="h3" size="lg" textStyle="h3">
        Delete assets
      </Text>

      <Box mt={8} bg="white" borderRadius="md" p={4}>
        <Text fontWeight="bold" mb={4}>
          What happens when you delete an asset here?
        </Text>
        <Text>
          Each asset is soft-deleted (tagged, not removed) and immediately
          blocked from public access, regardless of which site it belongs to —
          use this for moderation or PDPA takedown requests. The CDN cache for
          every affected site is also invalidated. Paste one full asset URL per
          line below.
        </Text>
      </Box>

      <Flex flexDir="column" mt={8} bg="white" borderRadius="md" p={4} gap={4}>
        <Textarea
          placeholder="https://isomer-user-content.by.gov.sg/36/uuid/picture.png"
          value={urlsText}
          onChange={(e) => setUrlsText(e.target.value)}
          rows={10}
        />
        <Button
          onClick={onConfirmModalOpen}
          isDisabled={parsedUrls.length === 0}
        >
          Delete {parsedUrls.length} asset(s)
        </Button>
      </Flex>

      {deleteMutation.data && (
        <Box mt={8} bg="white" borderRadius="md" p={4}>
          <Text fontWeight="bold" mb={2}>
            Results
          </Text>
          {deleteMutation.data.results.map((result) => (
            <Text
              key={result.url}
              textStyle="body-2"
              color={result.success ? "green.600" : "red.600"}
            >
              {result.success ? "✅" : "❌"} {result.url}
              {result.error && ` — ${result.error}`}
            </Text>
          ))}
          <Text mt={4} textStyle="body-2">
            CloudFront invalidation:{" "}
            {deleteMutation.data.invalidation.success
              ? `created${
                  deleteMutation.data.invalidation.invalidationId
                    ? ` (${deleteMutation.data.invalidation.invalidationId})`
                    : ""
                }`
              : `failed — ${deleteMutation.data.invalidation.error}`}
          </Text>
        </Box>
      )}

      <Modal isOpen={isConfirmModalOpen} onClose={onConfirmModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader mr="3.5rem">
            Delete {parsedUrls.length} asset(s)?
          </ModalHeader>
          <ModalCloseButton size="lg" />
          <ModalBody>
            <Text textStyle="body-1" mb={4}>
              This will soft-delete the following asset(s), possibly across
              multiple sites, and invalidate their CDN cache. Review the list
              before continuing.
            </Text>
            <Box
              maxH="16rem"
              overflowY="auto"
              bg="base.canvas.brand-subtle"
              p={2}
              borderRadius="md"
            >
              {parsedUrls.map((url) => (
                <Text key={url} textStyle="caption-1" fontFamily="mono">
                  {url}
                </Text>
              ))}
            </Box>
          </ModalBody>
          <ModalFooter>
            <HStack spacing="1rem">
              <Button
                variant="clear"
                colorScheme="neutral"
                onClick={onConfirmModalClose}
              >
                Cancel
              </Button>
              <Button
                variant="solid"
                colorScheme="critical"
                onClick={() => deleteMutation.mutate({ urls: parsedUrls })}
                isLoading={deleteMutation.isPending}
              >
                Delete {parsedUrls.length} asset(s)
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  )
}

GodModeDeleteAssetsPage.getLayout = AuthenticatedLayout

export default GodModeDeleteAssetsPage
