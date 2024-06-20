import type {
  AccordionProps,
  ButtonProps,
  CalloutProps,
  CardsProps,
  DividerProps,
  HardBreakProps,
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

type IsomerComponentProps =
  | AccordionProps
  | ButtonProps
  | CalloutProps
  | CardsProps
  | DividerProps
  | HardBreakProps
  | HeadingProps
  | HeroProps
  | IframeProps
  | ImageProps
  | InfobarProps
  | InfoCardsProps
  | InfoColsProps
  | InfopicProps
  | KeyStatisticsProps
  | OrderedListProps
  | ParagraphProps
  | TableProps
  | UnorderedListProps

export type IsomerComponent = IsomerComponentProps & {
  sectionIdx?: number
  indexable?: string[]
}
