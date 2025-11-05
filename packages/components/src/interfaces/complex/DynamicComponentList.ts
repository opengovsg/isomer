import type { Static } from "@sinclair/typebox"
import { Omit, Type } from "@sinclair/typebox"

import type {
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"
import { COMPONENT_TYPES_MAP } from "~/constants"
import { DgsDataSourceFieldsSchema } from "../integration"
import { DgsContactInformationSchema } from "./ContactInformation"

const ContactInformationComponentSchema = Type.Intersect([
  Type.Object({
    type: Type.Literal(COMPONENT_TYPES_MAP.ContactInformation),
  }),
  Omit(DgsContactInformationSchema, ["dataSource"]),
])

export const DynamicComponentListSchema = Type.Object({
  type: Type.Literal(COMPONENT_TYPES_MAP.DynamicComponentList, {
    default: COMPONENT_TYPES_MAP.DynamicComponentList,
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

export type DgsTransformedContactInformationProps = Static<
  typeof ContactInformationComponentSchema
> & {
  record: Record<string, string | number>
}
