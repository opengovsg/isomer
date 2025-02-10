import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, Image } from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { env } from "~/env.mjs"
import { PLACEHOLDER_IMAGE_FILENAME } from "../../../constants"
import { JsonFormsImageControl } from "./JsonFormsImageControl"

const assetsBaseUrl = `https://${env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME}`
export const jsonFormsMetaImageControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ImageControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === "meta-image"),
  ),
)

interface JsonFormsMetaImageControlProps extends ControlProps {
  data: string
}
export function JsonFormsMetaImageControl(
  props: JsonFormsMetaImageControlProps,
) {
  const { data } = props
  return (
    <>
      <JsonFormsImageControl {...props} />
      {/* NOTE: not using the `as` prop here on the `Box` because the */}
      {/* `currentTarget` will be inferred as a `div` which lacks the `src` property */}
      <Box mt="1rem">
        <Image
          src={`${assetsBaseUrl}${data}`}
          fallbackSrc={`${assetsBaseUrl}/${PLACEHOLDER_IMAGE_FILENAME}`}
        />
      </Box>
    </>
  )
}

export default withJsonFormsControlProps(JsonFormsMetaImageControl)
