import { PropsWithChildren } from "react"

export const Tag = (
  props: PropsWithChildren<
    React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLDivElement>,
      HTMLDivElement
    >
  >,
) => {
  return (
    <div
      className="prose-label-sm-medium flex w-fit items-center justify-center gap-2 rounded-full bg-base-canvas-backdrop px-1.5 py-0.5 text-base-content-subtle"
      {...props}
    />
  )
}
