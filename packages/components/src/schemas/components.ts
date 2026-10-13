import type { TSchema } from "@sinclair/typebox"
import type { IsomerPageLayoutType, IsomerComponentTypes } from "~/types"
import { Type } from "@sinclair/typebox"
import {
  AccordionContainerEditorSchema,
  AccordionProseEditorSchema,
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
  // Which editing form an Accordion gets: the legacy single prose body, or
  // the container block holding a list of child blocks. Page validation
  // always accepts both shapes.
  accordionEditor?: "prose" | "container"
}

const generateComponentSchema = ({
  component,
  layout,
  accordionEditor = "prose",
}: ComponentSchema) => {
  if (component === "prose") {
    return Type.Ref(IsomerNativeComponentsMap.prose)
  }

  if (component === "infobar") {
    return layout === "homepage" ? InfobarHomepageSchema : InfobarDefaultSchema
  }

  if (component === "column") {
    return layout === "homepage" ? ColumnHomepageSchema : ColumnDefaultSchema
  }

  if (component === "accordion") {
    return accordionEditor === "container"
      ? AccordionContainerEditorSchema
      : AccordionProseEditorSchema
  }

  return IsomerComplexComponentsMap[component]
}

export const getComponentSchema = ({
  component,
  layout,
  accordionEditor,
}: ComponentSchema): TSchema => {
  return {
    ...generateComponentSchema({ component, layout, accordionEditor }),
    ...componentSchemaDefinitions,
  }
}
