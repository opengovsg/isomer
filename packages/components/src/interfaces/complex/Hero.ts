export interface HeroHeadingProps {
  title: string;
  subtitle?: string;
}

export interface HeroButtonsProps {
  buttonLabel?: string;
  buttonUrl?: string;
  secondaryButtonLabel?: string;
  secondaryButtonUrl?: string;
}

export interface HeroKeyHighlightProps {
  keyHighlights?: {
    title: string;
    description: string;
    url: string;
  }[];
}

export interface HeroDropdownProps {
  title?: string;
  options: {
    title: string;
    url: string;
  }[];
}

export interface HeroBackgroundImageProps {
  backgroundUrl: string;
}

export interface HeroInfoboxProps extends HeroHeadingProps, HeroButtonsProps {
  alignment?: "left" | "right";
  backgroundColor?: "black" | "white" | "gray";
  size?: "sm" | "md";
  dropdown?: HeroDropdownProps;
}

export interface HeroSideProps
  extends HeroInfoboxProps,
    HeroBackgroundImageProps,
    HeroKeyHighlightProps {
  variant: "side";
}

export interface HeroImageProps
  extends HeroBackgroundImageProps,
    HeroKeyHighlightProps {
  variant: "image";
  dropdown?: HeroDropdownProps;
}

export interface HeroFloatingProps
  extends HeroInfoboxProps,
    HeroBackgroundImageProps,
    HeroKeyHighlightProps {
  variant: "floating";
}

export interface HeroCenterProps
  extends HeroHeadingProps,
    HeroButtonsProps,
    HeroBackgroundImageProps,
    HeroKeyHighlightProps {
  variant: "center";
  dropdown?: HeroDropdownProps;
}

export interface HeroGradientProps
  extends HeroHeadingProps,
    HeroButtonsProps,
    HeroBackgroundImageProps {
  variant: "gradient";
  alignment?: "left" | "right";
}

export interface HeroSplitProps
  extends HeroHeadingProps,
    HeroButtonsProps,
    HeroBackgroundImageProps {
  variant: "split";
  alignment?: "left" | "right";
  backgroundColor?: "black" | "white";
}

export interface HeroCopyLedProps
  extends HeroHeadingProps,
    HeroButtonsProps,
    Partial<HeroBackgroundImageProps>,
    HeroKeyHighlightProps {
  variant: "copyled";
}

export interface HeroFloatingImageProps
  extends HeroHeadingProps,
    HeroButtonsProps,
    HeroBackgroundImageProps,
    HeroKeyHighlightProps {
  variant: "floatingimage";
}

export type HeroProps = {
  type: "hero";
} & (
  | HeroSideProps
  | HeroImageProps
  | HeroFloatingProps
  | HeroCenterProps
  | HeroGradientProps
  | HeroSplitProps
  | HeroCopyLedProps
  | HeroFloatingImageProps
);
