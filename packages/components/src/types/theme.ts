import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const SiteThemeSchema = Type.Object(
  {
    colors: Type.Object({
      brand: Type.Object({
        canvas: Type.Object({
          default: Type.String({ format: "hidden" }),
          alt: Type.String({ format: "hidden" }),
          backdrop: Type.String({ format: "hidden" }),
          inverse: Type.String({
            title: "Main brand colour",
            description:
              "Enter a hex code of a colour that best represents your brand. If you have a design system or branding guide, this might be your primary colour.",
            format: "color-picker",
          }),
        }),
        interaction: Type.Object({
          default: Type.String({ format: "hidden" }),
          hover: Type.String({ format: "hidden" }),
          pressed: Type.String({ format: "hidden" }),
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
