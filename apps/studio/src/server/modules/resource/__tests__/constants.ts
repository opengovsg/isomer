import { IsomerSchema } from "@opengovsg/isomer-components"

export const PAGE_BLOB: IsomerSchema = {
  version: "0.1.0",
  layout: "homepage",
  page: {},
  content: [
    {
      type: "hero",
      variant: "gradient",
      title: "Isomer",
      subtitle:
        "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
      buttonLabel: "Main CTA",
      buttonUrl: "/",
      secondaryButtonLabel: "Sub CTA",
      secondaryButtonUrl: "/",
      backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
    },
    {
      type: "infobar",
      title: "This is an infobar",
      description: "This is the description that goes into the Infobar section",
    },
    {
      type: "infopic",
      title: "This is an infopic",
      description: "This is the description for the infopic component",
      imageSrc: "https://placehold.co/600x400",
    },
    {
      type: "keystatistics",
      statistics: [
        {
          label: "Average all nighters pulled in a typical calendar month",
          value: "3",
        },
        {
          label: "Growth in tasks assigned Q4 2024 (YoY)",
          value: "+12.2%",
        },
        {
          label: "Creative blocks met per single evening",
          value: "89",
        },
        {
          value: "4.0",
          label: "Number of lies in this stat block",
        },
      ],
      title: "Irrationality in numbers",
    },
  ],
}
