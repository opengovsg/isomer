import { PropsWithChildren } from "react"

export const Tag = (
  props: PropsWithChildren<
    React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLParagraphElement>,
      HTMLParagraphElement
    >
  > & { isActive?: boolean },
) => {
  return (
    <div
      className={`flex w-fit items-center justify-center gap-2 rounded-full bg-base-canvas-backdrop px-1.5 py-0.5 text-base-content-subtle ${
        props.isActive ? "bg-red-500 text-white" : ""
      } `}
    >
      <p className="prose-label-sm-medium line-clamp-1" {...props} />
    </div>
  )
}
