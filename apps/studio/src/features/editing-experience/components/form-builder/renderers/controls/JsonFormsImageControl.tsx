import type { ControlProps, RankedTester } from "@jsonforms/core"
import { useState } from "react"
import {
  Button,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { BiTrash } from "react-icons/bi"
import { z } from "zod"

import { ImageUpload } from "~/components/ImageUpload"
import { FileAttachment } from "~/components/PageEditor/FileAttachment"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useQueryParse } from "~/hooks/useQueryParse"
import {
  IMAGE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
  MAX_IMG_FILE_SIZE_BYTES,
} from "./constants"

export const jsonFormsImageControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ImageControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === "image"),
  ),
)

const editSiteSchema = z.object({
  siteId: z.coerce.number(),
})

export function JsonFormsImageControl({
  label,
  handleChange,
  path,
  required,
  data,
}: ControlProps) {
  const { siteId } = useQueryParse(editSiteSchema)
  const { isOpen, onClose, onOpen } = useDisclosure()
  const [href, setHref] = useState("")

  return (
    <>
      <ImageUpload
        description={"Upload an image"}
        label={label}
        onClick={onOpen}
        required={required}
      >
        {!!data && (
          <>
            {data.split("/").pop()}
            <IconButton
              size="xs"
              variant="clear"
              colorScheme="critical"
              aria-label="Remove file"
              icon={<BiTrash />}
              onClick={() => handleChange(path, undefined)}
            />
          </>
        )}
      </ImageUpload>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader mr="3.5rem">Add an image</ModalHeader>
          <ModalCloseButton size="lg" />

          <ModalBody>
            <FileAttachment
              maxSizeInBytes={MAX_IMG_FILE_SIZE_BYTES}
              acceptedFileTypes={IMAGE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING}
              siteId={siteId}
              setHref={(image) => setHref(image ?? "")}
            />
          </ModalBody>

          <ModalFooter>
            <Button
              variant="solid"
              onClick={() => {
                handleChange(path, href)
                onClose()
              }}
              isDisabled={!href}
              type="submit"
            >
              Add an image
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default withJsonFormsControlProps(JsonFormsImageControl)
