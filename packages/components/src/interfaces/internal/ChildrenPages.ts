import { Static } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { ChildpagesSchema } from "~/schemas/childpage"

export interface ChildrenPagesProps extends Static<typeof ChildpagesSchema> {
  permalink: string
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}
