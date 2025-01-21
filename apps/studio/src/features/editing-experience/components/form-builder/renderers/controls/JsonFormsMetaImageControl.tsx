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

import { ImageUploadInfobox } from "~/components/ImageUploadInfobox"
import { FileAttachment } from "~/components/PageEditor/FileAttachment"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { env } from "~/env.mjs"
import { useQueryParse } from "~/hooks/useQueryParse"
import {
  IMAGE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
  MAX_IMG_FILE_SIZE_BYTES,
} from "./constants"

export const jsonFormsMetaImageControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ImageControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === "meta-image"),
  ),
)

const editSiteSchema = z.object({
  siteId: z.coerce.number(),
})

interface JsonFormsMetaImageControlProps extends ControlProps {
  data: string
}
export function JsonFormsMetaImageControl({
  label,
  handleChange,
  path,
  required,
  data,
}: JsonFormsMetaImageControlProps) {
  const { siteId } = useQueryParse(editSiteSchema)
  const { isOpen, onClose, onOpen } = useDisclosure()
  const [href, setHref] = useState("")
  const [file, setFile] = useState<undefined | File>(undefined)
  const imgSrc = `${env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME}${data}`

  return (
    <>
      <ImageUploadInfobox
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
      </ImageUploadInfobox>

      {!!data && (
        <img
          src={`https://${env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME}${data}`}
          onError={({ currentTarget }) => {
            currentTarget.onerror = null
            currentTarget.src = URL.createObjectURL(file!)
          }}
        />
      )}

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
              setHref={(image, original) => {
                setHref(image ?? "")
                setFile(original)
              }}
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

export default withJsonFormsControlProps(JsonFormsMetaImageControl)
