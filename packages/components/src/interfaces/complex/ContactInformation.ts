import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type {
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"
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
  country: Type.Optional(
    Type.String({
      title: "Country",
    }),
  ),
  city: Type.Optional(
    Type.String({
      title: "City",
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
  otherInformation: Type.Optional(
    Type.String({
      title: "Other Information",
    }),
  ), // note: there can be HTML tags in this field
})

export const NativeContactInformationSchema = Type.Intersect([
  NativeDataSourceSingleRecordSchema,
  Type.Object(
    {
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
      entityDetails: Type.Optional(
        Type.Object({
          fieldKey: Type.String({
            title: "Field Key",
            description: "The key of the header in DGS table",
          }),
        }),
      ),
      otherMethods: Type.Optional(
        Type.Object({
          fieldKey: Type.String({
            title: "Field Key",
            description: "The key of the header in DGS table",
          }),
        }),
      ),
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
    "entityDetails" | "otherMethods"
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
