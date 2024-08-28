"use client"

/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 *
 * Original file: https://github.com/adobe/react-spectrum/blob/d6d5bc03cf6cb39d37b2a9e2de201f950b0d8994/packages/react-aria-components/src/Link.tsx
 * Original file license: Apache-2.0
 *
 * This is a modified version of the original file.
 */
import type { ElementType } from "react"
import type {
  LinkProps as AriaLinkProps,
  ContextValue,
} from "react-aria-components"
import type { VariantProps } from "tailwind-variants"
import { createContext, forwardRef } from "react"
import { mergeProps, useFocusRing, useHover, useLink } from "react-aria"
import { composeRenderProps, useContextProps } from "react-aria-components"

import { tv } from "~/lib/tv"
import { focusRing } from "~/utils/focusRing"
import { focusVisibleHighlight } from "~/utils/rac"
import { useRenderProps } from "./utils"

interface BaseLinkProps extends AriaLinkProps {
  LinkComponent?: ElementType
  "aria-current"?: string
  "aria-hidden"?: boolean
  tabIndex?: number
  title?: string
  isExternal?: boolean
}

const LinkContext =
  createContext<ContextValue<BaseLinkProps, HTMLAnchorElement>>(null)

/**
 * Modified version of `react-aria-component`'s Link component to accept a `LinkComponent` prop.
 */
const BaseLink = forwardRef<HTMLAnchorElement, BaseLinkProps>(
  ({ title, isExternal, tabIndex, ..._props }, _ref) => {
    const [props, ref] = useContextProps(_props, _ref, LinkContext)

    const extraLinkProps = isExternal
      ? { target: "_blank", rel: "noopener nofollow" }
      : {}

    const ElementType: ElementType = props.href ? "a" : "span"
    const { linkProps, isPressed } = useLink(
      { ...extraLinkProps, ...props, elementType: ElementType },
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
        title={title}
        ref={ref}
        slot={props.slot ?? undefined}
        {...mergeProps(renderProps, linkProps, hoverProps, focusProps)}
        tabIndex={tabIndex}
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
  },
)

const linkStyles = tv({
  extend: focusRing,
  base: "",
  variants: {
    showExternalIcon: {
      true: `after:content-['_↗']`,
    },
  },
})

const fvHighlightLinkStyles = tv({
  extend: focusVisibleHighlight,
  base: "text-link",
  variants: {
    showExternalIcon: {
      true: `after:content-['_↗']`,
    },
    isHovered: {
      true: "text-link-hover",
    },
  },
})

export interface LinkProps
  extends BaseLinkProps,
    VariantProps<typeof linkStyles> {
  withFocusVisibleHighlight?: boolean
}

export function Link({
  showExternalIcon,
  withFocusVisibleHighlight,
  ...props
}: LinkProps) {
  return (
    <BaseLink
      {...props}
      className={composeRenderProps(
        props.className,
        (className, renderProps) =>
          withFocusVisibleHighlight
            ? fvHighlightLinkStyles({
                ...renderProps,
                showExternalIcon,
                className,
              })
            : linkStyles({
                ...renderProps,
                showExternalIcon,
                className,
              }),
      )}
    />
  )
}
