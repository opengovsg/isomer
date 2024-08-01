import type { ElementType } from "react"
import type {
  LinkProps as BaseLinkProps,
  ContextValue,
} from "react-aria-components"
import { createContext, forwardRef } from "react"
import { mergeProps, useFocusRing, useHover, useLink } from "react-aria"
import { useContextProps } from "react-aria-components"

import { useRenderProps } from "./utils"

export interface LinkProps extends BaseLinkProps {
  LinkComponent?: ElementType
  "aria-current"?: string
}

const LinkContext =
  createContext<ContextValue<LinkProps, HTMLAnchorElement>>(null)

/**
 * Modified version of `react-aria-component`'s Link component to accept a `LinkComponent` prop.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>((_props, _ref) => {
  const [props, ref] = useContextProps(_props, _ref, LinkContext)

  const ElementType: ElementType = props.href ? "a" : "span"
  const { linkProps, isPressed } = useLink(
    { ...props, elementType: ElementType },
    ref,
  )

  const { hoverProps, isHovered } = useHover(props)
  const { focusProps, isFocused, isFocusVisible } = useFocusRing()

  const renderProps = useRenderProps({
    ...props,
    defaultClassName: "react-aria-Link",
    values: {
      isCurrent: !!props["aria-current"],
      isDisabled: props.isDisabled || false,
      isPressed,
      isHovered,
      isFocused,
      isFocusVisible,
    },
  })

  const ElementToRender = props.href ? props.LinkComponent ?? "a" : "span"

  return (
    <ElementToRender
      ref={ref}
      slot={props.slot ?? undefined}
      {...mergeProps(renderProps, linkProps, hoverProps, focusProps)}
      data-focused={isFocused || undefined}
      data-hovered={isHovered || undefined}
      data-pressed={isPressed || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-current={!!props["aria-current"] || undefined}
      data-disabled={props.isDisabled || undefined}
    >
      {renderProps.children}
    </ElementToRender>
  )
})
