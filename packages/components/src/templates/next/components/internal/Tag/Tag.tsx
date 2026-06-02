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
    <div className="bg-base-canvas-backdrop text-base-content-subtle w-fit items-center justify-center rounded-full px-1.5 py-0.5">
      <p className="prose-label-sm-medium line-clamp-1" {...props} />
    </div>
  )
}
