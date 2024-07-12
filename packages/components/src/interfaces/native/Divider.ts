import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const DividerSchema = Type.Object(
  {
    type: Type.Literal("divider"),
  },
  {
    $id: "components-native-divider",
    title: "Divider component",
    description:
      "A horizontal rule that serves as a divider to separate content",
  },
)

export type DividerProps = Static<typeof DividerSchema>
