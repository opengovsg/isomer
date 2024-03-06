export interface HeroHeadingProps {
  title: string
  subtitle?: string
}

export interface HeroButtonProps {
  buttonLabel?: string
  buttonUrl?: string
}

export interface HeroKeyHighlightProps {
  title: string
  description: string
  url: string
}

export interface HeroDropdownProps {
  title?: string
  options: Array<{
    title: string
    url: string
  }>
}

export interface HeroInfoboxProps extends HeroHeadingProps, HeroButtonProps {
  alignment?: "left" | "right"
  backgroundColor?: "black" | "white" | "gray"
  size?: "sm" | "md"
  dropdown?: HeroDropdownProps
}

export interface HeroCommonProps {
  backgroundUrl: string
  keyHighlights?: Array<HeroKeyHighlightProps>
}

export interface HeroSideProps extends HeroInfoboxProps, HeroCommonProps {
  variant: "side"
}

export interface HeroImageProps extends HeroCommonProps {
  variant: "image"
  dropdown?: HeroDropdownProps
}

export interface HeroFloatingProps extends HeroInfoboxProps, HeroCommonProps {
  variant: "floating"
}

export interface HeroCenterProps
  extends HeroHeadingProps,
    HeroButtonProps,
    HeroCommonProps {
  variant: "center"
  dropdown?: HeroDropdownProps
}

export type HeroProps =
  | HeroSideProps
  | HeroImageProps
  | HeroFloatingProps
  | HeroCenterProps

export default HeroProps
