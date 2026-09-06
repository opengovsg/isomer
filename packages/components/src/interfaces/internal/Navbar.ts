import type { Static } from "@sinclair/typebox"
import type { IsomerPageLayoutType, IsomerSiteProps } from "~/types"
import type { OmitFromUnion } from "~/types/helpers"
import { Type } from "@sinclair/typebox"
import { LINK_HREF_PATTERN } from "~/utils/validation"

import type { ImageClientProps } from "./Image"
import type { LocalSearchProps } from "./LocalSearchInputBox"
import type { NavbarSearchSGInputBoxProps } from "./SearchSgInputBox"

const NavbarItemSchema = Type.Object({
  description: Type.Optional(
    Type.String({
      maxLength: 270,
      title: "Add an optional description",
    }),
  ),
  items: Type.Optional(
    Type.Array(
      Type.Object({
        description: Type.Optional(
          Type.String({
            maxLength: 270,
            title: "Description of the sub-item",
          }),
        ),
        name: Type.String({
          maxLength: 80,
          title: "Name of the sub-item",
        }),
        url: Type.String({
          format: "link",
          pattern: LINK_HREF_PATTERN,
          title: "URL destination of the sub-item",
        }),
      }),
      {
        format: "hidden",
        title: "Sub-items of the navbar item",
      },
    ),
  ),
  name: Type.String({
    maxLength: 80,
    title: "Menu item label",
  }),
  url: Type.String({
    description:
      "You can link an index page, collection, page, or an external link.",
    format: "link",
    pattern: LINK_HREF_PATTERN,
    title: "Link destination",
  }),
})

export const NavbarItemsSchema = Type.Object({
  items: Type.Array(NavbarItemSchema, {
    description: "List of items to be displayed in the navbar",
    errorMessage: {
      maxItems: "You can only have up to 8 first-level links.",
    },
    format: "navbar",
    maxItems: 8,
    minItems: 1,
    title: "Navbar items",
  }),
})

export const NavbarAddonsSchema = Type.Object({
  callToAction: Type.Optional(
    Type.Object(
      {
        isPinnedOnMobile: Type.Optional(
          Type.Boolean({
            default: false,
            description:
              "Button will appear next to your site logo. Search will move into the menu.",
            title: "Pin Call-to-Action on mobile",
          }),
        ),
        label: Type.String({
          maxLength: 25,
          title: "Button text",
        }),
        url: Type.String({
          description: "You can link a folder, page, or external link.",
          format: "link",
          pattern: LINK_HREF_PATTERN,
          title: "Button destination",
        }),
      },
      {
        description:
          "You can highlight a key Call-to-Action using a prominent button.",
        format: "boxedGroup",
        title: "Primary Call-to-Action",
      },
    ),
  ),
  utility: Type.Optional(
    Type.Object(
      {
        items: Type.Array(
          Type.Object({
            name: Type.String({
              maxLength: 50,
              title: "Name of the utility link",
            }),
            url: Type.String({
              format: "link",
              pattern: LINK_HREF_PATTERN,
              title: "URL destination of the utility link",
            }),
          }),
          {
            maxItems: 4,
            minItems: 1,
          },
        ),
        label: Type.Optional(
          Type.String({
            maxLength: 50,
            title: "Label for links",
          }),
        ),
      },
      {
        description:
          "Make frequent actions (like login) easily accessible using utility links.",
        format: "boxedGroup",
        title: "Utility links",
      },
    ),
  ),
})

export const NavbarSchema = Type.Composite(
  [NavbarItemsSchema, NavbarAddonsSchema],
  {
    description:
      "Schema for the navbar component, including items and variants",
    title: "Navbar Schema",
  },
)

export type NavbarSchemaType = Static<typeof NavbarSchema>

type BaseNavbarProps = NavbarSchemaType & {
  layout: IsomerPageLayoutType
  search?: LocalSearchProps | NavbarSearchSGInputBoxProps
}

export type NavbarProps = BaseNavbarProps & {
  logoUrl: string
  logoAlt: string
  site: IsomerSiteProps
}

export type NavbarClientProps = OmitFromUnion<BaseNavbarProps, "type"> & {
  imageClientProps: ImageClientProps
}
