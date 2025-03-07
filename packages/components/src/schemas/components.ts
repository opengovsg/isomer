import type { TSchema } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerComponentTypes } from "~/types"
import {
  AccordionSchema,
  CalloutSchema,
  ContentpicSchema,
  DividerSchema,
  DYNAMIC_DATA_BANNER_TYPE,
  DynamicDataBannerSchema,
  HeadingSchema,
  HeroSchema,
  IframeSchema,
  ImageSchema,
  InfobarSchema,
  InfoCardsSchema,
  InfoColsSchema,
  InfopicSchema,
  KeyStatisticsSchema,
  LogoCloudSchema,
  MapSchema,
  OrderedListSchema,
  ParagraphSchema,
  ProseSchema,
  TableSchema,
  UnorderedListSchema,
  VideoSchema,
} from "~/interfaces"

export const IsomerComplexComponentsMap = {
  accordion: AccordionSchema,
  callout: CalloutSchema,
  hero: HeroSchema,
  iframe: IframeSchema,
  image: ImageSchema,
  infobar: InfobarSchema,
  infocards: InfoCardsSchema,
  infocols: InfoColsSchema,
  infopic: InfopicSchema,
  contentpic: ContentpicSchema,
  keystatistics: KeyStatisticsSchema,
  map: MapSchema,
  video: VideoSchema,
  [DYNAMIC_DATA_BANNER_TYPE]: DynamicDataBannerSchema,
  logocloud: LogoCloudSchema,
}

export const IsomerNativeComponentsMap = {
  prose: ProseSchema,
  divider: DividerSchema,
  heading: HeadingSchema,
  orderedList: OrderedListSchema,
  paragraph: ParagraphSchema,
  table: TableSchema,
  unorderedList: UnorderedListSchema,
}

export const componentSchemaDefinitions = {
  components: {
    complex: IsomerComplexComponentsMap,
    native: IsomerNativeComponentsMap,
  },
}

export const getComponentSchema = (
  component: IsomerComponentTypes,
): TSchema => {
  const componentSchema =
    component === "prose"
      ? Type.Ref(IsomerNativeComponentsMap.prose)
      : IsomerComplexComponentsMap[component]

  return {
    ...componentSchema,
    ...componentSchemaDefinitions,
  }
}
