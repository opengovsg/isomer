import type { TSchema } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerComponentTypes, IsomerPageLayoutType } from "~/types"
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
  AudioSchema,
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
  audio: AudioSchema,
  video: VideoSchema,
  childrenpages: ChildrenPagesSchema,
  dynamicdatabanner: DynamicDataBannerSchema,
  logocloud: LogoCloudSchema,
  collectionblock: CollectionBlockSchema,
  imagegallery: ImageGallerySchema,
  contactinformation: ContactInformationSchema,
  dynamiccomponentlist: DynamicComponentListSchema,
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
