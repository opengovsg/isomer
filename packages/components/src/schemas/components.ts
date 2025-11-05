import type { TSchema } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerComponentTypes, IsomerPageLayoutType } from "~/types"
import { COMPONENT_TYPES_MAP } from "~/constants"
import {
  AccordionSchema,
  BlockquoteSchema,
  CalloutSchema,
  ChildrenPagesSchema,
  CollectionBlockSchema,
  ContactInformationSchema,
  ContentpicSchema,
  DividerSchema,
  DynamicComponentListSchema,
  DynamicDataBannerSchema,
  FormSGSchema,
  HeadingSchema,
  HeroSchema,
  IframeSchema,
  ImageGallerySchema,
  ImageSchema,
  InfobarDefaultSchema,
  InfobarHomepageSchema,
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
  blockquote: BlockquoteSchema,
  callout: CalloutSchema,
  formsg: FormSGSchema,
  hero: HeroSchema,
  iframe: IframeSchema,
  image: ImageSchema,
  infobar: InfobarHomepageSchema,
  infocards: InfoCardsSchema,
  infocols: InfoColsSchema,
  infopic: InfopicSchema,
  contentpic: ContentpicSchema,
  keystatistics: KeyStatisticsSchema,
  map: MapSchema,
  video: VideoSchema,
  childrenpages: ChildrenPagesSchema,
  [COMPONENT_TYPES_MAP.DynamicDataBanner]: DynamicDataBannerSchema,
  logocloud: LogoCloudSchema,
  [COMPONENT_TYPES_MAP.CollectionBlock]: CollectionBlockSchema,
  [COMPONENT_TYPES_MAP.ImageGallery]: ImageGallerySchema,
  [COMPONENT_TYPES_MAP.ContactInformation]: ContactInformationSchema,
  [COMPONENT_TYPES_MAP.DynamicComponentList]: DynamicComponentListSchema,
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

interface ComponentSchema {
  component: IsomerComponentTypes
  layout?: IsomerPageLayoutType
}

const generateComponentSchema = ({ component, layout }: ComponentSchema) => {
  if (component === "prose") {
    return Type.Ref(IsomerNativeComponentsMap.prose)
  }

  if (component === "infobar") {
    return layout === "homepage" ? InfobarHomepageSchema : InfobarDefaultSchema
  }

  return IsomerComplexComponentsMap[component]
}

export const getComponentSchema = ({
  component,
  layout,
}: ComponentSchema): TSchema => {
  return {
    ...generateComponentSchema({ component, layout }),
    ...componentSchemaDefinitions,
  }
}
