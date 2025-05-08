import type { IsomerSchema } from "@opengovsg/isomer-components"

import type { Navbar } from "~/server/modules/resource/resource.types"

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

export const SEARCH_PAGE_BLOB: IsomerSchema = {
  page: { title: "Search", description: "Search results" },
  layout: "search",
  content: [],
  version: "0.1.0",
}

export const NAV_BAR_ITEMS: Navbar["items"] = [
  {
    name: "Expandable nav item",
    url: "/item-one",
    items: [
      {
        name: "PA's network one",
        url: "/item-one/pa-network-one",
        description: "Click here and brace yourself for mild disappointment.",
      },
      {
        name: "PA's network two",
        url: "/item-one/pa-network-two",
        description: "Click here and brace yourself for mild disappointment.",
      },
      {
        name: "PA's network three",
        url: "/item-one/pa-network-three",
      },
      {
        name: "PA's network four",
        url: "/item-one/pa-network-four",
        description:
          "Click here and brace yourself for mild disappointment. This one has a pretty long one",
      },
      {
        name: "PA's network five",
        url: "/item-one/pa-network-five",
        description:
          "Click here and brace yourself for mild disappointment. This one has a pretty long one",
      },
      {
        name: "PA's network six",
        url: "/item-one/pa-network-six",
        description: "Click here and brace yourself for mild disappointment.",
      },
    ],
  },
]

const FOOTER_ITEMS = [
  {
    title: "About us",
    url: "/about",
  },
  {
    title: "Our partners",
    url: "/partners",
  },
  {
    title: "Grants and programmes",
    url: "/grants-and-programmes",
  },
  {
    title: "Contact us",
    url: "/contact-us",
  },
  {
    title: "Something else",
    url: "/something-else",
  },
  {
    title: "Resources",
    url: "/resources",
  },
]

export const FOOTER = {
  contactUsLink: "/contact-us",
  feedbackFormLink: "https://www.form.gov.sg",
  privacyStatementLink: "/privacy",
  termsOfUseLink: "/terms-of-use",
  siteNavItems: FOOTER_ITEMS,
}
