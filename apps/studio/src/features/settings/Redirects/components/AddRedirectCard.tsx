import { useDisclosure } from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"
import posthog from "posthog-js"
import { useState } from "react"
import { REDIRECT_MESSAGES } from "~/constants/redirect"
import {
  BRIEF_TOAST_SETTINGS,
  SETTINGS_TOAST_MESSAGES,
} from "~/constants/toast"
import { useZodForm } from "~/lib/form"
import { normalizeRedirectSource, redirectKind } from "~/schemas/redirect"

import { useCreateRedirect } from "../api"
import { addRedirectSchema, type AddRedirectInput } from "../types"
import { AddRedirectCardForm } from "./AddRedirectCardForm"

const safeNormalize = (raw: string): string | null => {
  try {
    return normalizeRedirectSource(raw)
  } catch {
    return null
  }
}

const buildWildcardPreview = (
  normalizedSource: string,
  destination: string,
): string | null => {
  if (!normalizedSource.endsWith("/*")) return null
  const prefix = normalizedSource.slice(0, -2)
  const trimmed = destination.trim()
  const base = trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed
  return `${prefix}/example → ${base}/example`
}

interface AddRedirectCardProps {
  siteId: number
}

export const AddRedirectCard = ({
  siteId,
}: AddRedirectCardProps): React.ReactNode => {
  const form = useZodForm<typeof addRedirectSchema>({
    schema: addRedirectSchema,
    defaultValues: { source: "", destination: "" },
  })
  const { reset, setError, watch } = form
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const { mutate: createRedirect, isPending } = useCreateRedirect()
  const {
    isOpen: isPageModalOpen,
    onOpen: onPageModalOpen,
    onClose: onPageModalClose,
  } = useDisclosure()
  const {
    isOpen: isBulkUploadOpen,
    onOpen: onBulkUploadOpen,
    onClose: onBulkUploadClose,
  } = useDisclosure()

  const [source, destination] = watch(["source", "destination"])
  const isAddDisabled = !source?.trim() || !destination?.trim()

  const trimmedSource = source?.trim()
  const normalizedSource = trimmedSource ? safeNormalize(trimmedSource) : null
  const kind = normalizedSource ? redirectKind(normalizedSource) : "exact"

  const wildcardPreview =
    kind === "wildcard" && normalizedSource && destination
      ? buildWildcardPreview(normalizedSource, destination)
      : null

  const [isDestinationFocused, setIsDestinationFocused] = useState(false)

  const onSubmit = ({ source, destination }: AddRedirectInput) => {
    createRedirect(
      { siteId, source, destination },
      {
        onSuccess: () => {
          posthog.capture("redirect_created", {
            site_id: siteId,
            destination_type: destination.startsWith("/")
              ? "internal"
              : "external",
          })
          reset()
          toast({ ...SETTINGS_TOAST_MESSAGES.success, status: "success" })
        },
        onError: (error) => {
          switch (error.data?.code) {
            case "CONFLICT":
              setError("source", { message: REDIRECT_MESSAGES.alreadyExists })
              break
            case "PRECONDITION_FAILED":
              setError("source", {
                message: REDIRECT_MESSAGES.sourceIsExistingPage,
              })
              break
            case "UNPROCESSABLE_CONTENT":
              setError("destination", { message: REDIRECT_MESSAGES.loop })
              break
            default:
              toast({
                title: "Failed to add redirect",
                description: error.message,
                status: "error",
              })
          }
        },
      },
    )
  }

  return (
    <AddRedirectCardForm
      siteId={siteId}
      form={form}
      uiState={{
        isAddDisabled,
        isDestinationFocused,
        isPending,
        isPageModalOpen,
        isBulkUploadOpen,
      }}
      wildcardPreview={wildcardPreview}
      setIsDestinationFocused={setIsDestinationFocused}
      onPageModalOpen={onPageModalOpen}
      onPageModalClose={onPageModalClose}
      onBulkUploadOpen={onBulkUploadOpen}
      onBulkUploadClose={onBulkUploadClose}
      onSubmit={onSubmit}
    />
  )
}
