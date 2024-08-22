import type { ElementType } from "react"
import type {
  BreadcrumbProps as AriaBreadcrumbProps,
  BreadcrumbsProps,
  LinkProps,
} from "react-aria-components"
import {
  Breadcrumb as AriaBreadcrumb,
  Breadcrumbs as AriaBreadcrumbs,
  composeRenderProps,
} from "react-aria-components"
import { BiChevronRight } from "react-icons/bi"

import type { BreadcrumbProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { focusRing } from "~/utils/focusRing"
import { Link } from "../Link"

const breadcrumbLinkStyles = tv({
  extend: focusRing,
  base: "prose-label-md-regular line-clamp-1 text-base-content underline decoration-transparent underline-offset-4 transition current:prose-label-md-medium active:text-interaction-link-active current:text-base-content-medium hover:decoration-inherit current:hover:decoration-transparent",
})

function BaseBreadcrumbs<T extends object>(props: BreadcrumbsProps<T>) {
  return (
    <AriaBreadcrumbs
      {...props}
      className={twMerge("flex flex-wrap gap-1", props.className)}
    />
  )
}

function BaseBreadcrumb({
  LinkComponent,
  ...props
}: AriaBreadcrumbProps & LinkProps & { LinkComponent?: ElementType }) {
  return (
    <AriaBreadcrumb {...props} className="flex items-center gap-1">
      <Link
        {...props}
        title={typeof props.children === "string" ? props.children : undefined}
        className={composeRenderProps(
          props.className,
          (className, renderProps) =>
            breadcrumbLinkStyles({
              className,
              ...renderProps,
            }),
        )}
        LinkComponent={LinkComponent}
      />
      {props.href && (
        <BiChevronRight className="h-5 w-5 flex-shrink-0 text-base-content-subtle" />
      )}
    </AriaBreadcrumb>
  )
}

const Breadcrumb = ({ links, LinkComponent = "a" }: BreadcrumbProps) => {
  return (
    <BaseBreadcrumbs>
      {links.map(({ title, url }, index) => (
        <BaseBreadcrumb
          LinkComponent={LinkComponent}
          key={index}
          aria-current={index === links.length - 1 ? "page" : undefined}
          href={index === links.length - 1 ? undefined : url}
        >
          {title}
        </BaseBreadcrumb>
      ))}
    </BaseBreadcrumbs>
  )
}

export default Breadcrumb
