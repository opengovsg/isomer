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
  InfoCardsDefaultSchema,
  InfoCardsHomepageSchema,
  InfoColsSchema,
  InfopicSchema,
  KeyStatisticsSchema,
  LogoCloudSchema,
  MapSchema,
  OrderedListSchema,
  ParagraphSchema,
  ProseSchema,
  StepsSchema,
  TableSchema,
  UnorderedListSchema,
  VideoSchema,
} from "~/interfaces"

export const IsomerComplexComponentsMap = {
  accordion: AccordionSchema,
  blockquote: BlockquoteSchema,
  button: ButtonSchema,
  callout: CalloutSchema,
  formsg: FormSGSchema,
  hero: HeroSchema,
  iframe: IframeSchema,
  image: ImageSchema,
  infobar: InfobarHomepageSchema,
  infocards: InfoCardsHomepageSchema,
  infocols: InfoColsSchema,
  infopic: InfopicSchema,
  contentpic: ContentpicSchema,
  keystatistics: KeyStatisticsSchema,
  steps: StepsSchema,
  map: MapSchema,
  audio: AudioSchema,
  video: VideoSchema,
  childrenpages: ChildrenPagesSchema,
  dynamicdatabanner: DynamicDataBannerSchema,
  antiscambanner: AntiScamDisclaimerBannerSchema,
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

  // TODO: remove when we are rolling out to all pages beyond the homepage
  if (component === "infocards") {
    return layout === "homepage"
      ? InfoCardsHomepageSchema
      : InfoCardsDefaultSchema
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
