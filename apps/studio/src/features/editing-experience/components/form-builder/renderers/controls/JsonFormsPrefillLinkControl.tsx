import type { ControlProps, RankedTester } from "@jsonforms/core"
import {
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
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { Button, useToast } from "@opengovsg/design-system-react"
import { useCallback, useEffect, useState } from "react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"

import { LINK_TYPES_MAPPING } from "../../../LinkEditor/constants"
import { AUTOPOPULATED_FIELDS } from "../../constants"
import { usePrefillForCards } from "../../hooks/usePrefill"
import { BaseLinkControl } from "./BaseLinkControl"

interface ReplaceContentModalProps {
  isOpen: boolean
  onClose: () => void
  onProceed: () => void
}
const ReplaceContentModal = ({
  isOpen,
  onClose,
  onProceed,
}: ReplaceContentModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>
        Replace content with details from the linked page?
      </ModalHeader>
      <ModalBody>
        <Text>
          If the linked page has a title, summary or thumbnail, they&apos;ll be
          copied over.
        </Text>
      </ModalBody>
      <ModalFooter>
        <HStack spacing={2}>
          <Button variant="clear" onClick={onClose}>
            No, keep my content
          </Button>
          <Button onClick={onProceed}>Yes, replace</Button>
        </HStack>
      </ModalFooter>
    </ModalContent>
  </Modal>
)

export const jsonFormsPrefillLinkControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.LinkControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === "prefill-link"),
  ),
)

const prefillFieldMappings = {
  description: "description",
  imageAlt: "thumbnailAlt",
  imageUrl: "thumbnail",
  title: "title",
} as const

const JsonFormsPrefillLinkControl = ({
  data,
  label,
  handleChange,
  path,
  required,
  errors,
}: ControlProps) => {
  const [canPrefill, setCanPrefill] = useState(false)
  const toast = useToast()
  const prefill = usePrefillForCards({
    data,
    path,
  })
  const {
    isOpen: isPrefillModalOpen,
    onClose: onPrefillModalClose,
    onOpen: onPrefillModalOpen,
  } = useDisclosure()
  const overrideFields = useCallback(() => {
    if (!prefill?.data) {
      return
    }
    // SAFETY: JSON Forms control narrows schema/data to the expected editor shape
    const prefillData = prefill.data as Record<string, string | undefined>
    AUTOPOPULATED_FIELDS.forEach((field) => {
      const prefillField = prefillFieldMappings[field]
      const value = prefillData[prefillField]
      if (value) {
        handleChange(`${prefill.basePath}.${field}`, value)
      }
    })
    toast({
      status: "success",
      title: "Some details of the page were copied over. You can modify them.",
      ...BRIEF_TOAST_SETTINGS,
    })
    setCanPrefill(false)
  }, [handleChange, prefill, toast])

  useEffect(() => {
    if (!prefill?.data) {
      return
    }
    if (!canPrefill) {
      return
    }
    if (!data) {
      return
    }

    const timeoutId = setTimeout(() => {
      if (!prefill.needsConfirmation) {
        overrideFields()
        return
      }

      onPrefillModalOpen()
    }, 0)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [
    canPrefill,
    data,
    onPrefillModalOpen,
    overrideFields,
    prefill?.data,
    prefill?.needsConfirmation,
  ])

  return (
    <>
      <BaseLinkControl
        // SAFETY: JSON Forms control narrows schema/data to the expected editor shape
        data={data as string}
        label={label}
        required={required}
        handleChange={(path, value) => {
          handleChange(path, value)
          setCanPrefill(true)
        }}
        path={path}
        linkTypes={LINK_TYPES_MAPPING}
        description="Link a page, file, external URL, or an email address"
        errors={errors}
      />

      <ReplaceContentModal
        isOpen={isPrefillModalOpen}
        onClose={onPrefillModalClose}
        onProceed={() => {
          overrideFields()
          onPrefillModalClose()
        }}
      />
    </>
  )
}

export default withJsonFormsControlProps(JsonFormsPrefillLinkControl)
