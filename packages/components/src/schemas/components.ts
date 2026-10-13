import type { TSchema } from "@sinclair/typebox"
import type { IsomerPageLayoutType, IsomerComponentTypes } from "~/types"
import { Type } from "@sinclair/typebox"
import {
  AccordionContainerEditorSchema,
  AccordionSchema,
  AudioSchema,
  BlockquoteSchema,
  ButtonSchema,
  CalloutSchema,
  ChildrenPagesSchema,
  CollectionBlockSchema,
  ColumnDefaultSchema,
  ColumnHomepageSchema,
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
  column: ColumnHomepageSchema,
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

  if (component === "column") {
    return layout === "homepage" ? ColumnHomepageSchema : ColumnDefaultSchema
  }

  // An accordion is edited as a container of child blocks; page validation
  // still accepts the legacy prose-only shape via AccordionSchema.
  if (component === "accordion") {
    return AccordionContainerEditorSchema
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
