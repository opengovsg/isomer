import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const SiteThemeSchema = Type.Object(
  {
    colors: Type.Object({
      brand: Type.Object({
        canvas: Type.Object({
          default: Type.String(),
          alt: Type.String(),
          backdrop: Type.String(),
          inverse: Type.String(),
        }),
        interaction: Type.Object({
          default: Type.String(),
          hover: Type.String(),
          pressed: Type.String(),
        }),
      }),
    }),
  },
  {
    title: "Site Theme",
    description: "Schema for the theme configuration of the site.",
  },
)

export type IsomerSiteThemeProps = Static<typeof SiteThemeSchema>
