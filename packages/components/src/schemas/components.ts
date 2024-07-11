import {
  AccordionSchema,
  ButtonSchema,
  CalloutSchema,
  DividerSchema,
  HeadingSchema,
  HeroSchema,
  IframeSchema,
  ImageSchema,
  InfobarSchema,
  InfoCardsSchema,
  InfoColsSchema,
  InfopicSchema,
  KeyStatisticsSchema,
  OrderedListSchema,
  ParagraphSchema,
  ProseSchema,
  TableSchema,
  UnorderedListSchema,
} from "~/interfaces"

export const IsomerComplexComponentsMap = {
  accordion: AccordionSchema,
  button: ButtonSchema,
  callout: CalloutSchema,
  hero: HeroSchema,
  iframe: IframeSchema,
  image: ImageSchema,
  infobar: InfobarSchema,
  infocards: InfoCardsSchema,
  infocols: InfoColsSchema,
  infopic: InfopicSchema,
  keystatistics: KeyStatisticsSchema,
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
