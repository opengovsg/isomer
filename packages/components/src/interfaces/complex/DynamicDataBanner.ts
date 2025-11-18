import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { DYNAMIC_DATA_BANNER_NUMBER_OF_DATA } from "~/constants"
import { LINK_HREF_PATTERN } from "~/utils/validation"
import { TextSchema } from "../native/Text"

export const DynamicDataBannerSchema = Type.Object(
  {
    type: Type.Literal("dynamicdatabanner", {
      default: "dynamicdatabanner",
    }),
    apiEndpoint: Type.String({
      title: "API endpoint",
      description: "The API endpoint to fetch the data from",
      format: "uri",
    }),
    title: Type.Optional(
      Type.String({
        title: "Title JSON Key",
        description:
          "Unique identifier in the JSON to be used as title e.g. 'hijriDate'",
        maxLength: 100,
      }),
    ),
    data: Type.Array(
      Type.Object({
        label: Type.String({
          title: "Description",
          description: "Descriptive label e.g. 'Maghrib'",
          maxLength: 100,
        }),
        key: Type.String({
          title: "Key",
          description: "Unique identifier in the JSON e.g. 'maghribTime'",
          maxLength: 100,
        }),
      }),
      {
        title: "Data",
        minItems: DYNAMIC_DATA_BANNER_NUMBER_OF_DATA,
        maxItems: DYNAMIC_DATA_BANNER_NUMBER_OF_DATA,
      },
    ),
    errorMessage: Type.Array(TextSchema, {
      title: "Error message",
      description: "The error message to display if the data is not loaded",
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
  },
  {
    groups: [
      {
        label: "Add a call-to-action",
        fields: ["label", "url"],
      },
    ],
    title: "DynamicDataBanner component",
    description: "A component that displays DynamicDataBanner",
  },
)

export type DynamicDataBannerProps = Static<typeof DynamicDataBannerSchema> & {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}
