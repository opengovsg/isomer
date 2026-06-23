import { useContext } from "react"
import { BlockConfigContext } from "../BlockConfigContext"

// Mirrors @opengovsg/isomer-components internal Button/LinkButton styles
function getButtonClasses(variant: string, size: string) {
  const base =
    "box-border inline-flex w-fit cursor-pointer items-center gap-2 rounded text-center transition"

  const sizeClass: Record<string, string> = {
    sm: "prose-label-md-medium px-4 py-2.5",
    base: "prose-headline-base-medium min-h-12 px-5 py-3",
    lg: "prose-headline-lg-medium min-h-[3.25rem] px-6 py-3.5",
  }

  const variantClass: Record<string, string> = {
    solid:
      "bg-brand-canvas-inverse text-base-content-inverse hover:bg-brand-interaction-hover active:bg-brand-interaction-pressed",
    outline:
      "border border-brand-canvas-inverse bg-base-canvas text-brand-canvas-inverse hover:bg-base-canvas-backdrop px-[19px] py-[11px]",
  }

  return [base, sizeClass[size] ?? sizeClass.base, variantClass[variant] ?? variantClass.solid].join(" ")
}

export default function SingleButton() {
  const { configs } = useContext(BlockConfigContext)
  // Block may be mounted as either ID — read from whichever has config
  const cfg = configs["single-button-article"] ?? configs["single-button-content"] ?? {}
  const variant = cfg.variant ?? "solid"
  const size = cfg.size ?? "base"
  const label = cfg.label ?? "Find out more"

  return (
    <div className="my-6">
      <button className={getButtonClasses(variant, size)}>
        {label}
      </button>
    </div>
  )
}
