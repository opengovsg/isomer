import type { Static } from "@sinclair/typebox"
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

export const NavbarSchema = Type.Object({
  items: Type.Array(NavbarItemSchema, {
    title: "Navbar items",
    description: "List of items to be displayed in the navbar",
  }),
  callToAction: Type.Optional(
    Type.Object({
      label: Type.String({
        title: "Label for the call to action button",
        maxLength: 30,
      }),
      url: Type.String({
        title: "URL destination of the call to action button",
        format: "link",
      }),
    }),
  ),
  // TODO: Convert callToAction and utility into variants that are mutually exclusive
  utility: Type.Optional(
    Type.Object({
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
  ),
})

type NavbarItemSchemaType = Static<typeof NavbarItemSchema>
type NavbarItem = NavbarItemSchemaType & {
  referenceLinkHref?: string
}
export type NavbarItemProps = Omit<NavbarItem, "items"> & {
  items?: NavbarItem[]
}

export type NavbarSchemaType = Static<typeof NavbarSchema>
type BaseNavbarProps = Omit<NavbarSchemaType, "items"> & {
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
export type NavbarClientProps = Omit<BaseNavbarProps, "callToAction"> & {
  callToAction?: Omit<NonNullable<NavbarProps["callToAction"]>, "url"> & {
    referenceLinkHref?: string
    isExternal: boolean
  }
  imageClientProps: ImageClientProps
}
