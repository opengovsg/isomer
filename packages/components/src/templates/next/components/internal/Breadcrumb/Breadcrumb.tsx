import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react"
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

type BaseBreadcrumbsProps = ComponentPropsWithoutRef<"div"> & {
  children: ReactNode
}

function BaseBreadcrumbs({
  className,
  children,
  "aria-label": ariaLabel = "Breadcrumb",
  ...props
}: BaseBreadcrumbsProps) {
  return (
    <div
      {...props}
      aria-label={ariaLabel}
      role="navigation"
      className={twMerge("flex flex-wrap gap-1", className)}
    >
      <ol className="m-0 flex list-none flex-wrap items-center gap-1 p-0">
        {children}
      </ol>
    </div>
  )
}

type BaseBreadcrumbProps = LinkProps & {
  LinkComponent?: ElementType
  colorScheme?: "default" | "inverse"
}

function BaseBreadcrumb({
  LinkComponent,
  colorScheme,
  children,
  label,
  className,
  href,
  ...linkProps
}: BaseBreadcrumbProps) {
  const styles = createBreadcrumbLinkStyles({ colorScheme })
  const mergedLinkClassName = twMerge(styles.link(), className)

  return (
    <li className={styles.container()}>
      <Link
        {...linkProps}
        href={href}
        label={label}
        className={mergedLinkClassName}
        LinkComponent={LinkComponent}
      >
        {children}
      </Link>
      {href && <BiChevronRight aria-hidden="true" className={styles.icon()} />}
    </li>
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
