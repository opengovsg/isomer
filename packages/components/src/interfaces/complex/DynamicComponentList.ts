import type { Static } from "@sinclair/typebox"
import { Omit, Type } from "@sinclair/typebox"

import type {
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"
import { IMAGE_GALLERY_TYPE, ImageGallerySchema } from "./ImageGallery"
import { KEY_STATISTICS_TYPE, KeyStatisticsSchema } from "./KeyStatistics"

export const DYNAMIC_COMPONENT_LIST_TYPE = "dynamiccomponentlist"
export const DGS_DATA_SOURCE = "dgs"

const DgsDataSourceSchema = Type.Object({
  type: Type.Literal(DGS_DATA_SOURCE, { default: DGS_DATA_SOURCE }),
  resourceId: Type.String({
    title: "DGS Resource ID",
    description: "The resource ID to fetch data from DGS",
  }),
})

const KeyStatisticsComponentSchema = Type.Intersect([
  Type.Object({
    type: Type.Literal(KEY_STATISTICS_TYPE),
  }),
  Omit(KeyStatisticsSchema, ["id", "type", "statistics"]),
  Type.Object({
    statistics: Type.String(),
  }),
])

const ImageGalleryComponentSchema = Type.Intersect([
  Type.Object({
    type: Type.Literal(IMAGE_GALLERY_TYPE),
  }),
  Omit(ImageGallerySchema, ["id", "type"]),
])

export const DynamicComponentListSchema = Type.Object({
  type: Type.Literal(DYNAMIC_COMPONENT_LIST_TYPE, {
    default: DYNAMIC_COMPONENT_LIST_TYPE,
  }),
  dataSource: Type.Union([DgsDataSourceSchema]),
  component: Type.Union([
    KeyStatisticsComponentSchema,
    ImageGalleryComponentSchema,
  ]),
})

export type DynamicComponentListProps = Static<
  typeof DynamicComponentListSchema
> & {
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}

export type KeyStatisticsComponentProps = Static<
  typeof KeyStatisticsComponentSchema
>

export type ImageGalleryComponentProps = Static<
  typeof ImageGalleryComponentSchema
>
