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
    title: "Menu item label",
    maxLength: 30,
  }),
  url: Type.String({
    title: "Link destination",
    description:
      "You can link an index page, collection, page, or an external link.",
    format: "link",
  }),
  description: Type.Optional(
    Type.String({
      title: "Add an optional description",
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

export const NavbarSchema = Type.Object(
  {
    items: Type.Array(NavbarItemSchema, {
      title: "Navbar items",
      description: "List of items to be displayed in the navbar",
    }),
    callToAction: Type.Optional(
      Type.Object(
        {
          label: Type.String({
            title: "Label for Call-to-Action",
            maxLength: 30,
          }),
          url: Type.String({
            title: "Call-to-Action destination",
            description: "You can link a folder, page, or external link.",
            format: "link",
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
        },
        {
          title: "Add utility links",
          description:
            "Make frequent actions (like login) easily accessible using utility links.",
        },
      ),
    ),
  },

  {
    title: "Navbar Schema",
    description:
      "Schema for the navbar component, including items and variants",
  },
)

export type NavbarSchemaType = Static<typeof NavbarSchema>

type BaseNavbarProps = NavbarSchemaType & {
  layout: IsomerPageLayoutType
  search?: LocalSearchProps | SearchSGInputBoxProps
  LinkComponent?: LinkComponentType
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
