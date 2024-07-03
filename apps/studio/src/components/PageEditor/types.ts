export interface CustomRendererProps {
  data: unknown;
  rootSchema: unknown;
  handleChange(path: string, value: unknown): void;
  path: string;
}

export type SectionType =
  | "paragraph"
  | "image"
  | "statistics"
  | "callout"
  | "textWithButton"
  | "textWithImage"
  | "cards"
  | "columns"
  | "accordion"
  | "divider"
  | "youtube"
  | "googleMaps"
  | "formsg";
