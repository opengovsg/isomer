import type {
  AccordionProps,
  ButtonProps,
  CalloutProps,
  CardsProps,
  CollectionCardProps,
  ContentProps,
  FooterProps,
  HeaderProps,
  HeadingProps,
  HeroProps,
  ImageProps,
  InfoCardsProps,
  InfoColsProps,
  InfobarProps,
  InfopicProps,
  KeyStatisticsProps,
  MastheadProps,
  NavbarProps,
  NotificationProps,
  OrderedListProps,
  ParagraphProps,
  SearchProps,
  SidePaneProps,
  TableProps,
  UnorderedListProps,
} from "~/common"

type IsomerComponentProps =
  | AccordionProps
  | ButtonProps
  | CalloutProps
  | CollectionCardProps
  | CardsProps
  | ContentProps
  | FooterProps
  | HeadingProps
  | HeaderProps
  | HeroProps
  | ImageProps
  | InfobarProps
  | InfoCardsProps
  | InfoColsProps
  | InfopicProps
  | KeyStatisticsProps
  | MastheadProps
  | NavbarProps
  | OrderedListProps
  | ParagraphProps
  | SearchProps
  | SidePaneProps
  | TableProps
  | UnorderedListProps
  | NotificationProps

export type IsomerComponent = IsomerComponentProps & {
  sectionIdx?: number
  indexable?: string[]
}
