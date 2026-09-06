import type { HTMLAttributes, ReactNode } from "react"
import { createElement } from "react"

import { getHeadingTag } from "./getHeadingTag"

export type DynamicHeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level: number
  children?: ReactNode
}

export const DynamicHeading = ({
  level,
  children,
  ...props
}: DynamicHeadingProps) => createElement(getHeadingTag(level), props, children)
