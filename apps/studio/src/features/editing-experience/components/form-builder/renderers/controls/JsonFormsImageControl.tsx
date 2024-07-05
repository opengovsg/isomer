import {
  and,
  isBooleanControl,
  isStringControl,
  or,
  rankWith,
  schemaMatches,
  schemaTypeIs,
  scopeEndsWith,
  uiTypeIs,
  type ControlProps,
  type RankedTester,
} from '@jsonforms/core'
import { JSON_FORMS_RANKING } from '~/constants/formBuilder'
import { Attachment, FormLabel } from '@opengovsg/design-system-react'
import { Box, FormControl, Text } from '@chakra-ui/react'
import { withJsonFormsControlProps } from '@jsonforms/react'
import { useEffect, useState } from 'react'

const MAX_IMG_FILE_SIZE_BYTES = 5000000

export const jsonFormsImageControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ImageControl,
  and(
    schemaMatches((schema) => {
      return schema.format === 'image'
    }),
    isStringControl,
  ),
)
export function JsonFormsImageControl({
  data,
  label,
  handleChange,
  path,
  description,
  required,
}: ControlProps) {
  const [selectedFile, setSelectedFile] = useState<File | undefined>()

  useEffect(() => {
    // file should always reflect the linked URL image
    const fetchImage = async () => {
      const res = await fetch(data)
      const blob = await res.blob()
      const splitUrl = data.split('.')
      const extension = splitUrl[splitUrl.length - 1]
      const filename = `image.${extension}`
      setSelectedFile(new File([blob], filename, { type: blob.type }))
    }
    if (data) {
      fetchImage().catch((error) =>
        console.error('Error in fetching current image:', error),
      )
    }
  }, [data])
  return (
    <Box py={2}>
      <FormControl isRequired={required}>
        <FormLabel description={description}>{label}</FormLabel>
        <Attachment
          name="image-upload"
          imagePreview="large"
          multiple={false}
          value={selectedFile}
          onChange={(file) => {
            console.log(file?.name)
            if (file) {
              // TODO: file attached, upload file
              const newImgUrl = '/assets/restricted-ogp-logo-full.svg'
              handleChange(path, newImgUrl)
              console.log('new url', newImgUrl)
            } else {
              handleChange(path, '')
            }
            console.log(file)
            setSelectedFile(file)
          }}
          onError={(error) => {
            console.log('file attachment error ', error)
          }}
          onRejection={(rejections) => {
            console.log(rejections)
          }}
          maxSize={MAX_IMG_FILE_SIZE_BYTES}
          accept={['image/*']}
        />
        <Text textStyle="body-2" textColor="base.content.medium" pt="0.5rem">
          {`Maximum file size: ${MAX_IMG_FILE_SIZE_BYTES / 1000000} MB`}
        </Text>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsImageControl)
