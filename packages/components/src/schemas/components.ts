import type { TSchema } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerComponentTypes, IsomerPageLayoutType } from "~/types"
import {
  AccordionSchema,
  BlockquoteSchema,
  CalloutSchema,
  ChildrenPagesSchema,
  COLLECTION_BLOCK_TYPE,
  CollectionBlockSchema,
  CONTACT_INFORMATION_TYPE,
  ContactInformationSchema,
  ContentpicSchema,
  DividerSchema,
  DYNAMIC_COMPONENT_LIST_TYPE,
  DYNAMIC_DATA_BANNER_TYPE,
  DynamicComponentListSchema,
  DynamicDataBannerSchema,
  FormSGSchema,
  HeadingSchema,
  HeroSchema,
  IframeSchema,
  IMAGE_GALLERY_TYPE,
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
  SEARCHABLE_TABLE_TYPE,
  SearchableTableSchema,
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
  [DYNAMIC_DATA_BANNER_TYPE]: DynamicDataBannerSchema,
  logocloud: LogoCloudSchema,
  [COLLECTION_BLOCK_TYPE]: CollectionBlockSchema,
  [IMAGE_GALLERY_TYPE]: ImageGallerySchema,
  [SEARCHABLE_TABLE_TYPE]: SearchableTableSchema,
  [CONTACT_INFORMATION_TYPE]: ContactInformationSchema,
  [DYNAMIC_COMPONENT_LIST_TYPE]: DynamicComponentListSchema,
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
