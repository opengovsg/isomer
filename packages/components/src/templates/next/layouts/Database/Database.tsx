import type { DatabasePageSchemaType } from "~/types"
import { renderPageContent } from "../../render/renderPageContent"
import { DatabaseLayoutSkeleton } from "../DatabaseSkeleton"

export const DatabaseLayout = (props: DatabasePageSchemaType) => {
  return (
    <DatabaseLayoutSkeleton {...props} renderPageContent={renderPageContent} />
  )
}
