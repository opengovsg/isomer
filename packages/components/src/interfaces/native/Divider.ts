import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const DividerSchema = Type.Object(
  {
    type: Type.Literal("divider", { default: "divider" }),
  },
  {
    $id: "components-native-divider",
    description:
      "A horizontal rule that serves as a divider to separate content",
    title: "Divider component",
  },
)

export type DividerProps = Static<typeof DividerSchema>
