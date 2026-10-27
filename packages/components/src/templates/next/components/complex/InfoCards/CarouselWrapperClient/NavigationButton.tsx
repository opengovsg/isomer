import type { ComponentProps } from "react"
import type { IconType } from "react-icons"
import { forwardRef } from "react"

type NavigationButtonProps = Pick<
  ComponentProps<"button">,
  "aria-label" | "disabled" | "onClick"
> & {
  Icon: IconType
}

export const NavigationButton = forwardRef<
  HTMLButtonElement,
  NavigationButtonProps
>(function NavigationButton({ Icon, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className="flex size-10 items-center justify-center rounded-full border border-base-content-strong bg-base-canvas text-base-content-strong focus-visible:bg-utility-highlight focus-visible:text-base-content-strong focus-visible:outline-0 disabled:cursor-not-allowed disabled:border-base-divider-medium disabled:text-base-content-subtle [@media(pointer:coarse)]:size-11"
      {...rest}
    >
      <Icon aria-hidden className="size-6" />
    </button>
  )
})
