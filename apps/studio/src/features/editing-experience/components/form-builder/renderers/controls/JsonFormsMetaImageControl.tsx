import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl, FormErrorMessage, Skeleton } from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { Attachment, FormLabel } from "@opengovsg/design-system-react"
import { z } from "zod"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useUploadAssetMutation } from "~/hooks/useUploadAssetMutation"
import { useImage } from "../../hooks/useImage"
import { useS3Image } from "../../hooks/useS3Image"
import { getCustomErrorMessage } from "./utils"

export const jsonFormsMetaImageControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ImageControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === "meta-image"),
  ),
)

const schema = z.object({
  siteId: z.coerce.number(),
})

interface JsonFormsMetaImageControlProps extends ControlProps {
  data: string
}
export function JsonFormsMetaImageControl(
  props: JsonFormsMetaImageControlProps,
) {
  const { label, handleChange, path, required, errors, description, data } =
    props
  const { image } = useS3Image(data)
  const { handleImage, isLoading } = useImage({})
  const { siteId } = useQueryParse(schema)
  const { mutate: uploadFile } = useUploadAssetMutation({
    siteId,
  })

  return (
    <Box as={FormControl} isRequired={required} isInvalid={!!errors}>
      <Skeleton isLoaded={!isLoading}>
        <FormLabel description={description}>{label}</FormLabel>
        <Attachment
          accept={["image/*"]}
          multiple={false}
          value={image}
          name="file-upload"
          onChange={(file) => {
            if (!file) {
              handleChange(props.path, undefined)
              return
            }

            uploadFile(
              { file },
              {
                onSuccess: ({ path: imagePath }) => {
                  void handleImage(imagePath).then((src) => {
                    handleChange(path, src)
                  })
                },
              },
            )
          }}
          imagePreview="large"
          showFileSize={false}
        />
        {!!errors && (
          <FormErrorMessage>
            {label} {getCustomErrorMessage(errors)}
          </FormErrorMessage>
        )}
      </Skeleton>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsMetaImageControl)
