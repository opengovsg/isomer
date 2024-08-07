import type { DelayMode } from "msw"
import { delay } from "msw"

import { trpcMsw } from "../mockTrpc"

const siteListQuery = (wait?: DelayMode | number) => {
  return trpcMsw.site.list.query(async () => {
    if (wait !== undefined) {
      await delay(wait)
    }
    return [
      {
        id: 1,
        name: "Ministry of Trade and Industry",
      },
    ]
  })
}

export const sitesHandlers = {
  list: {
    default: siteListQuery,
    loading: () => siteListQuery("infinite"),
  },
  getTheme: {
    default: () => {
      return trpcMsw.site.getTheme.query(() => {
        return {
          colors: {
            canvas: {
              default: "#e6ecef",
              alt: "#bfcfd7",
              backdrop: "#80a0af",
              inverse: "#00405f",
            },
            interaction: {
              default: "#00405f",
              hover: "#002e44",
              pressed: "#00283b",
            },
          },
        }
      })
    },
  },
  getConfig: {
    default: () => {
      return trpcMsw.site.getConfig.query(() => {
        return {
          theme: "isomer-next",
          siteName: "Ministry of Test and Industry",
          search: undefined,
          agencyName: "Ministry of Test and Industry",
          isGovernment: true,
          name: "Ministry of Trade and Industry",
          logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
        }
      })
    },
  },
  getFooter: {
    default: () => {
      return trpcMsw.site.getFooter.query(() => {
        return {
          id: 1,
          siteId: 1,
          content: {
            siteNavItems: [
              {
                url: "/about",
                title: "About us",
              },
              {
                url: "/partners",
                title: "Our partners",
              },
              {
                url: "/grants-and-programmes",
                title: "Grants and programmes",
              },
              {
                url: "/contact-us",
                title: "Contact us",
              },
              {
                url: "/something-else",
                title: "Something else",
              },
              {
                url: "/resources",
                title: "Resources",
              },
            ],
            contactUsLink: "/contact-us",
            termsOfUseLink: "/terms-of-use",
            feedbackFormLink: "https://www.form.gov.sg",
            privacyStatementLink: "/privacy",
          },
        }
      })
    },
  },
  getNavbar: {
    default: () => {
      return trpcMsw.site.getNavbar.query(() => {
        return {
          id: 1,
          siteId: 1,
          content: [
            {
              url: "/item-one",
              name: "Expandable nav item",
              items: [
                {
                  url: "/item-one/pa-network-one",
                  name: "PA's network one",
                  description:
                    "Click here and brace yourself for mild disappointment.",
                },
                {
                  url: "/item-one/pa-network-two",
                  name: "PA's network two",
                  description:
                    "Click here and brace yourself for mild disappointment.",
                },
                {
                  url: "/item-one/pa-network-three",
                  name: "PA's network three",
                },
                {
                  url: "/item-one/pa-network-four",
                  name: "PA's network four",
                  description:
                    "Click here and brace yourself for mild disappointment. This one has a pretty long one",
                },
                {
                  url: "/item-one/pa-network-five",
                  name: "PA's network five",
                  description:
                    "Click here and brace yourself for mild disappointment. This one has a pretty long one",
                },
                {
                  url: "/item-one/pa-network-six",
                  name: "PA's network six",
                  description:
                    "Click here and brace yourself for mild disappointment.",
                },
              ],
            },
          ],
        }
      })
    },
  },
}
