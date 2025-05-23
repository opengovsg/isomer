import type { PropsWithChildren } from "react"

export const Tag = (
  props: PropsWithChildren<
    React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLParagraphElement>,
      HTMLParagraphElement
    >
  >,
) => {
  return (
    <div className="w-fit items-center justify-center rounded-full bg-base-canvas-backdrop px-1.5 py-0.5 text-base-content-subtle">
      <p className="prose-label-sm-medium line-clamp-1" {...props} />
    </div>
  )
}
