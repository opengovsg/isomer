import type { Static } from "@sinclair/typebox"
import type { Except, SimplifyDeep } from "type-fest"
import type { DgsApiDatasetSearchResponseSuccess } from "~/hooks/useDgsData/types"
import type { IsomerPageLayoutType, IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { LINK_HREF_PATTERN } from "~/utils/validation"

import { createDgsSchema, NativeDataSourceSchema } from "../../integration"
import { IsomerString } from "../../primitives/IsomerString"
import { CONTACT_INFORMATION_SUPPORT_METHODS } from "./constants"

const BaseContactInformationSchema = Type.Object({
  type: Type.Literal("contactinformation", {
    default: "contactinformation",
  }),
  label: Type.Optional(
    IsomerString({
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

// arbitrary limit for now to prevent abuse
// currently, in DGS case, having [dgs:XXX] means XXX (the column name)
// is max length 24 (30-6)
const CHARACTER_LIMIT = 30

const InjectableContactInformationSchema = Type.Object(
  {
    title: Type.Optional(
      IsomerString({
        title: "Title",
      }),
    ),
    description: Type.Optional(
      IsomerString({
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
          IsomerString({
            title: "Label",
            maxLength: CHARACTER_LIMIT,
          }),
        ),
        values: Type.Array(
          IsomerString({
            maxLength: CHARACTER_LIMIT,
          }),
          { minItems: 1 },
        ),
        caption: Type.Optional(
          IsomerString({
            title: "Caption",
            maxLength: CHARACTER_LIMIT,
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
          IsomerString({
            title: "Other Information",
          }),
        ),
        value: IsomerString(), // note: there can be HTML tags in this field
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
