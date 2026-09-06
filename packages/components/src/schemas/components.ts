import type { TSchema } from "@sinclair/typebox"
import type { IsomerPageLayoutType, IsomerComponentTypes } from "~/types"
import { Type } from "@sinclair/typebox"
import {
  AccordionSchema,
  AudioSchema,
  BlockquoteSchema,
  ButtonSchema,
  CalloutSchema,
  ChildrenPagesSchema,
  CollectionBlockSchema,
  ContactInformationSchema,
  ContentpicSchema,
  DividerSchema,
  DynamicComponentListSchema,
  DynamicDataBannerSchema,
  AntiScamDisclaimerBannerSchema,
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
  antiscambanner: AntiScamDisclaimerBannerSchema,
  audio: AudioSchema,
  blockquote: BlockquoteSchema,
  button: ButtonSchema,
  callout: CalloutSchema,
  childrenpages: ChildrenPagesSchema,
  collectionblock: CollectionBlockSchema,
  contactinformation: ContactInformationSchema,
  contentpic: ContentpicSchema,
  dynamiccomponentlist: DynamicComponentListSchema,
  dynamicdatabanner: DynamicDataBannerSchema,
  formsg: FormSGSchema,
  hero: HeroSchema,
  iframe: IframeSchema,
  image: ImageSchema,
  imagegallery: ImageGallerySchema,
  infobar: InfobarHomepageSchema,
  infocards: InfoCardsSchema,
  infocols: InfoColsSchema,
  infopic: InfopicSchema,
  keystatistics: KeyStatisticsSchema,
  logocloud: LogoCloudSchema,
  map: MapSchema,
  video: VideoSchema,
}

export const IsomerNativeComponentsMap = {
  divider: DividerSchema,
  heading: HeadingSchema,
  orderedList: OrderedListSchema,
  paragraph: ParagraphSchema,
  prose: ProseSchema,
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
}: ComponentSchema): TSchema => ({
  ...generateComponentSchema({ component, layout }),
  ...componentSchemaDefinitions,
})
