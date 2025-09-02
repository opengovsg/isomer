import { tv } from "~/lib/tv"
import { focusRing } from "~/utils"

export const buttonStyles = tv({
  base: "box-border flex h-full w-fit cursor-pointer items-center gap-2 rounded text-center transition",
  extend: focusRing,
  variants: {
    variant: {
      solid: "",
      outline: "",
      unstyled: "",
    },
    colorScheme: {
      default: "",
      inverse: "",
    },
    isFocusVisible: {
      true: "",
    },
    isDisabled: {
      true: "cursor-not-allowed",
    },
    size: {
      sm: "prose-label-md-medium px-4 py-2.5",
      base: "prose-headline-base-medium min-h-12 px-5 py-3",
      lg: "prose-headline-lg-medium min-h-[3.25rem] px-6 py-3.5",
    },
  },
  compoundVariants: [
    {
      variant: "solid",
      colorScheme: "default",
      className:
        "bg-brand-canvas-inverse text-base-content-inverse active:bg-brand-interaction-pressed hover:bg-brand-interaction-hover hover:text-base-content-inverse",
    },
    {
      variant: "solid",
      colorScheme: "inverse",
      className:
        "bg-base-canvas text-base-content hover:bg-base-canvas-backdrop",
    },
    {
      variant: "outline",
      colorScheme: "inverse",
      className:
        "border border-base-divider-inverse text-base-content-inverse hover:bg-base-canvas-inverse-overlay/40 hover:text-base-content-inverse",
    },
    {
      variant: "outline",
      colorScheme: "default",
      className:
        "border border-brand-canvas-inverse text-brand-canvas-inverse hover:bg-base-canvas-backdrop",
    },
    {
      variant: "outline",
      size: "lg",
      // -1 px for border
      className: "px-[23px] py-[13px]",
    },
    {
      variant: "outline",
      size: "base",
      // -1 px for border
      className: "px-[19px] py-[11px]",
    },
    {
      variant: "solid",
      isFocusVisible: true,
      className:
        "bg-utility-highlight text-base-content-strong transition-none",
    },
    {
      variant: "outline",
      isFocusVisible: true,
      className:
        "bg-utility-highlight text-base-content-strong transition-none",
    },
  ],
  defaultVariants: {
    variant: "solid",
    colorScheme: "default",
    size: "base",
  },
})

export const buttonIconStyles = tv({
  base: "h-auto flex-shrink-0",
  variants: {
    size: {
      sm: "w-3.5 lg:w-4",
      base: "w-3.5 lg:w-4",
      lg: "w-4.5 lg:w-5",
    },
  },
  defaultVariants: {
    size: "base",
  },
})
