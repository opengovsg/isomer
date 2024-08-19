import React, { forwardRef } from "react"
import { composeRenderProps } from "react-aria-components"
import {
  BiChevronLeft,
  BiChevronRight,
  BiDotsHorizontalRounded,
} from "react-icons/bi"

import type { ButtonProps } from "../Button"
import { tv } from "~/lib/tv"
import { dataAttr } from "~/utils/rac"
import { Button } from "../Button"

const createPaginationStyles = tv({
  slots: {
    nav: "flex",
    content: "flex flex-row flex-wrap items-center gap-3",
    button:
      "prose-caption-1 min-h-0 rounded-none px-2.5 py-1 tabular-nums current:bg-base-content-subtle current:text-white hover:bg-base-canvas-backdrop hover:current:bg-base-content-subtle",
    item: "flex cursor-pointer select-none",
    stepper: "flex items-center justify-center gap-1 px-0 py-1",
    separator: "flex h-6 w-6 items-center justify-center text-gray-500",
  },
  variants: {
    isDisabled: {
      true: {
        stepper: "text-gray-100",
      },
    },
  },
})

const { button, nav, content, item, stepper, separator } =
  createPaginationStyles()

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={nav({ className })}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul ref={ref} className={content({ className })} {...props} />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={item({ className })} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationButtonProps = {
  isActive?: boolean
} & ButtonProps

const PaginationButton = forwardRef<HTMLButtonElement, PaginationButtonProps>(
  ({ className, isActive, size, ...props }, ref) => (
    <Button
      {...props}
      ref={ref}
      aria-current={isActive ? "page" : undefined}
      data-current={dataAttr(isActive)}
      variant="unstyled"
      size={size}
      className={composeRenderProps(className, (className, renderProps) =>
        button({
          className,
          ...renderProps,
        }),
      )}
    />
  ),
)
PaginationButton.displayName = "PaginationButton"

const PaginationPrevious = (
  props: React.ComponentProps<typeof PaginationButton>,
) => (
  <PaginationButton
    aria-label="Go to previous page"
    className={stepper({ isDisabled: props.isDisabled })}
    {...props}
  >
    <BiChevronLeft className="h-6 w-6" />
    <span className="sr-only">Previous</span>
  </PaginationButton>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = (
  props: React.ComponentProps<typeof PaginationButton>,
) => (
  <PaginationButton
    aria-label="Go to next page"
    className={stepper({ isDisabled: props.isDisabled })}
    {...props}
  >
    <span className="sr-only">Next</span>
    <BiChevronRight className="h-6 w-6" />
  </PaginationButton>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span aria-hidden className={separator({ className })} {...props}>
    <BiDotsHorizontalRounded />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
}
