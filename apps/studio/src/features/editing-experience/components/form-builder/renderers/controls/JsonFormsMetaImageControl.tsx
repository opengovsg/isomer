import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl, Skeleton, Text } from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  Attachment,
  FormErrorMessage,
  FormLabel,
} from "@opengovsg/design-system-react"
import { META_IMAGE_FORMAT } from "@opengovsg/isomer-components"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { pageSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useUploadAssetMutation } from "~/hooks/useUploadAssetMutation"
import { getPresignedPutUrlSchema } from "~/schemas/asset"
import { useAssetUpload } from "../../hooks/useAssetUpload"
import { useS3Image } from "../../hooks/useS3Image"
import {
  ACCEPTED_IMAGE_TYPES_MESSAGE,
  IMAGE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
  MAX_IMG_FILE_SIZE_BYTES,
  ONE_MB_IN_BYTES,
} from "./constants"
import { getCustomErrorMessage } from "./utils"

export const jsonFormsMetaImageControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ImageControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === META_IMAGE_FORMAT),
  ),
)
interface JsonFormsMetaImageControlProps extends ControlProps {
  data: string
}
export function JsonFormsMetaImageControl(
  props: JsonFormsMetaImageControlProps,
) {
  const { label, handleChange, path, required, errors, description, data } =
    props
  const { image } = useS3Image(data)
  const { handleAssetUpload, isLoading } = useAssetUpload({})
  const { siteId, pageId } = useQueryParse(pageSchema)
  const { mutate: uploadFile } = useUploadAssetMutation({
    siteId,
    resourceId: String(pageId),
  })

  return (
    <Box as={FormControl} isRequired={required} isInvalid={!!errors}>
      <FormLabel description={description}>{label}</FormLabel>

      <Skeleton isLoaded={!isLoading}>
        <Attachment
          accept={Object.values(IMAGE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING)}
          maxSize={MAX_IMG_FILE_SIZE_BYTES}
          multiple={false}
          value={image}
          name="file-upload"
          onFileValidation={(file) => {
            const parseResult = getPresignedPutUrlSchema
              .pick({ fileName: true })
              .safeParse({ fileName: file.name })

            if (parseResult.success) return null
            // NOTE: safe assertion here because we're in error path and there's at least 1 error
            return (
              parseResult.error.errors[0]?.message ||
              "Please ensure that your file begins with alphanumeric characters!"
            )
          }}
          onChange={(file) => {
            if (!file) {
              handleChange(props.path, undefined)
              return
            }

            uploadFile(
              { file },
              {
                onSuccess: ({ path: imagePath }) => {
                  void handleAssetUpload(imagePath).then((src) => {
                    handleChange(path, src)
                  })
                },
              },
            )
          }}
          imagePreview="small"
        />
      </Skeleton>
      <Text textStyle="body-2" textColor="base.content.medium" pt="0.5rem">
        {`Maximum file size: ${MAX_IMG_FILE_SIZE_BYTES / ONE_MB_IN_BYTES} MB`}
        <br />
        {`Accepted file types: ${ACCEPTED_IMAGE_TYPES_MESSAGE}`}
      </Text>
      {!!errors && (
        <FormErrorMessage>
          {label} {getCustomErrorMessage(errors)}
        </FormErrorMessage>
      )}
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsMetaImageControl)
