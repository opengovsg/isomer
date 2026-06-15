import type { LinkVariantProps } from "@opengovsg/oui-theme"
import type { ButtonProps } from "react-aria-components"
import { Spinner } from "@opengovsg/oui"
import { cn, linkStyles } from "@opengovsg/oui-theme"
import { Button, composeRenderProps } from "react-aria-components"

interface LinkButtonProps extends ButtonProps, LinkVariantProps {}

/**
 * Bridge for design-system-react's `Button variant="link"`, which OUI's Button has no
 * equivalent for. A react-aria Button styled with OUI's `linkStyles` (the same recipe
 * OUI's Link uses) — i.e. a link-looking control for onPress actions, not navigation.
 * Supports `isPending` (DS `isLoading`) with a leading spinner.
 */
export const LinkButton = ({
  children,
  isPending,
  color,
  radius,
  isFocusVisible,
  ...props
}: LinkButtonProps) => {
  return (
    <Button
      {...props}
      isPending={isPending}
      className={composeRenderProps(props.className, (className, renderProps) =>
        linkStyles({
          color,
          radius,
          className: cn(
            "flex-row flex gap-2 items-center underline w-fit",
            className,
          ),
          ...renderProps,
          isFocusVisible: isFocusVisible ?? renderProps.isFocusVisible,
        }),
      )}
    >
      {composeRenderProps(children, (resolved) => (
        <>
          {/* Keep the label visible while pending (unlike OUI's Button, which
            hides children); show a leading spinner alongside it. */}
          {isPending ? <Spinner size="xs" /> : null}
          {resolved}
        </>
      ))}
    </Button>
  )
}
