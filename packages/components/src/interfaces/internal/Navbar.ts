import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { ImageClientProps } from "./Image"
import type { LocalSearchProps } from "./LocalSearchInputBox"
import type { NavbarSearchSGInputBoxProps } from "./SearchSGInputBox"
import type {
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"
import { LINK_HREF_PATTERN } from "~/utils/validation"

const NavbarItemSchema = Type.Object({
  name: Type.String({
    title: "Menu item label",
    maxLength: 30,
  }),
  description: Type.Optional(
    Type.String({
      title: "Add an optional description",
      maxLength: 120,
    }),
  ),
  url: Type.String({
    title: "Link destination",
    description:
      "You can link an index page, collection, page, or an external link.",
    format: "link",
    pattern: LINK_HREF_PATTERN,
  }),
  items: Type.Optional(
    Type.Array(
      Type.Object({
        name: Type.String({
          title: "Name of the sub-item",
          maxLength: 30,
        }),
        description: Type.Optional(
          Type.String({
            title: "Description of the sub-item",
            maxLength: 120,
          }),
        ),
        url: Type.String({
          title: "URL destination of the sub-item",
          format: "link",
          pattern: LINK_HREF_PATTERN,
        }),
      }),
      {
        title: "Sub-items of the navbar item",
        format: "hidden",
      },
    ),
  ),
})

export const NavbarItemsSchema = Type.Object({
  items: Type.Array(NavbarItemSchema, {
    title: "Navbar items",
    description: "List of items to be displayed in the navbar",
    format: "navbar",
    minItems: 1,
    maxItems: 7,
  }),
})

export const NavbarAddonsSchema = Type.Object({
  callToAction: Type.Optional(
    Type.Object(
      {
        label: Type.String({
          title: "Button text",
          maxLength: 50,
        }),
        url: Type.String({
          title: "Button destination",
          description: "You can link a folder, page, or external link.",
          format: "link",
          pattern: LINK_HREF_PATTERN,
        }),
      },
      {
        title: "Primary Call-to-Action",
        description:
          "You can highlight a key Call-to-Action using a prominent button.",
      },
    ),
  ),
  utility: Type.Optional(
    Type.Object(
      {
        label: Type.Optional(
          Type.String({
            title: "Label for links",
            maxLength: 50,
          }),
        ),
        items: Type.Array(
          Type.Object({
            name: Type.String({
              title: "Name of the utility link",
              maxLength: 50,
            }),
            url: Type.String({
              title: "URL destination of the utility link",
              format: "link",
              pattern: LINK_HREF_PATTERN,
            }),
          }),
          {
            minItems: 1,
            maxItems: 4,
          },
        ),
      },
      {
        title: "Utility links",
        description:
          "Make frequent actions (like login) easily accessible using utility links.",
      },
    ),
  ),
})

export const NavbarSchema = Type.Composite(
  [NavbarItemsSchema, NavbarAddonsSchema],
  {
    title: "Navbar Schema",
    description:
      "Schema for the navbar component, including items and variants",
  },
)

export type NavbarSchemaType = Static<typeof NavbarSchema>

type BaseNavbarProps = NavbarSchemaType & {
  layout: IsomerPageLayoutType
  search?: LocalSearchProps | NavbarSearchSGInputBoxProps
  LinkComponent?: LinkComponentType
}

export type NavbarProps = BaseNavbarProps & {
  logoUrl: string
  logoAlt: string
  site: IsomerSiteProps
}

export type NavbarClientProps = OmitFromUnion<BaseNavbarProps, "type"> & {
  imageClientProps: ImageClientProps
}
