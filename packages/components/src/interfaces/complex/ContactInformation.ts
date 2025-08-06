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
  DgsKeySchema,
  NativeDataSourceSingleRecordSchema,
} from "../dataSource"

export const CONTACT_INFORMATION_TYPE = "contactinformation"

const generateSingleContactInformationSchema = ({
  defaultLabelTitle,
}: {
  defaultLabelTitle: string
}) => {
  return Type.Object({
    label: Type.Optional(
      Type.String({
        title: defaultLabelTitle,
      }),
    ),
    values: Type.Array(Type.String(), { minItems: 1 }),
    caption: Type.Optional(
      Type.String({
        title: "Caption",
        maxLength: 30, // arbitrarily low limit for now to prevent abuse
      }),
    ),
  })
}
const CompulsorySingleContactInformationSchema = Type.Object({
  label: Type.String(),
  values: Type.Array(Type.String(), { minItems: 1 }),
  caption: Type.Optional(
    Type.String({
      title: "Caption",
      maxLength: 30, // arbitrarily low limit for now to prevent abuse
    }),
  ),
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
          defaultLabelTitle: "Telephone",
        }),
      ),
      fax: Type.Optional(
        generateSingleContactInformationSchema({
          defaultLabelTitle: "Fax",
        }),
      ),
      email: Type.Optional(
        generateSingleContactInformationSchema({
          defaultLabelTitle: "Email",
        }),
      ),
      website: Type.Optional(
        generateSingleContactInformationSchema({
          defaultLabelTitle: "Website",
        }),
      ),
      emergencyContact: Type.Optional(
        generateSingleContactInformationSchema({
          defaultLabelTitle: "Emergency Contact",
        }),
      ),
      operatingHours: Type.Optional(
        generateSingleContactInformationSchema({
          defaultLabelTitle: "Operating Hours",
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
        Type.Object({
          label: Type.Optional(
            Type.String({
              title: "Other Information",
            }),
          ),
          value: Type.String(), // note: there can be HTML tags in this field
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
      entityName: Type.Optional(
        Type.Union([
          NativeContactInformationSchema.shape.entityName,
          DgsKeySchema,
        ]),
      ),
      description: Type.Optional(
        Type.Union([
          NativeContactInformationSchema.shape.description,
          DgsKeySchema,
        ]),
      ),
      telephone: Type.Optional(
        Type.Union([
          NativeContactInformationSchema.shape.telephone,
          DgsKeySchema,
        ]),
      ),
      fax: Type.Optional(
        Type.Union([NativeContactInformationSchema.shape.fax, DgsKeySchema]),
      ),
      email: Type.Optional(
        Type.Union([NativeContactInformationSchema.shape.email, DgsKeySchema]),
      ),
      website: Type.Optional(
        Type.Union([
          NativeContactInformationSchema.shape.website,
          DgsKeySchema,
        ]),
      ),
      emergencyContact: Type.Optional(
        Type.Union([
          NativeContactInformationSchema.shape.emergencyContact,
          DgsKeySchema,
        ]),
      ),
      operatingHours: Type.Optional(
        Type.Union([
          NativeContactInformationSchema.shape.operatingHours,
          DgsKeySchema,
        ]),
      ),
      entityDetails: Type.Optional(
        Type.Union([
          NativeContactInformationSchema.shape.entityDetails,
          DgsKeySchema,
        ]),
      ),
      otherMethods: Type.Optional(
        Type.Union([
          NativeContactInformationSchema.shape.otherMethods,
          DgsKeySchema,
        ]),
      ),
      otherInformation: Type.Optional(
        Type.Union([
          NativeContactInformationSchema.shape.otherInformation,
          DgsKeySchema,
        ]),
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

export type ContactInformationUIProps = Omit<
  Static<typeof BaseContactInformationSchema>,
  "url"
> &
  Pick<
    Static<typeof NativeContactInformationSchema>,
    | "entityName"
    | "description"
    | "telephone"
    | "fax"
    | "email"
    | "website"
    | "emergencyContact"
    | "operatingHours"
    | "entityDetails"
    | "otherMethods"
    | "otherInformation"
  > & {
    layout: IsomerPageLayoutType
    LinkComponent?: LinkComponentType
    referenceLinkHref?: string
  }

export type NativeContactInformationProps = Static<
  typeof BaseContactInformationSchema
> &
  Static<typeof NativeContactInformationSchema> & {
    layout: IsomerPageLayoutType
    LinkComponent?: LinkComponentType
  }

export type DgsContactInformationProps = Static<
  typeof BaseContactInformationSchema
> &
  Static<typeof DgsContactInformationSchema> & {
    layout: IsomerPageLayoutType
    LinkComponent?: LinkComponentType
  }

export type ContactInformationProps = Static<
  typeof ContactInformationSchema
> & {
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}

export type SingleContactInformationProps = Static<
  ReturnType<typeof generateSingleContactInformationSchema>
>
