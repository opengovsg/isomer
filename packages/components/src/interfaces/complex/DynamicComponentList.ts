import type { Static } from "@sinclair/typebox"
import { Omit, Type } from "@sinclair/typebox"

import type {
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"
import { DgsDataSourceFieldsSchema } from "../integration"
import { DgsContactInformationSchema } from "./ContactInformation/ContactInformation"

const ContactInformationComponentSchema = Type.Intersect([
  Type.Object({
    type: Type.Literal("contactinformation"),
  }),
  Omit(DgsContactInformationSchema, ["dataSource"]),
])

export const DynamicComponentListSchema = Type.Object({
  type: Type.Literal("dynamiccomponentlist", {
    default: "dynamiccomponentlist",
  }),
  dataSource: Type.Union([DgsDataSourceFieldsSchema]),
  component: Type.Union([ContactInformationComponentSchema]),
})

export type DynamicComponentListProps = Static<
  typeof DynamicComponentListSchema
> & {
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}
