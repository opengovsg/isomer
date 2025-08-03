import type { Static } from "@sinclair/typebox"
import { Omit, Type } from "@sinclair/typebox"

import type {
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"
import { DgsDataSourceSchema } from "../dataSource"
import {
  CONTACT_INFORMATION_TYPE,
  DgsContactInformationSchema,
} from "./ContactInformation"

export const DYNAMIC_COMPONENT_LIST_TYPE = "dynamiccomponentlist"

const ContactInformationComponentSchema = Type.Intersect([
  Type.Object({
    type: Type.Literal(CONTACT_INFORMATION_TYPE),
  }),
  Omit(DgsContactInformationSchema, ["type", "dataSource"]),
])

export const DynamicComponentListSchema = Type.Object({
  type: Type.Literal(DYNAMIC_COMPONENT_LIST_TYPE, {
    default: DYNAMIC_COMPONENT_LIST_TYPE,
  }),
  dataSource: Type.Union([DgsDataSourceSchema]),
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
