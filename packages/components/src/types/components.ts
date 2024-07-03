import type {
  AccordionProps,
  ButtonProps,
  CalloutProps,
  CardsProps,
  DividerProps,
  HeadingProps,
  HeroProps,
  IframeProps,
  ImageProps,
  InfobarProps,
  InfoCardsProps,
  InfoColsProps,
  InfopicProps,
  KeyStatisticsProps,
  OrderedListProps,
  ParagraphProps,
  TableProps,
  UnorderedListProps,
} from "~/interfaces";

type IsomerComponentProps =
  | AccordionProps
  | ButtonProps
  | CalloutProps
  | CardsProps
  | DividerProps
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
  | UnorderedListProps;

export type IsomerComponent = IsomerComponentProps & {
  sectionIdx?: number;
  indexable?: string[];
};
