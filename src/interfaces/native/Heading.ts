import type { TextProps } from "./Text"

// excludes 1 as it should only be used for the page title i.e ContentPageHeader
export const HeadingLevels = [2, 3, 4, 5, 6] as const
export type HeadingLevel = (typeof HeadingLevels)[number]

export interface HeadingProps {
  type: "heading"
  id: string // Used for anchor links
  content: TextProps[]
  level: HeadingLevel
}
