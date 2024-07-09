import type {
  AccordionProps,
  ButtonProps,
  CalloutProps,
  DividerProps,
  HeadingProps,
  HeroProps,
  IframeProps,
  ImageProps,
  InfoCardsProps,
  InfoColsProps,
  InfobarProps,
  InfopicProps,
  KeyStatisticsProps,
  OrderedListProps,
  ParagraphProps,
  TableProps,
  UnorderedListProps,
} from "~/interfaces"

export type IsomerComplexComponentProps =
  | AccordionProps
  | ButtonProps
  | CalloutProps
  | HeroProps
  | IframeProps
  | ImageProps
  | InfobarProps
  | InfoCardsProps
  | InfoColsProps
  | InfopicProps
  | KeyStatisticsProps

export type IsomerNativeComponentProps =
  | DividerProps
  | HeadingProps
  | OrderedListProps
  | ParagraphProps
  | TableProps
  | UnorderedListProps

type IsomerComponentProps =
  | IsomerComplexComponentProps
  | IsomerNativeComponentProps

export type IsomerComponent = IsomerComponentProps & {
  sectionIdx?: number
  indexable?: string[]
}
