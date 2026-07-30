import type { DatabasePageSchemaType } from "~/types"

import { renderPageContent } from "../../render"
import { DatabaseLayoutSkeleton } from "../DatabaseSkeleton"

export const DatabaseLayout = (props: DatabasePageSchemaType) => {
  return (
    <DatabaseLayoutSkeleton {...props} renderPageContent={renderPageContent} />
  )
}
