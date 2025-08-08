import type { Static } from "@sinclair/typebox"
import type { Simplify } from "type-fest"
import { Type } from "@sinclair/typebox"

import type { ImageClientProps } from "./Image"
import type { LocalSearchProps } from "./LocalSearchInputBox"
import type { SearchSGInputBoxProps } from "./SearchSGInputBox"
import type {
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
  ScriptComponentType,
} from "~/types"

const NavbarItemSchema = Type.Object({
  name: Type.String({
    title: "Name of the navbar item",
    maxLength: 30,
  }),
  url: Type.String({
    title: "URL destination of the navbar item",
    format: "link",
  }),
  description: Type.Optional(
    Type.String({
      title: "Description of the navbar item",
      maxLength: 120,
    }),
  ),
  items: Type.Optional(
    Type.Array(
      Type.Object({
        name: Type.String({
          title: "Name of the sub-item",
          maxLength: 30,
        }),
        url: Type.String({
          title: "URL destination of the sub-item",
          format: "link",
        }),
        description: Type.Optional(
          Type.String({
            title: "Description of the sub-item",
            maxLength: 120,
          }),
        ),
      }),
      {
        title: "Sub-items of the navbar item",
      },
    ),
  ),
})

const NavbarBaseSchema = Type.Object({
  items: Type.Array(NavbarItemSchema, {
    title: "Navbar items",
    description: "List of items to be displayed in the navbar",
  }),
})

const NavbarDefaultVariant = Type.Object({
  variant: Type.Literal("default", { default: "default" }),
})

const NavbarCallToActionVariant = Type.Object({
  variant: Type.Literal("callToAction", { default: "callToAction" }),
  callToAction: Type.Object({
    label: Type.String({
      title: "Label for the call to action button",
      maxLength: 30,
    }),
    url: Type.String({
      title: "URL destination of the call to action button",
      format: "link",
    }),
  }),
})

const NavbarUtilityVariant = Type.Object({
  variant: Type.Literal("utility", { default: "utility" }),
  utility: Type.Object({
    label: Type.Optional(
      Type.String({
        title: "Label for the list of utility links",
        maxLength: 30,
      }),
    ),
    items: Type.Array(
      Type.Object({
        name: Type.String({
          title: "Name of the utility link",
          maxLength: 30,
        }),
        url: Type.String({
          title: "URL destination of the utility link",
          format: "link",
        }),
      }),
      {
        maxItems: 4,
      },
    ),
  }),
})

export const NavbarSchema = Type.Intersect(
  [
    NavbarBaseSchema,
    Type.Union([
      NavbarDefaultVariant,
      NavbarCallToActionVariant,
      NavbarUtilityVariant,
    ]),
  ],
  {
    title: "Navbar Schema",
    description:
      "Schema for the navbar component, including items and variants",
  },
)

type NavbarItemSchemaType = Static<typeof NavbarItemSchema>
export type NavbarItemProps = NavbarItemSchemaType
export type NavbarSchemaType = Simplify<Static<typeof NavbarSchema>>

type BaseNavbarProps = OmitFromUnion<NavbarSchemaType, "items"> & {
  layout: IsomerPageLayoutType
  search?: LocalSearchProps | SearchSGInputBoxProps
  LinkComponent?: LinkComponentType
  items: NavbarItemProps[]
  ScriptComponent?: ScriptComponentType
}

export type NavbarProps = BaseNavbarProps & {
  logoUrl: string
  logoAlt: string
  site: IsomerSiteProps
}

export type NavbarClientProps = OmitFromUnion<BaseNavbarProps, "type"> & {
  imageClientProps: ImageClientProps
}
