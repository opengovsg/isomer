import type { ContentPageSchemaType } from "@opengovsg/isomer-components"

import { makeSite } from "./site"

export const contentData: ContentPageSchemaType = {
  layout: "content",
  site: makeSite({
    siteName: "Isomer Next",
    siteMap: {
      id: "1",
      title: "Home",
      permalink: "/",
      lastModified: "",
      layout: "homepage",
      summary: "",
      children: [
        {
          id: "2",
          title: "Schemes & grants",
          permalink: "/schemes",
          lastModified: "",
          layout: "content",
          summary: "",
          children: [
            {
              id: "3",
              title: "Enterprise Development Grant",
              permalink: "/schemes/edg",
              lastModified: "",
              layout: "content",
              summary: "",
              children: [
                {
                  id: "4",
                  title: "Eligibility",
                  permalink: "/schemes/edg/eligibility",
                  lastModified: "",
                  layout: "content",
                  summary: "",
                  children: [],
                },
                {
                  id: "5",
                  title: "How to apply",
                  permalink: "/schemes/edg/how-to-apply",
                  lastModified: "",
                  layout: "content",
                  summary: "",
                  children: [],
                },
                {
                  id: "6",
                  title: "Grant quantum",
                  permalink: "/schemes/edg/grant-quantum",
                  lastModified: "",
                  layout: "content",
                  summary: "",
                  children: [],
                },
              ],
            },
            {
              id: "7",
              title: "Market Readiness Assistance",
              permalink: "/schemes/mra",
              lastModified: "",
              layout: "content",
              summary: "",
              children: [],
            },
          ],
        },
      ],
    },
    navbar: {
      items: [
        { name: "Home", url: "/" },
        {
          name: "Schemes & grants",
          url: "/schemes",
          items: [
            { name: "Enterprise Development Grant", url: "/schemes/edg" },
            { name: "Market Readiness Assistance", url: "/schemes/mra" },
          ],
        },
        { name: "About us", url: "/about" },
        { name: "Contact", url: "/contact" },
      ],
    },
  }),
  page: {
    title: "Enterprise Development Grant (EDG)",
    permalink: "/schemes/edg",
    lastModified: "2024-05-02T14:12:57.160Z",
    contentPageHeader: {
      summary:
        "The EDG helps Singapore companies grow and transform. It supports projects that help businesses upgrade capabilities, innovate, or internationalise.",
      buttonLabel: "Apply now",
      buttonUrl: "https://www.businessgrants.gov.sg",
    },
  },
  content: [
    {
      type: "callout",
      variant: "info",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Applications are open year-round. Approved projects must commence within 6 months of the Letter of Offer date.",
            },
          ],
        },
      ],
    },
    {
      type: "prose",
      content: [
        {
          type: "heading",
          attrs: { id: "overview", level: 2 },
          content: [{ type: "text", text: "Overview" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "The Enterprise Development Grant (EDG) was launched in 2018 to help Singapore companies grow and transform. Administered by Enterprise Singapore, EDG funds projects that help businesses upgrade their capabilities, innovate, and expand into overseas markets.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { id: "eligibility", level: 2 },
          content: [{ type: "text", text: "Eligibility" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Your business must meet all of the following criteria:" }],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Registered and operating in Singapore" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Have at least 30% local shareholding" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Be in a financially viable position to start and complete the project" }],
                },
              ],
            },
          ],
        },
        {
          type: "heading",
          attrs: { id: "quantum", level: 2 },
          content: [{ type: "text", text: "Grant quantum" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "EDG supports up to 50% of qualifying project costs. For small and medium enterprises (SMEs), support may be up to 70% for qualifying projects.",
            },
          ],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "SMEs: up to 70% support" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Non-SMEs: up to 50% support" }],
                },
              ],
            },
          ],
        },
        {
          type: "heading",
          attrs: { id: "apply", level: 2 },
          content: [{ type: "text", text: "How to apply" }],
        },
        {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Log in to the Business Grants Portal (BGP) using CorpPass" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Select Enterprise Singapore as the grant agency and EDG as the grant" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Fill in your project details, scope, and budget" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Submit your application and await assessment (typically 6–8 weeks)" }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "accordion",
      items: [
        {
          title: "What costs are eligible for EDG?",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Eligible costs include manpower, consultancy, software, equipment, and other project-related costs. Personal protective equipment (PPE) and non-project-related operating costs are not eligible.",
                },
              ],
            },
          ],
        },
        {
          title: "Can I apply for multiple EDG projects?",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Yes. There is no limit to the number of EDG projects a company can apply for, as long as each project is distinct and addresses a clear business need.",
                },
              ],
            },
          ],
        },
        {
          title: "What happens after my application is approved?",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "You will receive a Letter of Offer. Your project must commence within 6 months of the Letter of Offer date. Upon project completion, submit a claims package for reimbursement.",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
