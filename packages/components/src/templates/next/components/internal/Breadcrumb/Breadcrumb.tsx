"use client"

import type { ElementType } from "react"
import type {
  BreadcrumbProps as AriaBreadcrumbProps,
  BreadcrumbsProps,
} from "react-aria-components"
import {
  Breadcrumb as AriaBreadcrumb,
  Breadcrumbs as AriaBreadcrumbs,
} from "react-aria-components"
import { BiChevronRight } from "react-icons/bi"

import type { BreadcrumbProps, LinkProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { focusVisibleHighlight } from "~/utils"
import { Link } from "../Link"

const createBreadcrumbLinkStyles = tv({
  extend: focusVisibleHighlight,
  base: "",
  slots: {
    container: "flex items-center gap-1",
    link: "prose-label-md-regular line-clamp-1 underline decoration-transparent underline-offset-4 transition current:prose-label-md-medium hover:decoration-inherit current:hover:decoration-transparent",
    icon: "h-5 w-5 flex-shrink-0",
  },
  variants: {
    colorScheme: {
      default: {
        link: "text-base-content active:text-interaction-link-active current:text-base-content-medium",
        icon: "text-base-content-subtle",
      },
      inverse: {
        link: "text-base-content-inverse",
        icon: "text-base-content-inverse",
      },
    },
  },
  defaultVariants: { colorScheme: "default" },
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
  colorScheme,
  ...props
}: AriaBreadcrumbProps &
  LinkProps & {
    LinkComponent?: ElementType
    colorScheme?: "default" | "inverse"
  }) {
  const styles = createBreadcrumbLinkStyles({ colorScheme })

  return (
    <AriaBreadcrumb {...props} className={styles.container()}>
      <Link
        {...props}
        label={typeof props.children === "string" ? props.children : undefined}
        className={styles.link()}
        LinkComponent={LinkComponent}
      />
      {props.href && <BiChevronRight className={styles.icon()} />}
    </AriaBreadcrumb>
  )
}

const Breadcrumb = ({
  links,
  LinkComponent,
  colorScheme = "default",
}: BreadcrumbProps) => {
  return (
    <BaseBreadcrumbs>
      {links.map(({ title, url }, index) => (
        <BaseBreadcrumb
          colorScheme={colorScheme}
          LinkComponent={LinkComponent}
          key={index}
          current={index === links.length - 1 ? "page" : undefined}
          href={index === links.length - 1 ? undefined : url}
        >
          {title}
        </BaseBreadcrumb>
      ))}
    </BaseBreadcrumbs>
  )
}

export default Breadcrumb
