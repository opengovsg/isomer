import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type {
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"
import { LINK_HREF_PATTERN } from "~/utils/validation"
import { createDgsSchema, NativeDataSourceSchema } from "../integration"

export const CONTACT_INFORMATION_TYPE = "contactinformation"

export const CONTACT_INFORMATION_SUPPORT_METHODS = [
  "telephone",
  "fax",
  "email",
  "website",
  "emergency_contact",
  "address",
  "operating_hours",
  "person",
] as const

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
  // Needed for MFA case where we want to
  // selectively display contact methods retrieved from DGS
  whitelistedMethods: Type.Optional(
    Type.Array(
      Type.Union(
        CONTACT_INFORMATION_SUPPORT_METHODS.map((method) =>
          Type.Literal(method, { default: method }),
        ),
        {
          title: "Whitelisted Methods",
          description: "Only whitelisted methods will be displayed.",
          format: "hidden",
        },
      ),
    ),
  ),
})

const InjectableContactInformationSchema = Type.Object(
  {
    title: Type.Optional(
      Type.String({
        title: "Title",
      }),
    ),
    description: Type.Optional(
      Type.String({
        title: "Description",
      }),
    ),
    methods: Type.Array(
      Type.Object({
        method: Type.Optional(
          Type.Union(
            CONTACT_INFORMATION_SUPPORT_METHODS.map((method) =>
              Type.Literal(method, {
                title:
                  method.charAt(0).toUpperCase() +
                  method.slice(1).replace(/_/g, " "),
              }),
            ),
            {
              title: "Type",
              description: "Select the type of contact information",
            },
          ),
        ),
        label: Type.Optional(
          Type.String({
            title: "Label",
            maxLength: 30, // arbitrarily low limit for now to prevent abuse
          }),
        ),
        values: Type.Array(
          Type.String({
            maxLength: 30, // arbitrarily low limit for now to prevent abuse
          }),
          { minItems: 1 },
        ),
        caption: Type.Optional(
          Type.String({
            title: "Caption",
            maxLength: 30, // arbitrarily low limit for now to prevent abuse
          }),
        ),
      }),
      {
        title: "Contact Methods",
        description: "Displayed in the order you add them here.",
        minItems: 1,
      },
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
)

export const NativeContactInformationSchema = Type.Intersect([
  NativeDataSourceSchema,
  InjectableContactInformationSchema,
])

export const DgsContactInformationSchema = createDgsSchema({
  componentName: "Contact Information",
  nativeSchema: InjectableContactInformationSchema,
})

export const ContactInformationSchema = Type.Intersect([
  BaseContactInformationSchema,
  Type.Union([NativeContactInformationSchema, DgsContactInformationSchema]),
])

export const InjectableContactInformationKeys = Object.keys(
  InjectableContactInformationSchema.properties,
)

interface AdditionalContactInformationTypeProps {
  layout: IsomerPageLayoutType
  LinkComponent?: LinkComponentType
}

type BaseContactInformationType = Static<typeof BaseContactInformationSchema> &
  AdditionalContactInformationTypeProps

export type ContactInformationUIProps = Omit<
  BaseContactInformationType,
  "url"
> &
  Static<typeof InjectableContactInformationSchema> & {
    referenceLinkHref?: string
    isLoading?: boolean
    acceptHtmlTags?: boolean
  }

export type NativeContactInformationProps = BaseContactInformationType &
  Static<typeof NativeContactInformationSchema>

export type DgsContactInformationProps = BaseContactInformationType &
  Static<typeof DgsContactInformationSchema>

export type ContactInformationProps = Static<typeof ContactInformationSchema> &
  AdditionalContactInformationTypeProps & {
    site: IsomerSiteProps
  }
