import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type {
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"
import { LINK_HREF_PATTERN } from "~/utils/validation"
import {
  DgsDataSourceSingleRecordSchema,
  NativeDataSourceSingleRecordSchema,
} from "../dataSource"

export const CONTACT_INFORMATION_TYPE = "contactinformation"

const generateSingleContactInformationSchema = ({
  defaultDisplayText,
}: {
  defaultDisplayText: string
}) => {
  return Type.Object({
    displayText: Type.Optional(
      Type.String({
        title: defaultDisplayText,
      }),
    ),
    values: Type.Array(Type.String(), { minItems: 1 }),
  })
}
const CompulsorySingleContactInformationSchema = Type.Object({
  displayText: Type.String(),
  values: Type.Array(Type.String(), { minItems: 1 }),
})

const BaseContactInformationSchema = Type.Object({
  type: Type.Literal(CONTACT_INFORMATION_TYPE, {
    default: CONTACT_INFORMATION_TYPE,
  }),
  label: Type.Optional(
    Type.String({
      title: "Link text",
      maxLength: 50,
      description:
        "Add a link under your block. Avoid generic text such as “Click here” or “Learn more”",
    }),
  ),
  url: Type.Optional(
    Type.String({
      title: "Link destination",
      description: "When this is clicked, open:",
      format: "link",
      pattern: LINK_HREF_PATTERN,
    }),
  ),
})

export const NativeContactInformationSchema = Type.Intersect([
  NativeDataSourceSingleRecordSchema,
  Type.Object(
    {
      country: Type.Optional(
        Type.String({
          title: "Country",
        }),
      ),
      entityName: Type.Optional(
        Type.String({
          title: "Entity Name",
        }),
      ),
      description: Type.Optional(
        Type.String({
          title: "Description",
        }),
      ),
      telephone: Type.Optional(
        generateSingleContactInformationSchema({
          defaultDisplayText: "Telephone",
        }),
      ),
      fax: Type.Optional(
        generateSingleContactInformationSchema({
          defaultDisplayText: "Fax",
        }),
      ),
      email: Type.Optional(
        generateSingleContactInformationSchema({
          defaultDisplayText: "Email",
        }),
      ),
      website: Type.Optional(
        generateSingleContactInformationSchema({
          defaultDisplayText: "Website",
        }),
      ),
      operatingHours: Type.Optional(
        generateSingleContactInformationSchema({
          defaultDisplayText: "Operating Hours",
        }),
      ),
      entityDetails: Type.Optional(
        Type.Array(CompulsorySingleContactInformationSchema, {
          minItems: 1,
        }),
      ),
      otherMethods: Type.Optional(
        Type.Array(CompulsorySingleContactInformationSchema, {
          minItems: 1,
        }),
      ),
      otherInformation: Type.Optional(
        Type.String({
          title: "Other Information",
        }),
      ), // note: there can be HTML tags in this field
    },
    {
      title: "Native Contact Information component",
    },
  ),
])

export const DgsContactInformationSchema = Type.Intersect([
  DgsDataSourceSingleRecordSchema,
  Type.Object(
    {
      country: Type.Optional(Type.String()),
      entityName: Type.Optional(Type.String()),
      description: Type.Optional(Type.String()),
      telephone: Type.Optional(Type.String()),
      fax: Type.Optional(Type.String()),
      email: Type.Optional(Type.String()),
      website: Type.Optional(Type.String()),
      operatingHours: Type.Optional(Type.String()),
      entityDetails: Type.Optional(Type.String()),
      otherMethods: Type.Optional(Type.String()),
      otherInformation: Type.Optional(Type.String()),
    },
    {
      title: "DGS Contact Information component",
    },
  ),
])

export const ContactInformationSchema = Type.Intersect([
  BaseContactInformationSchema,
  Type.Union([NativeContactInformationSchema, DgsContactInformationSchema]),
])

export type ContactInformationUIProps = Static<
  typeof BaseContactInformationSchema
> &
  Pick<
    Static<typeof NativeContactInformationSchema>,
    | "country"
    | "entityName"
    | "description"
    | "telephone"
    | "fax"
    | "email"
    | "website"
    | "operatingHours"
    | "entityDetails"
    | "otherMethods"
    | "otherInformation"
  > & {
    layout: IsomerPageLayoutType
    site: IsomerSiteProps
    LinkComponent?: LinkComponentType
  }

export type NativeContactInformationProps = Static<
  typeof BaseContactInformationSchema
> &
  Static<typeof NativeContactInformationSchema> & {
    layout: IsomerPageLayoutType
    site: IsomerSiteProps
    LinkComponent?: LinkComponentType
  }

export type DgsContactInformationProps = Static<
  typeof BaseContactInformationSchema
> &
  Static<typeof DgsContactInformationSchema> & {
    layout: IsomerPageLayoutType
    site: IsomerSiteProps
    LinkComponent?: LinkComponentType
  }

export type ContactInformationProps = Static<
  typeof ContactInformationSchema
> & {
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}
