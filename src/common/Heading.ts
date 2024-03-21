export const HeadingLevels = [1, 2, 3, 4, 5, 6] as const
export type HeadingLevel = (typeof HeadingLevels)[number]

export interface HeadingProps {
  type: "heading"
  id: string // Used for anchor links
  content: string
  level: HeadingLevel
}

export default HeadingProps
