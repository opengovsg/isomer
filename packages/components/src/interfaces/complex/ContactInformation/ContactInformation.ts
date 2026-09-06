import type { Static } from "@sinclair/typebox"
import type { Except, SimplifyDeep } from "type-fest"
import type { DgsApiDatasetSearchResponseSuccess } from "~/hooks/useDgsData/types"
import type { IsomerPageLayoutType, IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { LINK_HREF_PATTERN } from "~/utils/validation"

import { createDgsSchema } from "../../integration/dgs"
import { NativeDataSourceSchema } from "../../integration/native"
import { CONTACT_INFORMATION_SUPPORT_METHODS } from "./constants"

const BaseContactInformationSchema = Type.Object({
  label: Type.Optional(
    Type.String({
      description:
        "Add a link under your block. Avoid generic text such as “Click here” or “Learn more”",
      maxLength: 50,
      title: "Link text",
    }),
  ),
  type: Type.Literal("contactinformation", {
    default: "contactinformation",
  }),
  url: Type.Optional(
    Type.String({
      description: "When this is clicked, open:",
      format: "link",
      pattern: LINK_HREF_PATTERN,
      title: "Link destination",
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
          description: "Only whitelisted methods will be displayed.",
          format: "hidden",
          title: "Whitelisted Methods",
        },
      ),
    ),
  ),
})

// arbitrary limit for now to prevent abuse
// currently, in DGS case, having [dgs:XXX] means XXX (the column name)
// is max length 24 (30-6)
const CHARACTER_LIMIT = 30

const InjectableContactInformationSchema = Type.Object(
  {
    description: Type.Optional(
      Type.String({
        title: "Description",
      }),
    ),
    methods: Type.Array(
      Type.Object({
        caption: Type.Optional(
          Type.String({
            maxLength: CHARACTER_LIMIT,
            title: "Caption",
          }),
        ),
        label: Type.Optional(
          Type.String({
            maxLength: CHARACTER_LIMIT,
            title: "Label",
          }),
        ),
        method: Type.Optional(
          Type.Union(
            CONTACT_INFORMATION_SUPPORT_METHODS.map((method) =>
              Type.Literal(method, {
                title:
                  method.charAt(0).toUpperCase() +
                  method.slice(1).replaceAll("_", " "),
              }),
            ),
            {
              description: "Select the type of contact information",
              title: "Type",
            },
          ),
        ),
        values: Type.Array(
          Type.String({
            maxLength: CHARACTER_LIMIT,
          }),
          { minItems: 1 },
        ),
      }),
      {
        description: "Displayed in the order you add them here.",
        minItems: 1,
        title: "Contact Methods",
      },
    ),
    otherInformation: Type.Optional(
      Type.Object({
        label: Type.Optional(
          Type.String({
            title: "Other Information",
          }),
        ),
        // note: there can be HTML tags in this field
        value: Type.String(),
      }),
    ),
    title: Type.Optional(
      Type.String({
        title: "Title",
      }),
    ),
  },
  {
    title: "Native Contact Information component",
  },
)

const NativeContactInformationSchema = Type.Intersect([
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

interface AdditionalContactInformationTypeProps {
  layout: IsomerPageLayoutType
  headingLevel: number
}

type BaseContactInformationType = SimplifyDeep<
  Static<typeof BaseContactInformationSchema> &
    AdditionalContactInformationTypeProps
>

export type ContactInformationUIProps = Omit<
  BaseContactInformationType,
  "url"
> &
  Static<typeof InjectableContactInformationSchema> & {
    referenceLinkHref?: string
    isLoading?: boolean
    acceptHtmlTags?: boolean
  }

export type NativeContactInformationProps = SimplifyDeep<
  BaseContactInformationType & Static<typeof NativeContactInformationSchema>
>

export type DgsContactInformationProps = SimplifyDeep<
  BaseContactInformationType & Static<typeof DgsContactInformationSchema>
>

export type ContactInformationProps = Static<typeof ContactInformationSchema> &
  AdditionalContactInformationTypeProps & {
    site: IsomerSiteProps
  }

export interface DgsTransformedContactInformationProps extends Except<
  DgsContactInformationProps,
  "dataSource"
> {
  record: DgsApiDatasetSearchResponseSuccess["result"]["records"][number]
  isLoading?: ContactInformationUIProps["isLoading"]
}
