import type { DividerProps } from "~/interfaces"

import {
  contentBlockIndexAttr,
  type ContentBlockIndexProps,
} from "../../../render/contentBlockIndex"

export const Divider = ({
  contentBlockIndex,
}: DividerProps & ContentBlockIndexProps) => {
  return (
    <hr
      className="my-6 bg-divider-medium"
      {...contentBlockIndexAttr(contentBlockIndex)}
    />
  )
}
