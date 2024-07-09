export interface CustomRendererProps {
  data: any
  rootSchema: any
  handleChange(path: string, value: any): void
  path: string
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
  | "formsg"
