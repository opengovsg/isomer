import type { ComponentPropsWithoutRef, ReactNode } from "react"
import type { BreadcrumbProps, LinkProps } from "~/interfaces"
import { BiChevronRight } from "react-icons/bi"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { focusVisibleHighlight } from "~/utils/tailwind"
import { hasNonEmptyString } from "~/utils/truthiness"

import { Link } from "../Link"

const createBreadcrumbLinkStyles = tv({
  base: "",
  defaultVariants: { colorScheme: "default" },
  extend: focusVisibleHighlight,
  slots: {
    container: "flex items-center gap-1",
    icon: "h-5 w-5 flex-shrink-0",
    link: "prose-label-md-regular line-clamp-1 underline decoration-transparent underline-offset-4 transition current:prose-label-md-medium hover:decoration-inherit current:hover:decoration-transparent",
  },
  variants: {
    colorScheme: {
      default: {
        icon: "text-base-content-subtle",
        link: "text-base-content active:text-interaction-link-active current:text-base-content-medium",
      },
      inverse: {
        icon: "text-base-content-inverse",
        link: "text-base-content-inverse",
      },
    },
  },
})

type BaseBreadcrumbsProps = ComponentPropsWithoutRef<"div"> & {
  children: ReactNode
}

const BaseBreadcrumbs = ({
  className,
  children,
  "aria-label": ariaLabel = "Breadcrumb",
  ...props
}: BaseBreadcrumbsProps) => (
  <nav
    {...props}
    aria-label={ariaLabel}
    className={twMerge("flex flex-wrap gap-1", className)}
  >
    <ol className="m-0 flex list-none flex-wrap items-center gap-1 p-0">
      {children}
    </ol>
  </nav>
)

type BaseBreadcrumbProps = LinkProps & {
  colorScheme?: "default" | "inverse"
}

const BaseBreadcrumb = ({
  colorScheme,
  children,
  label,
  className,
  href,
  ...linkProps
}: BaseBreadcrumbProps) => {
  const styles = createBreadcrumbLinkStyles({ colorScheme })
  const mergedLinkClassName = twMerge(styles.link(), className)

  return (
    <li className={styles.container()}>
      <Link
        {...linkProps}
        href={href}
        label={label}
        className={mergedLinkClassName}
        isWithFocusVisibleHighlight
      >
        {children}
      </Link>
      {hasNonEmptyString(href) && (
        <BiChevronRight aria-hidden="true" className={styles.icon()} />
      )}
    </li>
  )
}

export const Breadcrumb = ({
  links,
  colorScheme = "default",
}: BreadcrumbProps) => {
  const lastLink = links.at(-1)

  return (
    <BaseBreadcrumbs>
      {links.map(({ title, url }) => (
        <BaseBreadcrumb
          colorScheme={colorScheme}
          key={`${title}-${url}`}
          current={url === lastLink?.url ? "page" : undefined}
          href={url === lastLink?.url ? undefined : url}
        >
          {title}
        </BaseBreadcrumb>
      ))}
    </BaseBreadcrumbs>
  )
}
