import { Type } from "@sinclair/typebox"
import { SUPPORTED_ICON_NAMES } from "~/common/icon-names"

import { ICON_PICKER_FORMAT } from "../format"

export const IconPicker = () =>
  Type.Union(
    SUPPORTED_ICON_NAMES.map((icon) =>
      Type.Literal(icon, {
        title: icon.charAt(0).toUpperCase() + icon.slice(1).replace(/-/g, " "),
      }),
    ),
    {
      title: "Column icon",
      type: "string",
      format: ICON_PICKER_FORMAT,
    },
  )
