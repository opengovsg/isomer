import { tv } from "~/lib/tv"
import { focusRing } from "~/utils/tailwind"

export const buttonStyles = tv({
  base: "box-border flex h-full w-fit cursor-pointer items-center gap-2 rounded text-center transition",
  compoundVariants: [
    {
      className:
        "bg-brand-canvas-inverse text-base-content-inverse active:bg-brand-interaction-pressed hover:bg-brand-interaction-hover hover:text-base-content-inverse",
      colorScheme: "default",
      variant: "solid",
    },
    {
      className:
        "bg-base-canvas text-base-content hover:bg-base-canvas-backdrop",
      colorScheme: "inverse",
      variant: "solid",
    },
    {
      className:
        "border border-base-divider-inverse text-base-content-inverse hover:bg-base-canvas-inverse-overlay/40 hover:text-base-content-inverse",
      colorScheme: "inverse",
      variant: "outline",
    },
    {
      className:
        "border border-brand-canvas-inverse bg-base-canvas text-brand-canvas-inverse hover:bg-base-canvas-backdrop",
      colorScheme: "default",
      variant: "outline",
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
      className:
        "bg-utility-highlight text-base-content-strong transition-none",
      isFocusVisible: true,
      variant: "solid",
    },
    {
      className:
        "bg-utility-highlight text-base-content-strong transition-none",
      isFocusVisible: true,
      variant: "outline",
    },
  ],
  defaultVariants: {
    colorScheme: "default",
    size: "base",
    variant: "solid",
  },
  extend: focusRing,
  variants: {
    colorScheme: {
      default: "",
      inverse: "",
    },
    isDisabled: {
      true: "cursor-not-allowed",
    },
    isFocusVisible: {
      true: "",
    },
    size: {
      base: "prose-headline-base-medium min-h-12 px-5 py-3",
      lg: "prose-headline-lg-medium min-h-[3.25rem] px-6 py-3.5",
      sm: "prose-label-md-medium px-4 py-2.5",
    },
    variant: {
      outline: "",
      solid: "",
      unstyled: "",
    },
  },
})

export const buttonIconStyles = tv({
  base: "h-auto flex-shrink-0",
  defaultVariants: {
    size: "base",
  },
  variants: {
    size: {
      base: "w-3.5 lg:w-4",
      lg: "w-4.5 lg:w-5",
      sm: "w-3.5 lg:w-4",
    },
  },
})
