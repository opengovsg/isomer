import type { Static } from "@sinclair/typebox"
import type { LinkComponentType } from "~/types"
import { Type } from "@sinclair/typebox"

export const AntiScamDisclaimerBannerSchema = Type.Object(
  {
    type: Type.Literal("antiscamdisclaimerbanner", {
      default: "antiscamdisclaimerbanner",
    }),
  },
  {
    title: "Anti-scam disclaimer banner",
  },
)

export type AntiScamDisclaimerBannerProps = Static<
  typeof AntiScamDisclaimerBannerSchema
> & {
  LinkComponent?: LinkComponentType
}
