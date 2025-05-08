import type { Static } from "@sinclair/typebox"

import type { ChildpageMetaSchema } from "~/schemas/childpage"
import type { IsomerSiteProps, LinkComponentType } from "~/types"

export interface ChildrenPagesProps extends Static<typeof ChildpageMetaSchema> {
  permalink: string
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}
