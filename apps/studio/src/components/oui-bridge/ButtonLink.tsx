import type { LinkProps } from "react-aria-components"
import { type ButtonVariantProps, buttonStyles } from "@opengovsg/oui-theme"
import { Link, composeRenderProps } from "react-aria-components"

/**
 * Bridge for a polymorphic `Button as={NextLink} href=...` — a navigational link that
 * looks like a Button, which OUI's (non-polymorphic) Button can't express. A react-aria
 * Link styled with OUI `buttonStyles`; client-side nav comes from the app's RouterProvider.
 */
type ButtonLinkProps = LinkProps & ButtonVariantProps & { title?: string }

export const ButtonLink = ({
  variant,
  color,
  size,
  radius,
  isIconOnly,
  layout,
  className,
  ...props
}: ButtonLinkProps) => (
  <Link
    {...props}
    className={composeRenderProps(className, (cn, renderProps) =>
      buttonStyles({
        variant,
        color,
        size,
        radius,
        isIconOnly,
        layout,
        className: cn,
        ...renderProps,
      }),
    )}
  />
)
