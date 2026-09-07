import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { Navbar } from "~/server/modules/resource/resource.types"

export const PAGE_BLOB: IsomerSchema = {
  content: [
    {
      backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
      buttonLabel: "Main CTA",
      buttonUrl: "/",
      secondaryButtonLabel: "Sub CTA",
      secondaryButtonUrl: "/",
      subtitle:
        "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
      title: "Isomer",
      type: "hero",
      variant: "gradient",
    },
    {
      description: "This is the description that goes into the Infobar section",
      title: "This is an infobar",
      type: "infobar",
    },
    {
      description: "This is the description for the infopic component",
      imageAlt: "This is the alt text for the image",
      imageSrc: "https://placehold.co/600x400",
      title: "This is an infopic",
      type: "infopic",
    },
    {
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
          label: "Number of lies in this stat block",
          value: "4.0",
        },
      ],
      title: "Irrationality in numbers",
      type: "keystatistics",
    },
    {
      type: "antiscambanner",
    },
  ],
  layout: "homepage",
  page: {},
  version: "0.1.0",
}

export const NAVBAR_CONTENT: Navbar = {
  items: [
    {
      items: [
        {
          description: "Click here and brace yourself for mild disappointment.",
          name: "PA's network one",
          url: "/item-one/pa-network-one",
        },
        {
          description: "Click here and brace yourself for mild disappointment.",
          name: "PA's network two",
          url: "/item-one/pa-network-two",
        },
        {
          name: "PA's network three",
          url: "/item-one/pa-network-three",
        },
        {
          description:
            "Click here and brace yourself for mild disappointment. This one has a pretty long one",
          name: "PA's network four",
          url: "/item-one/pa-network-four",
        },
        {
          description:
            "Click here and brace yourself for mild disappointment. This one has a pretty long one",
          name: "PA's network five",
          url: "/item-one/pa-network-five",
        },
        {
          description: "Click here and brace yourself for mild disappointment.",
          name: "PA's network six",
          url: "/item-one/pa-network-six",
        },
      ],
      name: "Expandable nav item",
      url: "/item-one",
    },
  ],
}

export const SEARCH_PAGE_BLOB: IsomerSchema = {
  content: [],
  layout: "search",
  page: { description: "Search results", title: "Search" },
  version: "0.1.0",
}

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
  siteNavItems: FOOTER_ITEMS,
  termsOfUseLink: "/terms-of-use",
}
