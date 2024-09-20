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
 * Original file: https://github.com/adobe/react-spectrum/blob/63a2ff648edbd4a5e41827b087701237e63eca83/packages/react-aria-components/src/utils.tsx
 * Original file license: Apache-2.0
 */

import type { CSSProperties, ReactNode } from "react"
import { useMemo } from "react"

interface RenderPropsHookOptions<T> {
  /** The CSS [className](https://developer.mozilla.org/en-US/docs/Web/API/Element/className) for the element. A function may be provided to compute the class based on component state. */
  className?:
    | string
    | ((values: T & { defaultClassName: string | undefined }) => string)
  /** The inline [style](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style) for the element. A function may be provided to compute the style based on component state. */
  style?:
    | CSSProperties
    | ((values: T & { defaultStyle: CSSProperties }) => CSSProperties)
  values: T
  defaultChildren?: ReactNode
  defaultClassName?: string
  defaultStyle?: CSSProperties
  /** The children of the component. A function may be provided to alter the children based on component state. */
  children?:
    | ReactNode
    | ((values: T & { defaultChildren: ReactNode | undefined }) => ReactNode)
}

export function useRenderProps<T>(props: RenderPropsHookOptions<T>) {
  const {
    className,
    style,
    children,
    defaultClassName = undefined,
    defaultChildren = undefined,
    defaultStyle,
    values,
  } = props

  return useMemo(() => {
    let computedClassName: string | undefined
    let computedStyle: React.CSSProperties | undefined
    let computedChildren: React.ReactNode | undefined

    if (typeof className === "function") {
      computedClassName = className({ ...values, defaultClassName })
    } else {
      computedClassName = className
    }

    if (typeof style === "function") {
      computedStyle = style({ ...values, defaultStyle: defaultStyle ?? {} })
    } else {
      computedStyle = style
    }

    if (typeof children === "function") {
      computedChildren = children({ ...values, defaultChildren })
    } else if (children == null) {
      computedChildren = defaultChildren
    } else {
      computedChildren = children
    }

    return {
      className: computedClassName ?? defaultClassName,
      style:
        (computedStyle ?? defaultStyle)
          ? { ...defaultStyle, ...computedStyle }
          : undefined,
      children: computedChildren ?? defaultChildren,
      "data-rac": "",
    }
  }, [
    className,
    style,
    children,
    defaultClassName,
    defaultChildren,
    defaultStyle,
    values,
  ])
}
