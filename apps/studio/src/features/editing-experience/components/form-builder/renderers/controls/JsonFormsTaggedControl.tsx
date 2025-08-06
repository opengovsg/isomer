import { FormControl, Skeleton } from "@chakra-ui/react"
import { useFeatureValue } from "@growthbook/growthbook-react"
import {
  and,
  ArrayLayoutProps,
  ControlProps,
  RankedTester,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import {
  withJsonFormsArrayLayoutProps,
  withJsonFormsControlProps,
} from "@jsonforms/react"
import { FormLabel, SingleSelect } from "@opengovsg/design-system-react"
import { useSetAtom } from "jotai"

import Suspense from "~/components/Suspense"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { linkAtom } from "~/features/editing-experience/atoms"
import { collectionItemSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"

export const jsonFormsTaggedControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.HiddenControl,
  and(schemaMatches((schema) => schema.format === "tagged")),
)

export function JsonFormsTaggedControl({
  data,
  path,
  visible,
  enabled,
  label,
  schema,
  rootSchema,
  renderers,
  cells,
  uischemas,
  uischema,
}: ArrayLayoutProps) {
  const { siteId, linkId, pageId } = useQueryParse(collectionItemSchema)
  // NOTE: Since this is only rendered inside a collection page or collection link,
  // we should always have the `resourceId` specifier
  const resourceId = linkId ?? pageId ?? 1
  const [tags] = trpc.collection.getCollectionTags.useSuspenseQuery({
    resourceId,
    siteId,
  })

  console.log(tags)

  return null
}

export default withJsonFormsArrayLayoutProps(JsonFormsTaggedControl)
