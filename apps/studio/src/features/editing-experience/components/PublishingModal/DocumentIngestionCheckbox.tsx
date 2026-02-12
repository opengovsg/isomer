import type { UseFormRegisterReturn } from "react-hook-form"
import { forwardRef, Suspense } from "react"
import { Text } from "@chakra-ui/react"
import { Checkbox } from "@opengovsg/design-system-react"
import { z } from "zod"

import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"

const linkSchema = z.object({
  linkId: z.string(),
  siteId: z.coerce.number().min(1),
})

type DocumentIngestionCheckboxProps =
  UseFormRegisterReturn<"shouldIngestDocument">

const DocumentIngestionCheckboxContent = forwardRef<
  HTMLInputElement,
  DocumentIngestionCheckboxProps
>((props, ref) => {
  const { linkId, siteId } = useQueryParse(linkSchema)
  const [{ url }] = trpc.resource.getAssetUrlOfResource.useSuspenseQuery({
    resourceId: linkId.toString(),
    siteId,
  })

  // NOTE: We should only show this checkbox for files - we cannot ingest an image
  return (
    url?.endsWith(".pdf") && (
      <Checkbox ref={ref} {...props}>
        <Text>Show this document in search results</Text>
      </Checkbox>
    )
  )
})

DocumentIngestionCheckboxContent.displayName =
  "DocumentIngestionCheckboxContent"

export const DocumentIngestionCheckbox = forwardRef<
  HTMLInputElement,
  DocumentIngestionCheckboxProps
>((props, ref) => {
  return (
    <Suspense fallback={null}>
      <DocumentIngestionCheckboxContent ref={ref} {...props} />
    </Suspense>
  )
})

DocumentIngestionCheckbox.displayName = "DocumentIngestionCheckbox"
