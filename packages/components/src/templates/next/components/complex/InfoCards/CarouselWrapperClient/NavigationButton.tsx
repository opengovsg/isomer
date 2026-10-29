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
      className="flex size-12 items-center justify-center rounded-full border-[1.5px] border-brand-interaction bg-base-canvas text-brand-interaction enabled:hover:bg-brand-canvas focus-visible:bg-utility-highlight focus-visible:text-base-content-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-base-content-strong disabled:cursor-not-allowed disabled:border-base-divider-medium disabled:text-base-content-subtle"
      {...rest}
    >
      <Icon aria-hidden className="size-6" />
    </button>
  )
})
