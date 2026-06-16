import { Type } from "@sinclair/typebox"

export const AntiScamDisclaimerBannerSchema = Type.Object(
  {
    type: Type.Literal("antiscambanner", {
      default: "antiscambanner",
    }),
  },
  {
    title: "Anti-scam disclaimer",
  },
)
