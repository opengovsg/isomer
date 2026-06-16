import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { PreviewLinkExpiryChoice } from "~/schemas/previewLink"
import {
  FormControl,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  Text,
  useClipboard,
} from "@chakra-ui/react"
import {
  Button,
  FormLabel,
  Input,
  useToast,
} from "@opengovsg/design-system-react"
import { useState } from "react"
import {
  PREVIEW_LINK_EXPIRY_CHOICES,
  PREVIEW_LINK_LABEL_MAX_LENGTH,
} from "~/schemas/previewLink"
import { trpc } from "~/utils/trpc"

import { ExistingPreviewLinksList } from "./ExistingPreviewLinksList"

interface SharePreviewModalProps extends Pick<
  UseDisclosureReturn,
  "isOpen" | "onClose"
> {
  siteId: number
  resourceId: number
}

const EXPIRY_LABELS: Record<PreviewLinkExpiryChoice, string> = {
  "24h": "24 hours",
  "3d": "3 days",
  "7d": "7 days",
}

const SGT_TIMEZONE = "Asia/Singapore"

const formatSgtExpiry = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat("en-SG", {
    timeZone: SGT_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  return `${formatter.format(date)} SGT`
}

export const SharePreviewModal = ({
  isOpen,
  onClose,
  siteId,
  resourceId,
}: SharePreviewModalProps): JSX.Element => {
  const [expiry, setExpiry] = useState<PreviewLinkExpiryChoice>("3d")
  const [label, setLabel] = useState("")
  const [mintedUrl, setMintedUrl] = useState<string | null>(null)
  const [mintedExpiresAt, setMintedExpiresAt] = useState<Date | null>(null)
  const toast = useToast()

  const utils = trpc.useUtils()

  const mint = trpc.previewLink.mint.useMutation({
    onSuccess: async (result) => {
      setMintedUrl(result.url)
      setMintedExpiresAt(new Date(result.expiresAt))
      await utils.previewLink.listForPage.invalidate({ siteId, resourceId })
    },
    onError: (err) => {
      toast({
        title: "Couldn't create preview link",
        description: err.message,
        status: "error",
        isClosable: true,
      })
    },
  })

  const { onCopy, hasCopied } = useClipboard(mintedUrl ?? "")

  const resetAndClose = (): void => {
    setExpiry("3d")
    setLabel("")
    setMintedUrl(null)
    setMintedExpiresAt(null)
    onClose()
  }

  const handleGenerate = (): void => {
    const trimmedLabel = label.trim()
    mint.mutate({
      siteId,
      resourceId,
      expiryChoice: expiry,
      label: trimmedLabel.length > 0 ? trimmedLabel : undefined,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Share preview</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {mintedUrl && mintedExpiresAt ? (
            <Stack spacing="1rem">
              <Text>
                Anyone with this link can view a read-only preview of this page
                until it expires.
              </Text>
              <Input value={mintedUrl} isReadOnly aria-label="Preview link" />
              <Text fontSize="sm" color="base.content.medium">
                Expires {formatSgtExpiry(mintedExpiresAt)}
              </Text>
              <Text fontSize="xs" color="base.content.medium">
                Confidential — please ask the recipient not to forward this
                link.
              </Text>
            </Stack>
          ) : (
            <Stack spacing="1rem">
              <ExistingPreviewLinksList
                siteId={siteId}
                resourceId={resourceId}
              />
              <FormControl>
                <FormLabel>Expires after</FormLabel>
                <Select
                  value={expiry}
                  onChange={(e) => {
                    setExpiry(e.target.value as PreviewLinkExpiryChoice)
                  }}
                >
                  {PREVIEW_LINK_EXPIRY_CHOICES.map((choice) => (
                    <option key={choice} value={choice}>
                      {EXPIRY_LABELS[choice]}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>
                  Label{" "}
                  <Text as="span" color="base.content.medium" fontWeight={400}>
                    (optional)
                  </Text>
                </FormLabel>
                <Input
                  value={label}
                  onChange={(e) => {
                    setLabel(e.target.value)
                  }}
                  maxLength={PREVIEW_LINK_LABEL_MAX_LENGTH}
                  placeholder="e.g. For Director Tan"
                />
              </FormControl>
            </Stack>
          )}
        </ModalBody>
        <ModalFooter>
          {mintedUrl ? (
            <HStack>
              <Button variant="clear" onClick={resetAndClose}>
                Close
              </Button>
              <Button onClick={onCopy}>
                {hasCopied ? "Copied" : "Copy link"}
              </Button>
            </HStack>
          ) : (
            <HStack>
              <Button variant="clear" onClick={resetAndClose}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} isLoading={mint.isPending}>
                Generate link
              </Button>
            </HStack>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
