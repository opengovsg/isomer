import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { LINK_HREF_PATTERN } from "~/utils/validation"

import { TextSchema } from "../../native/Text"
import { DYNAMIC_DATA_BANNER_NUMBER_OF_DATA } from "./constants"

export const DynamicDataBannerSchema = Type.Object(
  {
    apiEndpoint: Type.String({
      description: "The API endpoint to fetch the data from",
      format: "uri",
      title: "API endpoint",
    }),
    data: Type.Array(
      Type.Object({
        key: Type.String({
          description: "Unique identifier in the JSON e.g. 'maghribTime'",
          maxLength: 100,
          title: "Key",
        }),
        label: Type.String({
          description: "Descriptive label e.g. 'Maghrib'",
          maxLength: 100,
          title: "Description",
        }),
      }),
      {
        maxItems: DYNAMIC_DATA_BANNER_NUMBER_OF_DATA,
        minItems: DYNAMIC_DATA_BANNER_NUMBER_OF_DATA,
        title: "Data",
      },
    ),
    errorMessage: Type.Array(TextSchema, {
      description: "The error message to display if the data is not loaded",
      title: "Error message",
    }),
    label: Type.Optional(
      Type.String({
        description:
          "Add a link under your block. Avoid generic text such as “Click here” or “Learn more”",
        maxLength: 50,
        title: "Link text",
      }),
    ),
    title: Type.Optional(
      Type.String({
        description:
          "Unique identifier in the JSON to be used as title e.g. 'hijriDate'",
        maxLength: 100,
        title: "Title JSON Key",
      }),
    ),
    type: Type.Literal("dynamicdatabanner", {
      default: "dynamicdatabanner",
    }),
    url: Type.Optional(
      Type.String({
        description: "When this is clicked, open:",
        format: "link",
        pattern: LINK_HREF_PATTERN,
        title: "Link destination",
      }),
    ),
  },
  {
    description: "A component that displays DynamicDataBanner",
    groups: [
      {
        fields: ["label", "url"],
        label: "Add a call-to-action",
      },
    ],
    title: "DynamicDataBanner component",
  },
)

export type DynamicDataBannerProps = Static<typeof DynamicDataBannerSchema> & {
  site: IsomerSiteProps
}
