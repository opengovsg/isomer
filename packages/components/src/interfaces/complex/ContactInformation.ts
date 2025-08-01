import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const CONTACT_INFORMATION_TYPE = "contactinformation"

const generateSingleContactInformationSchema = ({
  defaultDisplayText,
}: {
  defaultDisplayText: string
}) => {
  return Type.Object({
    displayText: Type.Optional(Type.String({ default: defaultDisplayText })),
    values: Type.Array(Type.String(), { minItems: 1 }),
  })
}
const CompulsorySingleContactInformationSchema = Type.Object({
  displayText: Type.String(),
  values: Type.Array(Type.String(), { minItems: 1 }),
})

export const ContactInformationSchema = Type.Object(
  {
    type: Type.Literal(CONTACT_INFORMATION_TYPE, {
      default: CONTACT_INFORMATION_TYPE,
    }),
    country: Type.Optional(Type.String()),
    city: Type.Optional(Type.String()),
    description: Type.Optional(Type.String()),
    entityDetails: Type.Optional(
      Type.Array(CompulsorySingleContactInformationSchema, {
        minItems: 1,
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
    otherMethods: Type.Optional(
      Type.Array(CompulsorySingleContactInformationSchema, {
        minItems: 1,
      }),
    ),
    otherInformation: Type.Optional(Type.String()), // note: there can be HTML tags in this field
  },
  {
    title: "Contact Information component",
  },
)

export type ContactInformationProps = Static<typeof ContactInformationSchema>
